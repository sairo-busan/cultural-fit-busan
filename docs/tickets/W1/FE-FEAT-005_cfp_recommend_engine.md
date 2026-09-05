# FE-FEAT-005: CF8 추천 엔진 (클라이언트)

사용자 CF8 유형(3축)과 장소 데이터를 결합해 추천 목록을 계산한다. 전부 클라이언트에서 실행 — 서버는 개인화된 계산을 하지 않는다. [BE-FEAT-005](BE-FEAT-005_cfp_match_engine.md)를 대체. 2026-09-03 CF8 전환 시 1차 재작성(글자비교 방식), 2026-09-05 정본 시트 전체 재감사로 실제 축 연속점수 데이터를 확보해 계산식을 확정하며 2차 재작성.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | FE |
| Type | FEAT |
| Severity | Critical |
| Layer | Lib / Hook |
| Status | In Progress |
| Screen | S10, S20, S21(구 S30), S36(구 S44) |
| Depends | FE-FEAT-001(CF8 진단 3문항, 완료), BE-FEAT-006(`/api/recommend` 단순화, 완료), BE-FEAT-007(placeTags 확장, 진행중) |
| Related | 담당은 에린(추천 엔진 설계자). **티켓 접두사는 FE지만 소피가 짜는 코드가 아님** — 위치·CF8·trip_setup 등 개인 프로필 데이터가 기기 밖으로 나가면 안 되어서 코드가 브라우저에서 실행될 뿐, 소유자는 에린([위치 정보 사용 리스크 검토](https://app.notion.com/p/3c92178256a88009895dfad11322b28c) 참고) |

---

## 아키텍처 — 서버/클라이언트 책임 분리

**서버(`/api/recommend`, BE-FEAT-006/007, 완료)**:
- `places`(TourAPI 원본) + `placeTags`(유나 태깅, CF8 3축·코스역할 포함) 조인한 **62건 전체를 그대로 반환**
- 개인화 없음, 정렬 없음. **사용자 정보(CF8코드·trip_setup·GPS) 파라미터 자체가 없음** — 서버에 안 보냄

**클라이언트(이 티켓, FE-FEAT-005)**:
- localStorage의 CF8코드·trip_setup 읽기
- `/api/recommend` 응답(62건) 받아서 **CF8 축매칭 → 하드필터 → 상황보정 → 최종점수 → 정렬**을 전부 브라우저에서 계산
- 거리 계산(GPS 절대 서버로 전송 안 함)
- 날씨는 `/api/weather`(API키 필요, 서버 프록시) 응답을 받은 뒤 그 값으로 점수 계산하는 부분은 클라이언트

---

## Context

```
정본: [최] SAIRO 통합본 구글시트
(https://docs.google.com/spreadsheets/d/1-6usA2CWMCKvUWf53SJRWwzkuvRBmwpE_H958bWAGWE)

CF8 = 3축 2지선다 (기존 CFP16/4축16유형 대체)
- 분위기: C(차분함)=-1 / E(에너지)=+1
- 장소:   L(로컬)=-1 / F(대표명소)=+1
- 경험:   D(깊게 머무름)=-1 / V(다양하게 경험)=+1
- 유형코드 = 3답 이어붙이기 (예: C+L+D → CLD). 8종: CLD/CLV/CFD/CFV/ELD/ELV/EFD/EFV

2026-09-05 확정된 것 (docs/구글시트_데이터_감사.md, docs/추천엔진_로직_및_DB구조.md 참고):
- 장소별 축 연속점수(cf_atmosphere/cf_local_famous/cf_deep_variety, -2~+2)가
  "11_장소점수_62" 탭에 62건 전체 실데이터로 존재 → placeTags에 임포트 완료
- 공식: axis_match_score = 50 + 25 × user_axis × place_axis (0~100)
        cf_fit_score(Y) = 3축 평균
  → "12_CF8매칭검증" 탭 실데이터 496건(62곳×8유형) 전수 대조로 검증 완료, 불일치 0건
  → src/lib/cf8Match.ts 로 구현 완료(2026-09-05)
- 이전 버전(글자비교 3/3=70점 방식)은 폐기 — 축 연속점수가 실제로 존재하므로 근사치 대신
  정확한 공식 사용
```

---

## Scope

### 포함

- 사용자 CF8 코드 읽기(localStorage, `cf8_code`) — FE-FEAT-001 진단 결과 소비
- **CF8 3축 매칭**: `src/lib/cf8Match.ts`(완료) — `cf8FitScoreFromCode(cf8Code, place)` 호출
- **UNKNOWN 축 재정규화**(04_추천로직 R031): 장소 축점수가 null이면 그 축 제외하고 나머지로 평균 — cf8Match.ts에 이미 반영됨
- Hard Filter(후보 제외): 음식 제약(`hasRaw`/`hasMeatOnly`/`hasSeafoodOnly`), `coverage < 40`. 접근성(`wheelchairAccessible` 등)은 데이터가 전부 null이라 지금은 실질 필터링 안 됨 — null을 "확인 필요"로만 표시, 제외하지 않음
- **상황 보정**: 동행유형·날씨·계절·시간대 점수(placeTags의 `companionScore*`/`weatherScore*`/`seasonScore*`/`timeScore*`) — ⚠️ 예시_CF8추천구조 62건 데이터가 아직 유나 쪽에서 안 옴(카톡 발송, 대기중). 그 전까진 이 축들이 전부 null → R031 재정규화로 CF8 매칭 비중만으로 계산됨
- **최종점수**: `03A-2_CF점수기준 CALC_04` 공식(CF35%+동행25%+날씨15%+계절10%+시간15%) 기반, 단 null인 축은 제외 후 재정규화(R031) — CALC_04 자체가 DRAFT 상태라 최종 확정 여부 확인 필요
- `trip_setup_mode` QUICK/CUSTOM 분기(04_추천로직 R024): QUICK=CF8+자동상황만, CUSTOM=trip_setup 옵션 추가 적용
- GPS 미사용 — 사용자가 선택한 출발 장소 좌표 기준 haversine 거리·도보시간 계산(BE-FEAT-006에서 옮긴 `distanceMinutes()` 재사용)
- 추천 이유 문장(규칙 기반, LLM 미사용, 04_추천로직 R060 참고)

### 제외

- 예시_CF8추천구조 62건 실데이터가 오기 전까지는 동행·날씨·계절·시간대 상황보정 실동작 불가(스텁/null로 처리, 로직 자체는 미리 구현)
- 검색 API 연동 — 팀 결정으로 보류
- 도착 안내(S36)·문화 충돌 안내(S21) 상세 UI — 이 티켓은 점수 계산 로직까지만
- `recommendationSnapshots` — 저장 안 하기로 결정(2026-09-05, 추천엔진_로직_및_DB구조.md §3-2 참고), 매 요청 즉시 계산만

---

## Strategy

### Step 1: ✅ `placeTags` 스키마 확장 — 완료(BE-FEAT-007)
### Step 2: ✅ `11_장소점수_62` 임포트(CF8 3축·코스역할 7종) — 완료
### Step 3: ✅ 92_V5상세태깅60 `review_status` 확인 — 필드 없음 확정, `coverage`가 게이트 역할 대체 중이라 조치 불필요
### Step 4: ✅ `recommendationSnapshots` 생략 결정 — 완료
### Step 5: ✅ CF8 축 매칭 함수(`src/lib/cf8Match.ts`) — 완료, 496건 검증
### Step 6: 하드필터 로직 — 음식제약(기존 구현) + 접근성 UNKNOWN 처리(제외 아님, 표시만)
### Step 7: 상황보정 점수 추출 함수 — companionScore/weatherScore/seasonScore/timeScore 선택 로직(데이터 오면 바로 동작하게 미리 구현)
### Step 8: 최종점수 계산 — CALC_04 가중치 + R031 재정규화 결합, **에린 확인 필요**(고정가중치 vs 재정규화 우선순위)
### Step 9: `trip_setup_mode` QUICK/CUSTOM 분기 로직
### Step 10: 클라이언트 훅/모듈 조립(`src/lib/recommendClient.ts` 또는 협의된 위치, "use client" 경계) — `/api/recommend` 호출 → 전체 파이프라인 실행 → 정렬된 목록 반환
### Step 11: S10 피드 화면에 연결(현재 목데이터 대체)
### Step 12: QA(`/qa`)

---

## Acceptance Criteria

- [ ] 사용자 좌표·CF8코드·trip_setup이 네트워크 요청(서버로 나가는 것)에 전혀 포함되지 않음(개발자 도구 Network 탭으로 확인)
- [ ] 음식 제약이 있는 사용자에게 `hasRaw=true` 등 해당 장소가 목록에서 완전히 사라짐
- [ ] CF8 축 매칭 점수가 `cf8Match.ts`의 공식과 일치(496건 검증 완료 — 회귀 없는지만 재확인)
- [ ] 장소의 축점수가 null이어도 에러 없이 계산되고, 해당 축만 제외한 평균으로 처리됨(R031)
- [ ] 접근성 필드가 null인 장소가 제외되지 않고 목록에 남되, 상세 화면에서 "정보 확인 중"으로 표시됨
- [ ] `trip_setup_mode`가 QUICK이면 S03 옵션 없이도 정상 계산됨

---

## Testing Rules

- 유닛테스트 프레임워크 미도입 — 수동 검증 + 계산 로그(`console.debug`)로 필터 통과 여부·축점수 확인

---

## Verification

| # | 시나리오 | 입력 | 기대 결과 |
|---|---|---|---|
| 1 | CF8 완전 일치 | 사용자 `EFV`, 장소 축점수가 EFV 방향과 완전히 일치 | cf_fit_score 100 |
| 2 | CF8 정반대 | 사용자 `CLD`, 장소가 EFV 방향 | cf_fit_score 0에 근접 |
| 3 | 음식 제약 제외 | `no_raw` 사용자 + `hasRaw=true` 장소 | 목록에서 완전히 사라짐 |
| 4 | 축 UNKNOWN | 장소의 `cfDeepVarietyScore=null` | 에러 없이 나머지 2축 평균으로 계산 |
| 5 | 상황보정 데이터 없음 | `companionScore*` 전부 null(현재 상태) | CF8 매칭만으로 계산(재정규화), 에러 없음 |

---

## Implementation Notes

### 2026-09-05: CF8 3축 매칭 함수 구현

- `src/lib/cf8Match.ts` 작성 — `parseCf8Code`, `cf8FitScore`, `cf8FitScoreFromCode`
- 공식 `50+25×user_axis×place_axis` → 3축 평균, UNKNOWN 축은 제외 후 재정규화(R031)
- `12_CF8매칭검증`(gid=319874358) 실데이터 62곳×8유형=496건 전수 대조 검증, 불일치 0건
- 아직 어떤 화면/모듈에서도 호출 안 함 — Step 10(클라이언트 조립)에서 실제 연결 예정
