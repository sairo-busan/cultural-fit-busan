# BE-FEAT-015: 영문 필드 1차(petConditionEn·guideTipsRawEn·recommendationReasonEn)

영문 필드 감사(`docs/decisions/2026-09-16_영문필드_감사.md`)에서 누락으로 확인된 3개
필드를 LLM 번역으로 채우고 `GET /api/place/[id]` 응답에 반영한다.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | BE |
| Type | FEAT |
| Severity | Medium |
| Layer | Lib / Script |
| Status | Done |
| Screen | S20 (장소 상세) |
| Depends | BE-FEAT-013(placeDetail.ts) |
| Related | - |

---

## Problem

- **현재 동작**: `petConditionEn`·`guideTipsRawEn`·`recommendationReasonEn` 필드가
  DB에 없어 영문 화면에서 반려동물 조건·놓치기 쉬운 것·추천사유가 전부 숨겨진다.
- **기대 동작**: 세 필드를 LLM 번역으로 채우고 `PlaceDetail` 응답에 포함한다.
- **영향 범위**: `src/lib/placeDetail.ts`, `score_board`·`place_info`·`place_by_cf8`
  3개 컬렉션.

---

## Context

```
관련 파일:
- src/lib/placeDetail.ts
- scripts/fill-pet-condition-en.ts (신규)
- scripts/fill-guide-tips-en.ts (신규)
- scripts/fill-recommendation-reason-en.ts (신규)

외부 의존:
- 없음(전부 LLM 직접 번역 — fill-addr-en-llm.ts와 같은 원칙, DRAFT 취급)
```

### petConditionEn(score_board, 119건)

`petCondition` 값이 실제로는 9개 문구만 반복(119건 전체가 9개 문구의 조합) —
문구 단위로 번역해 `updateMany`로 일괄 적재.

### guideTipsRawEn(place_info, 119건)

`guideTipsRawKo`는 장소마다 다른 3줄 원문("관람 순서:/사진 포인트:/유의사항:")이라
119건 전부 개별 번역. 라벨도 영문("Route:"/"Photo spot:"/"Caution:")으로 옮겨
`guideTipsRawKo`와 같은 3줄 구조를 유지 — `placeDetail.ts`의 `parseTips`와 대칭되는
`parseTipsEn`을 붙일 수 있게.

### recommendationReasonEn(place_by_cf8, 952건)

**전수 번역이 아니라 템플릿 조립.** 감사 전엔 952건(120곳×8유형) 전부 다른 문장인
줄 알았는데, 뜯어보니 전부 아래 구조의 조합이었다(사전 검증 스크립트로 확인,
prefix 불일치 0건):

```
{placeDesc}입니다. {절A} {절B} {절C} {마무리}
```

- 절A(4종) — 장소의 분위기/속도
- 절B(4종) — 지역색/명소성
- 절C(4종) — 머무는 시간/경험 폭
- 마무리 — cf8Code 8종에 1:1 고정

4×4×4=64 조합(실측 63종) + 마무리 8종 = **20개 조각만 번역**하고, `placeDescEn`
(이미 120/120 확보)과 조립해 952건을 생성했다. 전수 번역 대비 작업량이 크게
줄었고, 문구 일관성도 더 높다.

---

## Scope

### 포함

1. `scripts/fill-pet-condition-en.ts` — petConditionEn 9문구 번역 적재
2. `scripts/fill-guide-tips-en.ts` — guideTipsRawEn 119건 개별 번역 적재
3. `scripts/fill-recommendation-reason-en.ts` — recommendationReasonEn 템플릿
   조각 20개 번역 후 952건 조립 적재
4. `src/lib/placeDetail.ts` — `PlaceDetail` 계약에 `petConditionEn`·`tipsEn`·
   `reasonByCf8En` 추가, `parseTipsEn` 신규

### 제외

- 화면단 반영(`PlaceContent.tsx`의 표시 조건문 수정) — 소피 요청, 별도 PR
- `guideEn`→`guideDetailEn` 리네이밍 + `guideSimpleEn` 신규 — 별도 티켓(도슨트
  구조 변경)

---

## Verification

1. `npx tsc --noEmit` — 통과(main 자체의 `privacy/page.tsx` 기존 에러는 무관,
   stash 비교로 확인)
2. DB 적재 건수 확인 — petConditionEn 119/119, guideTipsRawEn 119/119,
   recommendationReasonEn 952/952 전부 매칭

---

## Implementation Notes

### 2026-09-17: 3개 필드 번역 + 적재 + API 반영

recommendationReason이 템플릿 조합이라는 걸 사전 분석 스크립트로 발견해서 952건
전수 번역을 20개 조각 번역으로 줄임. 화면단 조건문 해제는 소피에게 카톡으로
요청 완료(별도 PR 대기).
