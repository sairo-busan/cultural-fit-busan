# BE-FEAT-016: 도슨트 영문 구조 변경(guideEn→guideDetailEn·guideSimpleEn 신규)

도슨트 영문을 "자세히"만 있던 상태에서 한국어와 같은 간단히/자세히/팁 3종
체계로 맞춘다.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | BE |
| Type | FEAT |
| Severity | Medium |
| Layer | Lib / Script |
| Status | Done(BE) — FE 반영 대기 |
| Screen | S20 (장소 상세) |
| Depends | BE-FEAT-015(영문 필드 1차) |
| Related | - |

---

## Problem

- **현재 동작**: `guideEn` 필드 하나가 "자세히"만 담당. "간단히" 영문은 아예
  없음(9/17 이전엔 "영문은 자세히만 노출"로 결정했었으나, 오디오 파일도
  간단히/자세히 둘 다 만들기로 하면서 재검토).
- **기대 동작**: 한국어처럼 `guideSimpleEn`(간단히)·`guideDetailEn`(자세히,
  = 구 `guideEn`)·`guideTipsRawEn`(팁, BE-FEAT-015 완료) 3종을 갖춘다. 필드명은
  전부 "어간 + 언어" 규칙(`guideSimpleKo`↔`guideSimpleEn` 등)을 따른다.
- **영향 범위**: `place_info` 컬렉션, `src/lib/placeDetail.ts`,
  `PlaceContent.tsx`(FE, 소피 담당 — 이 티켓 범위 밖).

---

## Context

```
관련 파일:
- scripts/fill-guide-simple-en.ts (신규)
- scripts/migrate-guide-en-to-detail-en.ts (신규)
- src/lib/placeDetail.ts
```

### guideSimpleEn(119건, LLM 번역)

`guideSimpleKo`는 "이곳은 {장소설명}입니다. {상세}." 2문장 자유 텍스트라
템플릿화 불가 — 119건 전부 개별 번역.

### guideEn → guideDetailEn(119건, 값 이전만)

번역 새로 할 필요 없음 — 기존 `guideEn` 값을 `guideDetailEn` 필드로 복사.
`guideEn` 필드 자체는 **아직 지우지 않음** — `PlaceContent.tsx`가
`place.guideEn`을 직접 참조 중이라(#31에서 박아 씀), 소피가 그 참조를
`guideDetailEn`으로 바꾸기 전에 지우면 화면이 깨진다. 소피 PR 머지 후 별도
정리 커밋에서 `guideEn` 필드·응답을 제거한다.

---

## Scope

### 포함

1. `scripts/fill-guide-simple-en.ts` — guideSimpleEn 119건 번역 적재
2. `scripts/migrate-guide-en-to-detail-en.ts` — guideEn 값을 guideDetailEn으로 복사
3. `src/lib/placeDetail.ts` — `PlaceDetail` 계약에 `guideSimpleKo`·`guideSimpleEn`·
   `guideDetailEn` 추가(`guideEn`은 하위호환용으로 응답에 유지)

### 제외

- `PlaceContent.tsx`에서 `place.guideEn` → `place.guideDetailEn` 참조 변경 — 소피 PR
- `guideEn` 필드/응답 완전 제거 — 소피 PR 머지 후 정리 커밋

---

## Verification

1. `npx tsc --noEmit` — 통과(main의 `privacy/page.tsx` 기존 에러는 무관)
2. DB 적재 건수 — guideSimpleEn 119/119, guideDetailEn 119/119
3. `PlaceDetail` 응답에 `guideSimpleKo`·`guideSimpleEn`·`guideDetailEn`·`guideEn`(하위호환) 모두 존재

---

## Implementation Notes

### 2026-09-17: 필드명 규칙 통일 + guideEn 이전

소피에게 카톡으로 필드명 규칙("어간+언어") 안내하고 `place.guideEn` →
`place.guideDetailEn` 변경 요청 완료. 소피 PR 머지되면 `guideEn` 필드 제거
정리 커밋 예정.

### 2026-09-17: 유나 최종본으로 재작업(같은 날 후속)

유나가 이 티켓 작업 도중 구글시트 간단히/자세히/팁 원고를 전면 교체(훨씬 길고
상세한 새 원고, 120곳). `import-db02-placeinfo.ts` 재실행으로
`guideSimpleKo`·`guideDetailKo`·`guideTipsRawKo`는 이미 새 원고로 갱신됨.

시트의 `cultureGuideText_en`(자세히 영문) 칼럼은 옛 원고 기준 그대로였다(120건 중
1건만 새로 반영, 나머지 119건은 stale — 대조 스크립트로 확인). 그래서 이 칼럼을
쓰지 않고, 새 한글 원고 기준으로 `guideSimpleEn`·`guideDetailEn`·`guideTipsRawEn`
전체를 LLM으로 재번역해 덮어썼다(`scripts/refill-guide-en-new-draft.ts`,
119/119 — 에스엠비 웰니스 센터 1곳은 스코프 제외 대상이라 시트에 남아있어도
건너뜀). 위 "필드명 규칙 통일" 절의 값(구원고 기준)은 이걸로 대체됐다.

### 2026-09-17: 정리 — 구원고 기준 스크립트 삭제, 번역 데이터 레포에 커밋

소피 PR 리뷰 발견: 재번역 뒤에도 구원고 기준 스크립트가 레포에 남아있었다.
특히 `migrate-guide-en-to-detail-en.ts`는 다시 돌리면 새 자세히 번역 119건이
옛 문장으로 되돌아가는 위험한 상태였다. 아래 3개 삭제:
- `scripts/migrate-guide-en-to-detail-en.ts`
- `scripts/fill-guide-simple-en.ts`
- `scripts/fill-guide-tips-en.ts`(BE-FEAT-015에서 만든 것 — 팁도 새 원고
  기준으로 이미 재번역됐으므로 같이 정리)

새 번역 데이터는 `/tmp`에만 있어 재현 불가능한 상태였다 —
`scripts/data/guide_en_2026-09-17.json`으로 레포에 커밋하고,
`refill-guide-en-new-draft.ts`가 이 경로를 읽도록 수정.
