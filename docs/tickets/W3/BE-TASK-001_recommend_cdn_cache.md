# BE-TASK-001: /api/recommend CDN 캐시 헤더 추가

`/api/recommend` 응답에 Cache-Control 헤더를 붙여 Vercel CDN이 응답을 재사용하게 한다.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | BE |
| Type | TASK |
| Severity | Low |
| Layer | Route |
| Status | Done |
| Screen | S10 (추천 피드) |
| Depends | - |
| Related | - |

---

## Problem

- **현재 동작**: `/api/recommend`는 요청마다 서버리스 함수가 기동되어 MongoDB를 재조회한다. 한동안 요청이 없다가 처음 부르면(콜드스타트) 1.15초, 이후엔 0.1초로 측정됨(에린 실측).
- **기대 동작**: 응답이 누가 불러도 동일(개인화는 클라이언트 localStorage에서 처리)하므로, Vercel CDN에 60초간 캐시해 함수를 깨우지 않고 응답한다.
- **영향 범위**: `/api/recommend` 응답 지연 시간(체감 로딩). 개인화 로직·데이터 정합성에는 영향 없음.

---

## Context

```
관련 파일:
- src/app/api/recommend/route.ts

외부 의존:
- Vercel Edge/CDN (s-maxage, stale-while-revalidate 헤더 해석)
```

에린 제안 원문 요지: 지금은 `cache-control: max-age=0`이라 매번 함수로 감. CDN에 60초 캐시하면 요금제 변경·재빌드 없이 같이 빨라짐. 단, DB를 고친 직후엔 다음 방문자 한 명까지 최대 60~360초(s-maxage 60 + stale-while-revalidate 300) 이전 값이 보일 수 있음(그 요청이 뒤에서 새 값을 받아옴).

---

## Scope

### 포함

- `src/app/api/recommend/route.ts`의 `NextResponse.json` 응답에 `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` 헤더 추가

### 제외

- `/api/weather` (현재 0.16초로 충분히 빠름 — 별도 판단 필요 시 후속 티켓)

---

## Strategy

### Step 1: `route.ts`의 `NextResponse.json(results)`를 헤더 포함 형태로 교체

---

## Acceptance Criteria

- [x] `/api/recommend` 응답에 `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` 헤더 존재
- [x] 타입체크 통과

---

## Testing Rules

- [x] `npx tsc --noEmit` 통과

---

## Verification

1. `npx tsc --noEmit -p tsconfig.json` — 에러 없음 확인

---

## Implementation Notes

### 2026-09-17: 헤더 추가

에린 제안 코드 그대로 반영. 사진·TTS 작업으로 DB를 자주 고치는 중이라 stale 창(최대 1명, 최대 360초)이 실제로 열려있는 상태에서 적용하기로 사용자 결정.
