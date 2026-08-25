# BE-FEAT-001: Place 타입 정의

S10/S20 등 장소 데이터를 쓰는 화면이 백엔드로부터 받을 타입을 정의한다. 소피의 S10/S20 착수를 막고 있어 최우선 처리.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | BE |
| Type | FEAT |
| Severity | High |
| Layer | Type |
| Status | Done |
| Screen | S10, S20 |
| Depends | - |
| Related | BE-FEAT-002 (실제 데이터를 채우는 백엔드) |

---

## Problem

- **현재 동작**: `Place` 타입이 없어 소피가 S10/S20 작업 시 임의로 목업 타입을 만들어야 함. 나중에 실제 백엔드 응답과 안 맞으면 재작업 필요
- **기대 동작**: `docs/데이터_마트_정의서.md`의 서비스 응답 형태를 그대로 반영한 `Place`/`RecommendedPlace` 타입 제공, 태깅 안 된 장소도 표현 가능
- **영향 범위**: `src/types/place.ts` (신규 1파일)

---

## Context

```
관련 파일:
- src/types/place.ts (신규)

외부 의존:
- docs/데이터_마트_정의서.md (places/placeTags 스키마 근거)
- docs/TourAPI_오퍼레이션_정리.md (필드 출처)
```

---

## Scope

### 포함

- `Place` 타입 (places+placeTags 조인 응답 형태)
- `RecommendedPlace` 타입 (S10 피드용, fitScore/reasons/distanceMin 포함 — 추천엔진은 BE-FEAT-002 이후 별도 작업)

### 제외

- 실제 `/api/places` 라우트 구현 (별도 티켓)
- 추천엔진 계산 로직 (별도 티켓)

---

## Strategy

### Step 1: `docs/데이터_마트_정의서.md` 3번 섹션(서비스 응답) 기준으로 필드 나열
### Step 2: 태깅 안 된 장소를 표현하도록 placeTags 유래 필드는 전부 nullable 처리

---

## Acceptance Criteria

- [x] `Place` 타입에 raw(places) + 태깅(placeTags) 필드 모두 포함
- [x] 태깅 안 된 장소도 타입 위반 없이 표현 가능 (nullable)
- [x] `RecommendedPlace`가 `Place`를 확장해 fitScore/reasons/distanceMin 포함

---

## Testing Rules

- 타입 전용 파일, 런타임 테스트 대상 아님. 타입체크 통과로 충분.

---

## Verification

| # | 시나리오 | 입력/요청 | 기대 결과 |
|---|---|---|---|
| 1 | 타입체크 | `npx tsc --noEmit` | 에러 0 |
| 2 | 태깅 미완료 장소 목업 | placeTags 필드 전부 null로 목업 생성 | 타입 에러 없이 통과 |

---

## Implementation Notes

### 2026-08-24: 구현 완료

`docs/데이터_마트_정의서.md` 서비스 응답 스펙 그대로 타입화. `coverage`만 non-null(기본 0)로 두고 나머지 placeTags 유래 필드는 전부 `| null`.
