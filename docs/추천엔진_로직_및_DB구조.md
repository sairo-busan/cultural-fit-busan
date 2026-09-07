# 추천엔진 로직 및 DB 구조

에린 작성. 태무 구두 설명(회의) + 정본 구글시트 실데이터 대조로 확정. 정본: `[최] SAIRO 통합본` "CF8추천구조" 탭([링크](https://docs.google.com/spreadsheets/d/1-6usA2CWMCKvUWf53SJRWwzkuvRBmwpE_H958bWAGWE/edit?gid=1126787505)), "92번 v5 상세 태깅" 탭.

이전 문서 `docs/추천_알고리즘_명세서_v2.md`(CFP16 기준)를 대체한다.

**9/10 회의 전까지 이 문서 기준으로 추천엔진 개발 착수.**

---

## 1. CF8추천구조 시트 — 실제 컬럼 구조 (F~AH열)

13행 샘플로 존재(`scoring_status: SAMPLE_NEEDS_REVIEW`, 실데이터 아님 — "계산 구조 검증용"). 컬럼 구조 자체는 확정으로 보고 개발 기준으로 삼는다.

### F~X — 장소별 불변 기준정보 (적재 대상)

| 열 | 컬럼명 | 값 범위 | 비고 |
|---|---|---|---|
| F | `cf_atmosphere` | −2~+2 | CF8 분위기축 원점수 |
| G | `cf_local_famous` | −2~+2 | CF8 장소축 원점수 |
| H | `cf_deep_variety` | −2~+2 | CF8 경험축 원점수 |
| I~N | 동행유형별 점수 | 0~100 | **혼자·연인과·친구와·부모님과·아이와·반려동물과 — 6종**(기존에 4종으로 알고 있었던 것보다 많음) |
| O~Q | 날씨별 점수 | 0~100 | SUNNY·RAINY·CLOUDY 3종 |
| R~U | 계절별 점수 | 0~100 | 봄·여름·가을·겨울 4종 |
| V~X | 시간대별 점수 | 0~100 | 오전·오후·저녁 3종 |

### Y~AH — 요청마다 계산되는 값 (저장 안 함, 스냅샷 테이블 후보)

| 열 | 컬럼명 | 설명 |
|---|---|---|
| Y | `CF8_score` | 사용자 CF8 3축과 장소 F/G/H 매칭 점수(계산식 미확인) |
| Z | 선택_동행점수 | I~N 중 사용자가 선택한 동행유형 값 |
| AA | 선택_날씨점수 | O~Q 중 현재 날씨 값 |
| AB | 선택_계절점수 | R~U 중 현재 계절 값, AD 계산에 10% 비중으로 포함 |
| AC | 선택_시간점수 | V~X 중 현재 시간대 값 |
| AD | **최종점수** | `Y×0.35 + Z×0.25 + AA×0.15 + AB×0.10 + AC×0.15` — 13개 샘플 전부 회귀분석으로 검증, 9개 완전일치·4개 반올림오차 0.1 이내. **관광가치점수(E)는 최종점수에 포함 안 됨** |
| AE | `eligible` | Y/N — Hard Filter 통과 여부로 추정 |
| AF | `rank` | 최종 순위 |
| AG | 추천이유 | 룰 기반 문장(예: "EFV 취향·혼자·SUNNY·봄·저녁 조건 반영") |
| AH | `scoring_status` | 데이터 신뢰도 상태 |

---

## 2. 계산 흐름

```
1. 사용자 CF8 진단(3문항) + 동행구조·걷기여력(S03, 미구현) 입력 → 클라이언트 저장
2. 피드 화면 진입(또는 재진입)
3. 클라이언트 → 서버: cf8_code, trip_setup(동행유형), 접속시각(→시간대 변환)
   ※ 계절은 서버에서 현재 날짜로 자체 판단(사용자 입력 불필요), AD 계산에 포함
   ※ 좌표는 전송 안 함(위치정보 원칙)
4. 서버:
   a. Hard Filter (음식 제약 등)
   b. 후보 장소의 F~X 조회
   c. 사용자 CF8·동행유형·시간대(·날씨)로 Y~AC 산출
   d. AD(최종점수) 계산 → AF(랭크) 정렬 → AG(추천이유) 생성
5. 서버 → 클라이언트: 랭크 매겨진 전체 장소 리스트(목표 120건)
6. 화면 재진입 시 3~5 반복 — 폴링 아니고 진입 시점 재조회
```

### 상황값 반영 요소

시간대·날씨·**계절** 전부 반영한다. 계절은 AD 계산식에서 10% 비중을 차지한다(아래 공식 참고). 서버가 현재 날짜로 자체 판단 가능해 사용자 입력은 불필요.

---

## 3. DB 구조

### 3-1. 원칙 — 별도 컬렉션보다 `placeTags` 확장을 권장

CF8추천구조(F~X)는 `placeTags`와 **같은 사람(유나)이 같은 주기로 관리하는 큐레이션 데이터**라, 별도 컬렉션으로 쪼개기보다 `placeTags`에 필드로 추가하는 걸 권장한다(몽고DB는 조인 비용이 크므로, 소유권·갱신주기가 같은 데이터는 한 문서에 모으는 게 유리 — 팀 논의에서 이미 합의된 원칙).

**추가할 필드(스키마만 미리 만들고, 실데이터는 샘플 상태라 당분간 null)**:

```typescript
// placeTags에 추가
cfAtmosphereScore: number | null;   // -2~+2
cfLocalFamousScore: number | null;  // -2~+2
cfDeepVarietyScore: number | null;  // -2~+2
fitParents: number | null;          // 0~100, 부모님과
fitKids: number | null;             // 0~100, 아이와
fitPet: number | null;              // 0~100, 반려동물과
weatherScoreSunny: number | null;
weatherScoreRainy: number | null;
weatherScoreCloudy: number | null;
seasonScoreSpring: number | null;
seasonScoreSummer: number | null;
seasonScoreFall: number | null;
seasonScoreWinter: number | null;
timeScoreMorning: number | null;
timeScoreAfternoon: number | null;
timeScoreEvening: number | null;
```

기존 `fitSolo`/`fitCouple`/`fitFriends`/`fitFamily`(4종)와 I~N열(6종: 혼자·연인·친구·부모님·아이·반려동물)이 안 맞음 — `fitFamily`를 `fitParents`+`fitKids`로 쪼개거나 매핑 재정의 필요.

### 3-2. 산출결과(스냅샷) 테이블 — 새 컬렉션 필요

Y~AH는 요청마다 계산되는 값이라 `placeTags`에 안 들어가고 별도 컬렉션(`recommendationSnapshots` 등)으로: PK 개념 = 유저ID+장소ID, **누적 저장 불필요, 최신 것만 유지**.

### 3-3. 전체 구조

| 컬렉션 | 역할 |
|---|---|
| `places` | TourAPI 원본 (기존 2,231건) |
| `placeTags` | F~X 포함 확장(위 3-1) — CF8 매칭용 |
| `recommendationSnapshots`(신규) | Y~AH 산출결과, 유저+장소 PK, 최신값만 |

---

## 4. 확인 필요 목록 (태무에게 질문할 것)

- [x] ~~AD(최종점수) 정확한 산출 공식~~ → `Y×0.35+Z×0.25+AA×0.15+AB×0.10+AC×0.15`로 회귀분석 검증 완료(계절 10% 포함, 위 참고)
- [ ] `CF8_score`(Y열) 계산식 — 사용자 3축 원점수와 장소 F/G/H를 어떻게 비교하는지
- [ ] `eligible`(AE) 판정 기준 — Hard Filter와 동일한지 별도 조건이 있는지
- [ ] 마스터 데이터 120건 복구 일정
- [ ] 문구 구조 상세본(다음 주 목요일 예정)

---

## 5. 그 외 확정 사항 (지난 회의 정리, 변경 없음)

- 실시간 LLM 문구 생성 안 함 — 사전 생성 + DB화 + 룰 기반 조합
- 장소 상세 운영정보는 실시간 TourAPI 호출
- "이곳 대신 갈만한 곳" = 가까운 곳 기준
- 저장 기능은 장소 ID만 저장
- 언어는 국문 우선, 영문은 추후 번역
- 데이터 fetch 시점(한번에 vs 나눠서)은 두 방식 다 구현 후 실측 비교로 결정
