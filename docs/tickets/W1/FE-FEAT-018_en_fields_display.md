# FE-FEAT-018: S20 영문 화면 — 추천사유 · 반려동물 조건 · 놓치기 쉬운 것 · 무장애

영문 화면에서 막아 둔 네 칸을 영문 필드로 읽어 보이고, 영문 가이드를 `guideDetailEn` 으로 읽는다.

## Metadata

| Key | Value |
|---|---|
| Prefix | FE |
| Type | FEAT |
| Severity | Medium |
| Layer | Screen |
| Status | In Progress |
| Screen | S20 장소 상세 (en) |
| Branch | `feat/en-fields-display` (워크트리 `cfb-en-fields`, `origin/main` 기준) |
| Depends | BE-FEAT-015 (PR #46 — `reasonByCf8En` · `petConditionEn` · `tipsEn`) · BE-FEAT-016 (PR #47 — `guideDetailEn`) · BE-FEAT-019 (PR #51 — `accessibilityEn`) |
| Related | FE-FEAT-013 (놓치기 쉬운 것이 S23 으로 옮겨간다) |

---

## Problem

`PlaceContent.tsx` 는 영문 화면에서 네 칸을 숨긴다. 한국어 값만 있었기 때문이다.

| 칸 | 지금 코드 | 영문 화면 |
|---|---|---|
| 추천사유 | `!en && cf8Code ? place.reasonByCf8[cf8Code] : null` | 안 보임 |
| 반려동물 조건 | `!en && place.petAllowed ? place.petCondition : null` | 안 보임 |
| 놓치기 쉬운 것 | `en ? [] : … place.tipsKo …` | 안 보임 |
| 무장애 정보 | `en ? [] : place.accessibility…` | 목록 안 보임 · 요약 칸은 "있음" 인데 눌러도 이동 없음 |

문화 가이드는 영문 화면이 `guideEn` 을 읽는데, 119곳 모두 이전 원고 기준이라 한국어 화면과 내용이 다르다.

PR #46 · #47 · #51 로 영문 값이 응답에 들어온다. 조건만 풀면 영문 화면에 한국어가 보이므로, 영문일 때 영문 필드를 읽도록 바꾼다.

---

## Context

### 데이터 (2026-09-17 실측, `cultural_fit_busan`)

| 필드 | 채움 |
|---|---|
| `place_by_cf8.recommendationReasonEn` | 952 / 952 |
| `score_board.petConditionEn` | 119 |
| `place_info.guideTipsRawEn` | 119 (`Route:` · `Photo spot:` · `Caution:` 세 줄) |
| `place_info.guideDetailEn` | 119 (지금 한국어 원고 번역) |
| `place_info.accessibilityInfoEn` | 43 / 43 (한국어 무장애가 있는 곳 전부, 키 구조 같음) |

- #51 의 주간 재적재는 한국어 원문이 바뀌면 영업시간 · 무장애 영문 필드를 지운다. 영문 값은 언제든 비어 있을 수 있다
- 추천 119곳 중 59곳은 `places` 영업정보 · 소개가 비어 있다(9/14 적재 실패, #51 코멘트). 재적재 전에는 이 곳들의 무장애 · 영업시간 확인이 안 된다

### 추천사유 앞머리 자르기

`reasonWithoutLead(reason, lead)` 는 사유가 설명문으로 시작하면 설명문 문장을 뗀다. 영문 사유 952건 모두 `placeDescEn` 으로 시작한다.

영문 설명문 119곳 중 **6곳은 마침표로 끝난다** — 사유로는 48건(6곳 × 8유형). 지금 함수는 설명문을 뗀 뒤 다음 마침표까지 한 번 더 지워서, 이 6곳은 사유 본문 한 문장이 사라지고 마무리 문장만 남는다.

```
설명문  A history museum where you can encounter Busan as the temporary capital during the Korean War.
원문    {설명문} The calm atmosphere makes it easy to explore … story. For these reasons, …
지금    For these reasons, …
```

한국어는 설명문 뒤에 `입니다.` 가 붙는 구조라 영향이 없다.

---

## Scope

### 포함

- 추천사유 — `en ? reasonByCf8En : reasonByCf8`, 앞머리 기준은 `en ? descEn : descKo`
- 반려동물 조건 — `en ? petConditionEn : petCondition`
- ~~놓치기 쉬운 것 — `en ? tipsEn : tipsKo`~~ → FE-FEAT-013(#54)에서 S23 로 옮기며 해결. S23 이 `tipsEn` 을 읽는다
- 무장애 — `en ? (accessibilityEn ?? []) : accessibility`. 요약 칸의 "있음" 과 목록 이동도 같은 배열 기준
  - `accessibilityEn` 은 #51 이 응답에 추가한다(`{ key, text }[]`, 한국어와 같은 모양). 화면이 먼저 읽어 두면 #51 머지 · 배포 후 **앱 업데이트 없이** 영문 무장애가 보인다. 그 전에는 영문 화면에서 지금처럼 숨는다
- `reasonWithoutLead` — 설명문이 마침표로 끝나면 추가로 지우지 않는다
- ~~영문 가이드 — `place.guideEn` → `place.guideDetailEn`~~ → 문화 가이드가 S23 로 옮겨가며 해결. S23 이 `guideSimpleEn` · `guideDetailEn` 을 읽는다. S20 은 `guideEn` 을 더 읽지 않는다
- "한국어뿐이다" 주석 정리
- 전화 — 영문 화면은 번호만 보인다. TourAPI 원문(`operationInfo.infocenter*`) 114곳 중 35곳이 앞에 부서명(한국어)을 붙여 온다(`부산 중구청 문화관광과 051-600-4046`). 번호가 둘이면 두 줄, 번호가 없는데 한국어가 남으면 숨긴다. 한국어 화면은 부서명 그대로
  - 국립부산과학관(2385666)은 원문이 `1422-23` — 번호 모양이 아니라 전화 걸기가 붙지 않는다. 비짓부산 공식 번호는 `051-750-2300`. TourAPI 원문이라 시트가 아니라 적재 단계에서 고쳐야 한다

### 제외

| 항목 | 근거 |
|---|---|
| 문구 (`messages/*.json`) | 라벨 `tips.photo` · `tips.caution` · `accessibility.*` 영문이 이미 있다 |
| 영업시간 영문 폴백 | #51 이 `hoursEn` 응답에서 처리한다. 화면은 이미 `hoursEn ?? hours` |

---

## Acceptance Criteria

- [x] 영문 화면에 추천사유가 보이고, 설명문 문장이 되풀이되지 않는다 — 952건 중 되풀이 0 · 빈 결과 0 (DB 실측)
- [x] 설명문이 마침표로 끝나는 6곳도 사유 본문 문장이 남는다 — 48건 모두 본문 첫 문장부터 남음
- [ ] 반려동물 가능 장소의 영문 화면에 조건이 영문으로 보인다
- [x] 영문 화면에 놓치기 쉬운 것(사진 포인트 · 유의사항)이 영문으로 보인다 — S23(#54)
- [x] 영문 화면의 전화 칸에 한국어 부서명이 섞이지 않는다 — 114곳 중 한국어 0
- [ ] 영문 화면 어디에도 한국어 문장이 섞이지 않는다 — 영업시간 · 휴무일은 #51 이 채운다
- [ ] 영문 화면에 무장애 정보가 영문으로 보이고, 요약 칸을 누르면 목록으로 간다 — #51 머지 후 확인
- [ ] 영문 값이 없는 칸은 한국어로 대신하지 않고 숨긴다
- [x] 영문 화면의 문화 가이드가 한국어 화면과 같은 원고의 번역이다 (`guideDetailEn`) — S23(#54)
- [ ] 한국어 화면은 그대로다 — 한국어 사유 952건 결과 변화 0 (DB 실측), 화면 확인 남음

---

## Verification

| # | 시나리오 | 기대 |
|---|---|---|
| 1 | `/en/place/1608530` (설명문이 마침표로 끝남) · 유형 저장 상태 | 사유에 `The calm atmosphere …` 문장이 있다 |
| 2 | `/en/place/128698` (반려동물 가능) | 조건 영문 |
| 3 | `/en/place/1608530` | 놓치기 쉬운 것 영문 두 줄 |
| 4 | `/en/place/126119` (부산 어린이대공원, 무장애 7항목) | 무장애 목록 영문 · 요약 칸 눌러 이동 |
| 5 | `/ko/place/1608530` · `/ko/place/128698` · `/ko/place/126119` | 변화 없음 |

`npx tsc --noEmit` · `npm run lint` · `npm run build`
