# BE-FEAT-012: 근처 장소 추천 API

```
문제   코스/일정 기능이 스코프 아웃되면서 "이곳 대신 갈만한 곳" 랭킹
       기준이 미정 상태로 남아 있었다.
해결   상세 화면용 "근처 장소" 한 줄 — content_id 기준으로 큐레이션된
       120곳 중 가까운 곳을 거리순으로 반환하는 API 신설.
```

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | BE |
| Type | FEAT |
| Severity | Medium |
| Layer | Lib / API |
| Status | Done |
| Depends | BE-FEAT-011(score_board) |

---

## Problem

9/10 회의에서 코스·일정·스와이프 기능을 스코프 아웃하면서, 대신 상세 화면에
"근처에 이런 곳도 있어요" 한 줄만 보여주기로 했다(`docs` 회의록 참고). 위치정보
원칙(유저 GPS를 서버로 안 보냄)과는 무관하다 — 여긴 큐레이션된 두 장소의
**고정 좌표끼리** 거리를 재는 거라 사용자 위치가 아예 안 들어간다.

---

## Scope

### 포함

- `src/lib/nearbyPlaces.ts` — `getNearbyPlaces(contentId, limit)`. `score_board`를
  `places`와 조인해 좌표를 얻고, 기존 `distance.ts`의 haversine 공식(GPS 제거로
  안 쓰이던 함수)으로 거리를 재서 가까운 순 N개.
- `GET /api/place/nearby?contentId={contentId}&limit={n}` (limit 기본 3, 상한 5).

### 제외

- S20 상세 화면 연결 — 화면 자체가 아직 없음(FE-FEAT-010 소관).
- 코스/일정(전체 스코프 아웃, 9/10 회의).

---

## Verification

```
score_board에 실제 content_id 3개(가덕도·가덕도등대·가야공원)를 임시로 넣어
getNearbyPlaces("2715601", 5) 호출
→ 가덕도등대 55분, 가야공원 272분 순으로 정렬 — 거리 계산·정렬 정상 확인
→ 테스트 문서는 검증 후 즉시 삭제
```

haversine 공식 자체는 기존 distance.ts 검증(같은 지점 0, 해운대-부산역 148분)을
그대로 재사용 — 재검증 불필요.

```
tsc --noEmit   통과
lint           에러 0 (기존 feed/page.tsx 경고 1건은 안 건드림)
```

---

## Derived Artifact Naming Rule

```text
티켓 ID:     BE-FEAT-012
파일명:      BE-FEAT-012_nearby_places.md
브랜치명:    feat/nearby-places
```
