# BE-FEAT-003: 추천 API — Hard Filter + 거리 기반 폴백 (Phase 1)

소피가 S10/S20에서 목데이터로 막혀있는 지점을 푸는 최소 동작 추천 API. `placeTags`가 아직 비어있어 정식 Fit 점수 계산은 의미가 없으므로, 명세서 16번 구현순서의 1~3단계(Hard Filter+거리, Coverage, 카테고리 필터링)만 먼저 구현하고 CFP 축 매칭은 후속 티켓으로 미룬다.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | BE |
| Type | FEAT |
| Severity | Critical |
| Layer | Route / Lib |
| Status | In Progress |
| Screen | S10, S20 |
| Depends | BE-FEAT-001(Place 타입), BE-FEAT-002(MongoDB) |
| Related | BE-FEAT-004(CFP 축 점수·Fit 계산, placeTags 데이터 들어온 후) |

---

## Problem

- **현재 동작**: S10/S20이 소피 쪽 목데이터(4건)로만 동작. 실제 추천 API 없음. `placeTags` 컬렉션이 비어있어(유나 태깅 대기 중) `추천_알고리즘_명세서_v2.md`의 Coverage 게이트(`coverage < 40` → Hard Filter 제외)를 문자 그대로 적용하면 **모든 장소가 걸러져서 결과가 0건**이 됨
- **기대 동작**: 위치 기반 거리순 정렬로 최소 동작하는 추천 API 제공. `placeTags`가 비어있는 현재는 Coverage 게이트를 비활성 상태로 두고(장소 raw 데이터만으로 응답), 태깅 데이터가 들어오면 후속 티켓에서 게이트+Fit 점수를 얹는 구조로 설계
- **영향 범위**: 신규 API 라우트(`src/app/api/recommend/route.ts`), 신규 lib(`src/lib/recommend.ts`)

---

## Context

```
관련 문서:
- docs/추천_알고리즘_명세서_v2.md (8/25 Notion과 대조 확인, v2.0 최신)
  - 2번 섹션: 전체 흐름 8단계
  - 5번 섹션: 가중치·거리 계산(haversine → 80m/분)
  - 16번 섹션: "구현순서 3번까지만 되어도 S10 피드가 완성된다"
- docs/데이터_마트_정의서.md (places/placeTags 스키마)

관련 파일:
- src/types/place.ts (Place, RecommendedPlace 타입 — 이 응답이 따라야 할 계약)
- src/lib/mongodb.ts (getDb 재사용)

신규 생성:
- src/app/api/recommend/route.ts
- src/lib/recommend.ts (거리 계산 + Hard Filter + 정렬 로직)

외부 의존: 없음 (MongoDB만)
```

---

## Scope

### 포함

- `GET /api/recommend?lat=&lng=&contentTypeId=&limit=` — 좌표 기준 거리순 장소 목록
- Hard Filter 중 지금 데이터로 판단 가능한 것만: 좌표 유효성. (영업종료·우천실외 등 태깅/날씨 의존 항목은 제외, 후속 티켓)
- `places`+`placeTags`를 `contentId` 기준 조인 시도 — 태깅 있으면 필드 채우고, 없으면 `RecommendedPlace`의 placeTags 유래 필드 전부 null·`coverage: 0` 유지 (타입은 이미 이렇게 nullable로 설계돼있음, BE-FEAT-001 참고)
- `fitScore`는 이번 티켓에서 임시로 `0`(또는 미계산 표시), `reasons`/`tags`는 빈 배열 — Fit 계산 로직은 BE-FEAT-004

### 제외

- CFP 축 점수 계산, 가중치 재분배, 상황 보정, 컷오프 (명세서 4~7단계 — `placeTags` 실데이터 필요, 후속 티켓)
- Coverage 게이트 활성화 (지금 활성화하면 전체 0건 되므로 의도적으로 미적용, 태깅 들어오면 켬)
- 검색(`searchKeyword2` 연동), 날씨 보정
- S20 단일 장소 상세 조회(`/api/places/[contentId]`) — 별도 티켓

---

## Strategy

### Step 1: 요청 파라미터 정의
`lat`, `lng`(필수), `contentTypeId`(옵션 필터), `limit`(기본값 지정)

### Step 2: 거리 계산
명세서 5번 섹션의 haversine → 80m/분 공식 그대로 `src/lib/recommend.ts`에 구현

### Step 3: 조회 + 조인
`places` 컬렉션 조회 → 좌표 유효성으로 1차 필터 → `placeTags`와 `contentId` 조인(있으면 채움, 없으면 null) → 거리순 정렬

### Step 4: 응답 매핑
`RecommendedPlace[]`로 매핑, `fitScore: 0`, `reasons: []`, `tags: []`, `distanceMin` 채움

---

## Acceptance Criteria

- [ ] 좌표 파라미터로 요청 시 거리순 정렬된 `RecommendedPlace[]` 반환
- [ ] `placeTags` 없는 현재 상태에서도 빈 배열이 아닌 정상 목록 반환 (Coverage 게이트 미적용 확인)
- [ ] 응답 스키마가 `src/types/place.ts`의 `RecommendedPlace`와 정확히 일치 (소피 프론트가 목데이터 → 실API로 그대로 교체 가능해야 함)
- [ ] 좌표 파라미터 누락 시 400

---

## Testing Rules

- 유닛테스트 프레임워크 미도입 시점 — 아래 Verification 수동 검증으로 대체
- 타입체크 통과 후 핸드오프, 결과는 `docs/_internal/analysis/`에 기록

---

## Verification

| # | 시나리오 | 입력/요청 | 기대 결과 |
|---|---|---|---|
| 1 | 정상 | `GET /api/recommend?lat=35.15&lng=129.06&limit=10` (해운대 인근) | 200, 거리순 정렬된 10건, 가까운 순서 확인 |
| 2 | 에러 — 좌표 누락 | `GET /api/recommend` | 400 |
| 3 | contentTypeId 필터 | `GET /api/recommend?lat=...&lng=...&contentTypeId=39` | 음식점(39)만 반환 |
| 4 | 회귀 | `GET /api/health`, `GET /api/tour?op=...` | 기존 동작 불변 |
| 5 | 타입 일치 | 응답 JSON을 `RecommendedPlace` 타입에 대입 | 타입 에러 없음 |

---

## Implementation Notes

### 2026-08-25: 구현 완료

- `src/lib/recommend.ts`, `src/app/api/recommend/route.ts` 신규
- 검증: 정상(해운대 좌표 → 거리순 3건), 에러(좌표 누락 → 400), contentTypeId 필터(39만 반환) 전부 통과
- `npm run build` 통과 확인 (`/api/recommend` 라우트 정상 인식)
- `placeTags` 없는 장소는 `EMPTY_TAGS`(coverage:0, 나머지 null)로 채워짐 — 타입 계약 유지 확인
