# BE-FEAT-014: 시트 재적재 — content_id·DB_02 확장·DB_03 실제 문구

```
문제   유나가 시트를 다 채웠는데(9/15) DB엔 옛 스냅샷(빈 값)이 그대로 있다
해결   DB_01/02/03 재적재 + DB_02 신규 6컬럼 임포트 코드 추가 + pet_allowed 시드
```

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | BE |
| Type | FEAT |
| Severity | Critical |
| Layer | Script |
| Status | Done |
| Depends | BE-FEAT-010(임포트 스크립트 뼈대) |
| Related | BE-FEAT-011(엔진, whyEn/titleEn 연결 코드는 이미 있음) · BE-FEAT-013(장소 상세 API, 이 작업 결과에 의존) |

---

## Problem

9/14 기준으로 "content_id 0/120", "DB_02/03 비어있음"으로 확인해서 그렇게 임포트했는데,
9/15에 팀이 실제로 채웠다. 시트는 채워졌지만 DB는 그 스냅샷 그대로다.

| 시트 | 상태(9/15 재확인) |
|---|---|
| DB_01 `대표컨텐츠ID` | 120/120 (이전 0/120에서 채워짐) |
| DB_01 `indoor_outdoor`·`pet_allowed` | 컬럼 자체가 아직 없음 — 이번 스코프 아님 |
| DB_02 `place_desc` | 120/120 |
| DB_02 `place_name_en`·`place_desc_en`·`cultureGuideText_ko`(도슨트_간단히/자세히/놓치기쉬운것)·`cultureGuideText_en` | 6칸 신규, 전부 120/120 — 근데 `import-db02-placeinfo.ts`가 이 칸들 자체를 안 읽음 |
| DB_03 `recommendation_reason` | 960/960 (이전 빈 값으로 임포트됨) |

---

## Scope

### 포함

1. `import-db01-scoreboard.ts` 재실행 — 코드 변경 없음, content_id만 새로 들어옴
2. `import-db02-placeinfo.ts` — 헤더 6개 추가 임포트
   ```
   place_name_en, place_desc_en,
   cultureGuideText_ko (도슨트_간단히), cultureGuideText_ko (도슨트_자세히),
   cultureGuideText_ko(놓치기 쉬운 것), cultureGuideText_en
   ```
   "놓치기 쉬운 것"은 "관람 순서: …\n사진 포인트: …\n유의사항: …" 3줄이 한 칸에 들어있다 —
   시트 원본 표기를 그대로 저장하는 원칙(#20 PR 리뷰)대로 파싱 없이 원문 그대로
   `guideTipsRawKo`에 저장한다. 라벨별로 나누는 건 BE-FEAT-013(API 계약)에서 한다.
3. `import-db03-reasons.ts` 재실행 — 코드 변경 없음, 문구만 새로 들어옴
4. `scripts/seed-pet-allowed.ts` 신규 — `places.petFriendlyApi=true`인 곳을
   `score_board.petAllowed`에 시드(이미 값이 있으면 안 덮어씀). 결과 개수를 유나에게
   "나머지 몇 곳만 조사해달라"로 전달할 근거로 쓴다.

### 제외

- `indoor_outdoor`·`pet_allowed` 태깅(유나) — 시트에 컬럼 자체가 없어서 할 수 없음
- `place_type` — 미정, 별건
- 영문 콘텐츠ID 연결·`EngService2` 적재 — BE-FEAT-013 소관
- `recommend.ts`의 whyEn/titleEn 연결 코드 — BE-FEAT-011(PR#20)에서 이미 작성함, 이 PR은
  데이터만 채운다(코드는 그대로 두면 자동으로 값이 나옴)

---

## Verification

```
재적재 후 MongoDB 직접 확인:
- score_board.contentId 채워진 문서 수: 120/120
- place_info.placeNameEn / placeDescEn / guideDetailKo / guideEn 채워진 문서 수: 120/120 각각
- place_by_cf8.recommendationReason non-null 문서 수: 960/960
- seed-pet-allowed 실행 로그: petAllowed=true로 새로 세팅된 문서 수
```

`getRecommendations()`가 이제 빈 배열이 아니라 실제 후보를 반환하는지 별도로 확인
(BE-FEAT-011 PR#20이 먼저 머지돼야 엔진이 읽지만, 데이터 자체는 이 PR로 준비된다).

```
tsc --noEmit   통과
lint           에러 0
```

---

## Implementation Notes

- 임포트는 항상 로컬 CSV 파일 경유(`readSheetCsvFile`) — Node의 구글시트 export URL 직접
  호출이 스냅샷 지연을 일으키는 문제(scripts/lib/csv.ts 주석) 때문에 매번 Bash `curl`로
  먼저 받는다.
- DB_02는 물리명(영문 헤더)/논리명(한글 헤더) 2행짜리 헤더 — 데이터는 3행부터, 기존
  필터(`place_id.startsWith("plc_")`)가 그대로 두 헤더 행을 걸러낸다.

---

## Derived Artifact Naming Rule

```text
티켓 ID:     BE-FEAT-014
파일명:      BE-FEAT-014_sheet_reimport.md
브랜치명:    fix/sheet-reimport
```
