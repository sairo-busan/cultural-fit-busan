# BE-FEAT-010: 장소 데이터 파이프라인 — DB_01/02/03 임포트 + 무장애·반려동물 API

```
문제   placeTags 컬렉션(구 스키마)을 폐기하고 구글시트 DB_01/02/03 + TourAPI
       정본 places만으로 데이터를 다시 쌓는다. 하드필터에 쓸 무장애·반려동물
       정보를 공공데이터로 보강한다.
해결   임포트 스크립트 3개(score_board·place_info·place_by_cf8) +
       ingest-places.ts에 무장애(KorWithService2)·반려동물(KorPetTourService2)
       API 추가.
영향   앱 동작에는 아직 영향 없음 — 이 PR은 데이터만 쌓고, 아무 화면·API도
       새 컬렉션을 안 읽는다(BE-FEAT-011이 연결한다).
```

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | BE |
| Type | FEAT |
| Severity | High |
| Layer | Scripts / DB |
| Status | Done |
| Depends | — |
| Related | BE-FEAT-011(엔진 Model B 전환, 이 데이터를 실제로 읽음) |

---

## Problem

9/10 회의에서 CF8 스코어링 모델이 축 곱셈(Model A)에서 6분할 컬럼 합산(Model B)으로
바뀌면서, 데이터 소스도 옛 `placeTags`(92번 시트 태깅) 대신 유나가 새로 만든 구글시트
`DB_01 점수판`·`DB_02 장소정보`·`DB_03 CF8별 장소추천사유`로 완전히 교체됐다
(`docs/decisions/2026-09-11_DB필드_확정.md` 참고).

추가로 하드필터(보행부담·반려동물 동반)용 데이터가 92번 시트에 없어서, 공공데이터
포털의 무장애여행·반려동물동반여행 전용 API로 보강하기로 했다. 두 API 모두 커버리지가
낮다는 게 9/11 실측으로 드러났다(무장애 66.7%, 반려동물 15%) — 반려동물은 API만으로
부족해 유나 수작업 태깅이 필요하고, 이 스크립트가 그 시드값(확인된 18곳)을 만든다.

---

## Context

| 용도 | 자료 |
|---|---|
| 필드 확정 근거 | `docs/decisions/2026-09-11_DB필드_확정.md` |
| DB_01/02/03 컬럼 사전 | 구글시트 `DB_리스트` 탭(gid=1244098138) |
| 무장애 API | 한국관광공사 `KorWithService2` / `detailWithTour2` |
| 반려동물 API | 한국관광공사 `KorPetTourService2` / `areaBasedList2` |

⚠️ 구글시트 export URL을 Node에서 직접 부르면(fetch·curl 서브프로세스 둘 다) 최근
수정분이 안 반영된 스냅샷이 오는 문제가 재현됨(터미널에서 직접 curl은 항상 정상) —
원인 특정 못 함, 백엔드 샤드 라우팅 추정. 그래서 임포트 스크립트는 미리 터미널에서
받아둔 로컬 CSV(`docs/_internal/scratch/DB0N.csv`, gitignore됨)를 읽는다.

---

## Scope

### 포함

- `scripts/lib/csv.ts` — RFC4180 CSV 파서 공용화(옛 import-place-tags.ts·
  import-place-scores.ts에 중복 있던 걸 합침), `readSheetCsvFile()`.
- `scripts/import-db01-scoreboard.ts` — DB_01 120건 → `score_board` 컬렉션.
- `scripts/import-db02-placeinfo.ts` — DB_02 120건 → `place_info` 컬렉션.
- `scripts/import-db03-reasons.ts` — DB_03 960건(120곳×8유형) → `place_by_cf8`.
- `scripts/ingest-places.ts` — `detailWithTour2`(무장애)·`KorPetTourService2`
  목록 조회 추가, `places.accessibilityInfo`·`barrierFree`·`petFriendlyApi` 저장.
- 옛 `scripts/import-place-tags.ts`·`scripts/import-place-scores.ts` 삭제
  (placeTags 컬렉션 자체는 아직 안 지움 — BE-FEAT-011이 참조를 끊은 뒤 정리).

### 제외

- 엔진 로직(`src/lib/*`)·타입(`types/place.ts`)·API(`recommend.ts` 등) 연결 —
  BE-FEAT-011.
- `indoor_outdoor`·`pet_allowed` 시트 컬럼 자체 — 유나가 아직 안 만듦. 스크립트는
  후보 헤더 이름으로 찾고 없으면 null 처리하도록 방어적으로 짜둠(컬럼 생기면
  재실행만 하면 됨).

---

## Data Model

```
score_board (DB_01)      PK: placeId          120건
  calmness/energy/local/landmark/stayDeeply/diverseExperienceScore (0~3)
  solo/coupleFriend/parents/kids/petScore
  sunny/rainy/cloudyScore, spring/summer/autumn/winterScore, morning/afternoon/eveningScore
  contentId, indoorOutdoor(null — 유나 태깅 대기), petAllowed(시드값만)

place_info (DB_02)        PK: placeId          120건
  placeName, placeDesc(현재 placeholder "설명N")

place_by_cf8 (DB_03)      PK: `${cf8Code}:${placeId}`   960건
  recommendationReason(현재 placeholder)

places (TourAPI, 기존)    PK: contentId(_id)   2,219건 재적재
  + accessibilityInfo(원본 ~30필드) · barrierFree(파생) · petFriendlyApi(목록 포함 여부)
```

---

## 알려진 이슈 — content_id 미기재

`score_board.contentId`가 **9/14 기준 120건 전부 null**이다. 태무가 9/10 회의에서
"120개 콘텐츠 아이디 확인했다"고 한 건 엑셀 파일 기준이었을 가능성이 높고, 구글시트
DB_01 탭으로 옮기며 그 컬럼이 비었다.

Google Sheets API(`values.get`, JSON)로 직접 재확인해서 CSV 파싱 문제가 아니라 시트
자체가 비어 있는 걸로 확정함(9/14). 유나에게 채우기 요청함 — 채워지면 이 스크립트를
그대로 재실행하면 된다(멱등적 upsert).

이 PR은 "content_id가 있다"는 전제로 다음 단계(BE-FEAT-011)를 진행한다.

---

## Verification

```
node --env-file=.env.local --import tsx scripts/import-db01-scoreboard.ts
  → 120건 신규
node --env-file=.env.local --import tsx scripts/import-db02-placeinfo.ts
  → 120건 신규
node --env-file=.env.local --import tsx scripts/import-db03-reasons.ts
  → 960건 신규 (기대값과 일치)
node --env-file=.env.local --import tsx scripts/ingest-places.ts
  → 2,219건 upsert. 무장애 정보 183건, barrierFree=true 183건, petFriendlyApi=true 652건 확인
```

실제 점수 검증(황령산 CLD: calmness2+local2+stayDeeply3=7, 황령산 전망대 CLD:
2+2+2=6 — 9/10 회의 예시와 정확히 일치)은 BE-FEAT-011에서 엔진 코드와 함께 확인.

---

## Derived Artifact Naming Rule

```text
티켓 ID:     BE-FEAT-010
파일명:      BE-FEAT-010_place_data_pipeline.md
브랜치명:    feat/place-data-pipeline
```
