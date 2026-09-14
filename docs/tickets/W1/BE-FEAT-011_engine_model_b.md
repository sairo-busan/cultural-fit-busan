# BE-FEAT-011: 추천엔진 Model B 전환

```
문제   CF8 스코어링이 옛 축곱셈(Model A) + placeTags 스키마 기준으로 짜여
       있어서, 9/10 회의에서 확정한 6분할 컬럼 합산(Model B) + DB_01/02/03
       스키마와 안 맞는다.
해결   엔진 모듈 7개(cf8Match·situationalScore·hardFilter·tripSetupMode·
       finalScore·reasonText·recommendEngine) 전면 재작성 + 서버(recommend.ts)·
       타입(types/place.ts)·API(weather·useRecommendations)를 새 스키마에 연결.
영향   S10 피드의 추천 순서·매칭점수가 바뀐다. GPS·위치 관련 기능 전부
       제거됨(도보 분·거리 표시 없음).
```

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | BE |
| Type | FEAT |
| Severity | Critical |
| Layer | Lib / Types / API / Hook |
| Status | Done |
| Depends | BE-FEAT-010(PR #19 — score_board/place_info/place_by_cf8 적재) |
| Related | FE-FEAT-009(PR #18 — `useRecommendations.ts` 동시 수정 중, 리베이스 필요) |

---

## Problem

9/10 팀 회의에서 스코어링 모델과 데이터 소스가 통째로 바뀌었다(`docs/decisions/
2026-09-11_DB필드_확정.md` 참고).

```
Model A(폐기)                    Model B(이 PR)
50+25×사용자축×장소축, 3축 평균    코드 3글자가 가리키는 6분할 컬럼 3개 합산
동행 6분류 0~100, 평균            동행 5분류, 선택한 컬럼들 합산
placeTags 컬렉션(49건, 임시)      score_board/place_info/place_by_cf8(120건 확정)
위치정보 프론트 GPS 사용          GPS 전면 제거(앱스토어 심사 리스크)
```

엔진 모듈 전부가 옛 필드명·계산식을 참조하고 있어서, 하나씩 갈아엎지 않으면
타입이 안 맞아 컴파일이 깨진다.

---

## Context

- 데이터: BE-FEAT-010(PR #19)이 적재한 `score_board`·`place_info`·`place_by_cf8`.
- 계산식 근거: `docs/decisions/2026-09-11_DB필드_확정.md`, 9/10 회의(엑셀
  시뮬레이터 `계산` 탭 — `H2=70×C2+90×D2+54×E2+36×F2+54×G2`, `÷18`, `ROUND`).
- 하드필터 null/false 원칙: 03A-4 `HF_WHEELCHAIR`.
- 소피 저장 계약: `src/types/trip.ts`(PR #15, 필드명·값 모두 엔진 표기).

---

## Scope

### 포함

- `src/lib/cf8Match.ts` — Model B 6분할 합산.
- `src/lib/situationalScore.ts` — 동행 합산, 날씨/계절/시간 단일컬럼.
- `src/lib/hardFilter.ts` — weatherType·is_restaurant·barrier_free·pet_allowed·
  current_context.
- `src/lib/tripSetupMode.ts` — 새 hardFilter·situationalScore 계약에 맞춤.
- `src/lib/finalScore.ts` — 축별 만점 기준 0~100 정규화(CALC_04).
- `src/lib/reasonText.ts` — DB_02(`whyKo`)/DB_03(`reasonByCf8`) 소스 전환.
- `src/lib/recommendEngine.ts` — GPS 제거, 새 계약으로 조립.
- `src/types/place.ts` — Model A 전용 필드 삭제, DB_01/02/03 기준 필드 추가.
- `src/data/mock-places.ts` — 타입 변경에 맞춘 보정.
- `src/lib/recommend.ts` — `score_board`/`place_info`/`place_by_cf8`/`places` 조인.
- `src/app/api/weather/route.ts` — 부산 고정 좌표.
- `src/hooks/useRecommendations.ts` — GPS 제거, 새 엔진 계약 반영.

### 제외

- S20 상세 화면 연결(`reasonByCf8`/`pickDetailReason` — 아직 화면 자체가 없음,
  FE-FEAT-010 소관).
- 음식 하드필터 — 팀 결정 대기, 값은 받되 필터링엔 안 씀(no-op).
- 근처 장소 추천 API — 별도 티켓.
- `/api/recommend?limit=100` 상한을 100→120으로 올리는 것 등 저장 탭 관련
  후속 조치는 PR#18 리뷰에서 별도로 안내함.

---

## 계산 로직 요약

```
CF8 매칭        코드[0] C→calmness/E→energy, [1] L→local/F→landmark,
                [2] D→stayDeeply/V→diverseExperience → 3개 합산 (0~9)
동행            주동행(솔로/친구·연인/부모님 중 1) + 아이 + 반려동물 컬럼 합산
날씨/계절/시간   접속 시점 자동 산출, 컬럼 하나 그대로
최종점수        각 축을 0~100 정규화(만점: CF8=9, 동행=8, 날씨/계절/시간=5)
                → CALC_04 비중(35/25/15/10/15)으로 가중평균, 없는 축은
                R031대로 재정규화
하드필터        barrier_free·is_restaurant·pet_allowed·weatherType.
                확인된 false만 제외, null(미등록)은 통과 + "확인 중"
```

⚠️ 동행 만점(8)은 임의 추정치다 — 원 엑셀 공식(90×동행, 만점5 가정)과
실제 DB_01 컬럼 만점(최대 3, 조합 시 최대 8)이 안 맞는다. 유나·태무 확인 대기
(소피 PR#15 "동행 점수 25%" 후속 제안과 같은 이슈).

---

## Verification

실제 DB 데이터로 전체 체인 검증(9/14):

```
score_board에서 "황령산 전망대" 조회 → calmness2/local2/stayDeeply2
cf8FitScoreFromCode("CLD", place) = 6   (기대: 2+2+2=6, 9/10 회의 예시와 일치)
"황령산"(전망대 아님) stayDeeply=3 → CLD 매칭 7   (기대: 2+2+3=7, 일치)
selectCompanionScore(솔로) = 2
selectCompanionScore(솔로+아이+반려) = 2+2+1 = 5
calculateFinalScore(...) = 64.58  (임의 컨텍스트, 비율만 확인)
applyHardFilter(barrierFree=null, 보행부담 선택) → 통과 확인(null이 안 막음)
```

```
tsc --noEmit   통과
lint           에러 0 (기존 feed/page.tsx 경고 1건은 main에서 넘어온 것, 안 건드림)
build          통과
```

`getRecommendations()`는 `score_board.contentId`가 9/14 기준 전부 null이라
지금은 빈 배열을 반환한다(BE-FEAT-010에 적어둔 알려진 이슈) — content_id가
채워지면 즉시 동작 시작.

---

## Implementation Notes

### PR#18과의 리베이스 지점

`src/hooks/useRecommendations.ts`를 소피 PR#18(FE-FEAT-009)도 크게 고치고
있다(날씨 슬롯 수정·에러 종류 분리·`forecastSlot` 노출). 이 PR은 GPS 제거와
새 엔진 계약(`EngineContext`에서 `userLocation` 삭제)만 건드렸다 — #18이
머지되면 이 파일에서 다시 충돌 나는 게 정상이고, 그때 두 변경을 합치면 된다.

### 저장 탭 100건 상한 (후속)

`/api/recommend`의 `limit` 상한이 100인데 DB_01은 120건이다 — 저장 탭이 전체
조회에 의존하는 구조(PR#18 리뷰에서 안내함)라 이대로면 100번째 이후 저장한
곳이 안 보인다. 다음 작업에서 상한을 올리거나 id 직접조회 API로 바꿔야 한다.

---

## Derived Artifact Naming Rule

```text
티켓 ID:     BE-FEAT-011
파일명:      BE-FEAT-011_engine_model_b.md
브랜치명:    feat/engine-model-b
```
