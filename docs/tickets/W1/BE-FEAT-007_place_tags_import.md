# BE-FEAT-007: `placeTags` 62곳 적재 + 타입 계약 확장

정본 구글시트(`[최] SAIRO 통합본`, gid=350815285)의 실태깅 62곳을 `placeTags` 컬렉션에 적재하고, CF8 매칭에 필요한 필드(`cfp_match`, Hard Filter 필드 등)를 `Place`/`RecommendedPlace` 타입 계약에 추가해서 `/api/recommend` 응답으로 프론트까지 흘러가게 한다.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | BE |
| Type | FEAT |
| Severity | Critical |
| Layer | Type / Lib / Script |
| Status | In Progress |
| Screen | S10, S20 |
| Depends | BE-FEAT-002(`places` 컬렉션) |
| Related | FE-FEAT-005(이 데이터를 소비하는 클라이언트 매칭 엔진) |

---

## Problem

- **현재 동작**: `placeTags` 컬렉션 비어있음(데모 2건뿐). `Place` 타입에 CF8 관련 필드(`cfp_match`, `hasRaw` 등) 자체가 없어서, 데이터가 있어도 API 응답에 안 나감
- **기대 동작**: 62곳 실데이터 적재 + 타입 계약 확장으로 `/api/recommend` 응답에 CF8 매칭용 필드가 실제로 포함됨
- **영향 범위**: `src/types/place.ts`, `src/lib/recommend.ts`, 신규 `scripts/import-place-tags.ts`

---

## Context

```
정본: [최] SAIRO 통합본 구글시트 (gid=350815285)
- 62행 확인(직접 CSV로 받아 검증) — 49행 공식 content_id 있음, 13행 SAIRO 자체 큐레이션(content_id 없음)
- 49행의 content_id 전부 MongoDB `places` 컬렉션에 실제 존재 확인 완료(조인 가능)
- 13행(큐레이션)은 `places`에 대응 문서가 없어 이번 티켓 스코프에서 제외 — 후속 작업 필요

컬럼 → 필드 매핑 시 주의:
- weather_type 실데이터 값은 "mixed"（타입 기존 정의 "both"와 불일치 → "mixed"로 통일)
- english_support 실데이터 0~2 (0~5 아님, 이전 티켓에서 주석만 수정했던 부분 — 이번에 실데이터로 확인)
- cfp_match: CF8 3글자 코드, FE-FEAT-005가 letter-비교로 취향 매칭에 직접 사용
- has_raw/has_meat_only/has_seafood_only: 빈 문자열 = UNKNOWN(null), "TRUE"/"FALSE" 문자열 → boolean 변환 필요
```

---

## Scope

### 포함

- `Place` 타입에 필드 추가: `cf8Match`(cfp_match), `hasRaw`/`hasMeatOnly`/`hasSeafoodOnly`/`seatingType`(Hard Filter), `fitCouple`/`fitFriends`/`fitFamily`, `stayMinutes`, `tipHeadlineEn`, `proEn`/`conEn`/`infoKo`/`infoEn`, `altId1`/`altId2`
- `weatherType` 값 `"both"` → `"mixed"`로 통일(실데이터 기준)
- `src/lib/recommend.ts`의 `PlaceTagsDoc`/`EMPTY_TAGS`/필드 매핑을 위 확장에 맞춰 갱신
- `scripts/import-place-tags.ts` 신규 — 정본 시트 CSV export를 직접 fetch해서 파싱 → `placeTags` upsert (content_id 있는 49건만)
- 실행 + 검증(적재 건수, 샘플 문서 확인)

### 제외

- SAIRO 큐레이션 13건(content_id 없음) — `places`에 먼저 별도 등록 필요, 후속 티켓
- CF8 축 연속점수(−2~+2) — 정본에 실데이터 없음, FE-FEAT-005에서도 불필요하다고 결론
- `kto_*`/`api_verified_at` 등 provenance 필드 — 지금 화면에서 안 쓰므로 스코프 밖(필요해지면 추가)
- `walkby_priority`/`notify_*` — 정본 자체가 "2차 기능, 1차 출시 미사용"으로 명시

---

## Strategy

### Step 1: `Place` 타입 확장 + `weatherType` 값 통일
### Step 2: `recommend.ts`의 `PlaceTagsDoc`/`EMPTY_TAGS`/매핑 갱신
### Step 3: `scripts/import-place-tags.ts` 작성 — CSV fetch → 파싱 → 타입 변환("TRUE"/"FALSE"→boolean, 빈 문자열→null) → upsert
### Step 4: 실행, 적재 건수·샘플 문서 확인
### Step 5: `npm run build` + `/api/recommend` 스모크 테스트로 새 필드가 응답에 실제로 나오는지 확인

---

## Acceptance Criteria

- [ ] `placeTags` 컬렉션에 49건 적재(기존 데모 2건은 덮어써지거나 별도 정리)
- [ ] `/api/recommend` 응답에 `cf8Match`·`hasRaw`·`seatingType` 등 신규 필드가 실제로 포함됨
- [ ] 빈 문자열(`has_raw` 등)이 `false`가 아니라 `null`로 들어감(UNKNOWN 원칙 유지)
- [ ] `weatherType` 값이 `"mixed"`로 일관되게 들어감
- [ ] `npm run build` 통과

---

## Testing Rules

- 유닛테스트 미도입 — 적재 후 MongoDB 직접 쿼리로 건수·샘플 검증 + API 스모크 테스트

---

## Verification

(구현 중 작성)

---

## Implementation Notes

(구현 후 작성)
