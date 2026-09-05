# BE-FEAT-006: `/api/recommend` 단순화 — 좌표 서버 전송 제거

BE-FEAT-003에서 만든 `/api/recommend`는 `lat`/`lng`를 받아 서버에서 거리 계산·정렬까지 한다. 위치 정보는 기기 밖으로 나가면 안 된다는 원칙([위치 정보 사용 리스크 검토](https://app.notion.com/p/3c92178256a88009895dfad11322b28c) 참고)과 어긋나므로, 서버는 장소+태그 목록만 제공하고 거리 계산·정렬은 클라이언트로 옮긴다.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | BE |
| Type | FEAT |
| Severity | High |
| Layer | Route / Lib |
| Status | Done |
| Screen | S10, S20 |
| Depends | BE-FEAT-003(현재 구현) |
| Related | FE-FEAT-005(클라이언트 매칭 엔진 — 이 API의 소비자) |

---

## Problem

- **현재 동작**: `GET /api/recommend?lat=&lng=&contentTypeId=&limit=` — 서버(`src/lib/recommend.ts`)가 `lat`/`lng`로 haversine 거리 계산·정렬까지 수행
- **기대 동작**: `lat`/`lng` 파라미터 제거. 서버는 `places`+`placeTags` 조인한 목록만 반환(정렬 없음, 또는 contentId 순). 거리 계산·정렬은 프론트(FE-FEAT-005)가 기기 내 GPS로 수행
- **영향 범위**: `src/app/api/recommend/route.ts`, `src/lib/recommend.ts`

---

## Context

```
관련 문서:
- 위치 정보 사용 리스크 검토 (노션 "３. 개발") — 좌표 서버 미전송 원칙의 법적 근거(LBSC 공식 FAQ)
- [최신 정본] CFP 추천 로직 v3.1의 "자주 하는 실수 8가지" #8:
  "프록시에 사용자 좌표 전송 → Play 데이터 안전 신고 위반 → 재심사"

관련 파일:
- src/lib/recommend.ts — distanceMinutes()·getRecommendations() 중 거리 계산·정렬 부분 제거
- src/app/api/recommend/route.ts — lat/lng 파라미터·검증 제거
```

---

## Scope

### 포함

- `GET /api/recommend?contentTypeId=&limit=` — 좌표 파라미터 없이 목록 반환
- `places`+`placeTags` 조인은 기존 로직 유지(BE-FEAT-003 그대로)
- 응답에서 `distanceMin`은 항상 `null`(클라이언트가 채움)
- 정렬 없음 또는 `contentId` 순— 실제 정렬은 프론트(FE-FEAT-005)에서 수행

### 제외

- 거리 계산 로직 자체(삭제가 아니라 이관) — `distanceMinutes()` 함수는 프론트(FE-FEAT-005)로 그대로 복사해서 재사용
- CF8 매칭 로직 — FE-FEAT-005 스코프

---

## Strategy

### Step 1: `route.ts`에서 `lat`/`lng` 쿼리파라미터·400 검증 제거
### Step 2: `recommend.ts`에서 `distanceMinutes()` 호출 제거, `distanceMin: null` 고정
### Step 3: 정렬 로직 제거(또는 `contentId` 순 유지)
### Step 4: 회귀 확인 — 기존 `contentTypeId`/`limit` 필터는 그대로 동작

---

## Acceptance Criteria

- [x] `lat`/`lng` 없이 요청해도 정상 200 응답
- [x] 네트워크 요청/응답 어디에도 위치 좌표가 포함되지 않음(개발자 도구로 확인)
- [x] `contentTypeId`/`limit` 필터 기존과 동일하게 동작(회귀 없음)
- [x] 응답의 `distanceMin`이 항상 `null`

---

## Testing Rules

- 유닛테스트 프레임워크 미도입 — 수동 검증 + `npm run build` 통과 확인

---

## Verification

| # | 시나리오 | 요청 | 기대 결과 |
|---|---|---|---|
| 1 | 정상 | `GET /api/recommend?limit=10` | 200, 10건, `distanceMin: null` |
| 2 | contentTypeId 필터 | `GET /api/recommend?contentTypeId=39` | 음식점만 반환(회귀 없음) |
| 3 | 좌표 미포함 확인 | 위 요청들의 실제 HTTP 요청/응답 검사 | lat/lng 어디에도 없음 |

---

## Implementation Notes

### 2026-09-03: 구현 완료

- `route.ts`에서 `lat`/`lng` 파라미터·400 검증 제거
- `recommend.ts`에서 `distanceMinutes()` 삭제, `distanceMin: null` 고정, 정렬 로직 제거
- `npm run build` 통과, 실행 중인 dev 서버로 스모크 테스트: `GET /api/recommend?limit=2` 정상 200, `GET /api/recommend?contentTypeId=39&limit=1` 필터 정상 동작 확인
- `distanceMinutes()` 함수는 FE-FEAT-005에서 프론트로 그대로 옮겨 재사용 예정(haversine → 80m/분 공식 그대로)

### 2026-09-03: QA 경고 2건 수정

- `limit` 상한 없음(최대 2,231건 반환 가능) → `Math.min(limit, 100)`으로 상한
- `limit` 음수 시 `.slice(0,-n)`으로 예상 밖 동작 → `< 1`이면 기본값(20)으로 폴백
- 실제 요청으로 검증: `limit=-3`→20건, `limit=99999`→100건, `limit=abc`→20건, `limit=5`→5건
- `distanceMin: null` 관련 — `PlaceCard.tsx`/`place/[id]/page.tsx`가 이 필드를 쓰지만 현재 `mock-places.ts` 목데이터 경유라 이 API 미연결 상태, 지금 머지해도 회귀 없음(FE-FEAT-005 연결 시 채워짐)

### 2026-09-05: 소피 리뷰(CHANGES_REQUESTED) 대응 — 후보군을 태깅된 장소로 한정

**지적 내용**: 정렬 로직이 빠지면서 `places` 2,231건 전체 조회 후 `.slice(0, limit)`만 남아, "가까운 N곳"이 아니라 "적재 순서상 앞 N곳"이 반환됨. 동시에 20건 응답을 위해 2,231건 전체(overview·images·info 포함)를 조회·객체화한 뒤 버려서 비효율.

**대응**: `places` 전체가 아니라 `placeTags`가 있는 장소만 후보로 좁힘(태깅 안 된 곳은 추천하지 않는다는 설계 원칙과도 일치). `_id: { $in: 태깅된 contentId 목록 }`으로 쿼리 범위를 태깅 건수(현재 49건)로 줄이고, Mongo `.limit()`을 직접 적용해 후처리 `.slice()`를 제거. `EMPTY_TAGS` 폴백 삭제(쿼리 자체가 태깅된 곳만 반환하므로 불필요).

- 실제 위치 기반 정렬은 이 PR 스코프가 아니라 CF8 엔진(FE-FEAT-005) 붙일 때 클라이언트가 처리하는 걸로 유지 — 소피가 제안한 3안(권역 파라미터 A / 경량 목록+재요청 B / FEATURED만 C) 중 채택 안 함, 대신 "태깅된 곳만" 필터로 후보군 자체를 49~62건 규모로 줄여 문제의 영향도를 낮춤
- 검증(dev 서버 실행 중, `http://localhost:3001`):
  - `GET /api/recommend?limit=100` → 49건, 전부 `coverage > 0`
  - `GET /api/recommend?contentTypeId=39&limit=100` → 0건(태깅된 49건 중 음식점(39) 자체가 없음, 회귀 아님 — `Counter({'12': 34, '38': 10, '14': 4, '28': 1})`로 확인)
  - `GET /api/recommend` (limit 기본값) → 20건
  - `limit=-3`→20, `limit=99999`→49(태깅 건수가 상한 100보다 적어서), `limit=abc`→20 — 전부 기존 폴백 규칙대로 동작
  - `distanceMin` 전부 `null` 유지
  - `lat`/`lng` 파라미터를 보내도 무시(200, 에러 아님) — 하위호환 확인
- 티켓 번호 통일: 본문 전체의 `FE-FEAT-003` → `FE-FEAT-005`로 수정(소피 PR#8 리뷰 지적 반영)
- Acceptance Criteria 체크박스 반영(Status=Done인데 미체크 상태였던 것 정리)
