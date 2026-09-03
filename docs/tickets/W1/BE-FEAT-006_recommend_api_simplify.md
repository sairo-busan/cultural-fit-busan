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
| Related | FE-FEAT-003(클라이언트 매칭 엔진 — 이 API의 소비자) |

---

## Problem

- **현재 동작**: `GET /api/recommend?lat=&lng=&contentTypeId=&limit=` — 서버(`src/lib/recommend.ts`)가 `lat`/`lng`로 haversine 거리 계산·정렬까지 수행
- **기대 동작**: `lat`/`lng` 파라미터 제거. 서버는 `places`+`placeTags` 조인한 목록만 반환(정렬 없음, 또는 contentId 순). 거리 계산·정렬은 프론트(FE-FEAT-003)가 기기 내 GPS로 수행
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
- 정렬 없음 또는 `contentId` 순— 실제 정렬은 프론트(FE-FEAT-003)에서 수행

### 제외

- 거리 계산 로직 자체(삭제가 아니라 이관) — `distanceMinutes()` 함수는 프론트(FE-FEAT-003)로 그대로 복사해서 재사용
- CF8 매칭 로직 — FE-FEAT-003 스코프

---

## Strategy

### Step 1: `route.ts`에서 `lat`/`lng` 쿼리파라미터·400 검증 제거
### Step 2: `recommend.ts`에서 `distanceMinutes()` 호출 제거, `distanceMin: null` 고정
### Step 3: 정렬 로직 제거(또는 `contentId` 순 유지)
### Step 4: 회귀 확인 — 기존 `contentTypeId`/`limit` 필터는 그대로 동작

---

## Acceptance Criteria

- [ ] `lat`/`lng` 없이 요청해도 정상 200 응답
- [ ] 네트워크 요청/응답 어디에도 위치 좌표가 포함되지 않음(개발자 도구로 확인)
- [ ] `contentTypeId`/`limit` 필터 기존과 동일하게 동작(회귀 없음)
- [ ] 응답의 `distanceMin`이 항상 `null`

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
- `distanceMinutes()` 함수는 FE-FEAT-003에서 프론트로 그대로 옮겨 재사용 예정(haversine → 80m/분 공식 그대로)
