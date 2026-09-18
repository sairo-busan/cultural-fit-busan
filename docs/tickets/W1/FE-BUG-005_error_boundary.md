# FE-BUG-005: 오류 경계가 없어 한 곳이 터지면 화면 전체가 멈춘다

```
증상   카드 하나 · 칸 하나가 그리는 중에 예외를 내면 화면 전체가 Next 기본 오류 화면으로 바뀐다
       앱(Capacitor)에서는 다시 시작하는 수밖에 없다
원인   error.tsx · global-error.tsx · 카드 단위 경계가 하나도 없다
해결   화면 단위 · 최상위 · 카드 단위 세 겹의 오류 경계
```

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | FE |
| Type | BUG |
| Severity | High (한 곳의 데이터 이상이 화면 전체를 멈춘다) |
| Layer | Screen · Component |
| Status | In Progress |
| Screen | 모든 화면 · S10 추천 · 저장 · S20 함께 둘러볼 곳 |
| Branch | `fix/error-boundary` (워크트리 `cfb-error-boundary`, `origin/main` 기준) |
| Depends | — |
| Related | FE-BUG-004 (같은 구조로 목록 전체가 멈춘 사례 — 거기서 "카드 단위 경계"를 제외로 남겼다) · 에린 전체 QA 지적 |

---

## Problem

### 확인 (2026-09-18, `origin/main`)

| 찾은 것 | 결과 |
|---|---|
| `src/app/**/error.tsx` · `global-error.tsx` | 없음 |
| `componentDidCatch` · `getDerivedStateFromError` · `react-error-boundary` | 없음 |

그리는 중 예외가 나면 React 는 가장 가까운 경계까지 트리를 걷어낸다. 경계가 없으니 화면 전체가 사라지고 Next 기본 오류 화면만 남는다.

경계는 React Error Boundary 기능으로 만든다. 화면 · 최상위는 Next 의 `error.tsx` · `global-error.tsx` 가 경계를 대신 두고, 카드 단위만 클래스 컴포넌트로 직접 만든다.

FE-BUG-004 가 실제 사례다 — 주소 없는 장소 1곳의 카드가 터져 추천 목록 119곳이 전부 사라졌다. 데이터는 고쳤지만 같은 종류의 이상이 다시 오면 또 화면 전체가 멈춘다.

### 구조에서 알아둘 것

- 최상위 레이아웃은 `src/app/[locale]/layout.tsx` 다(`src/app/layout.tsx` 없음). `[locale]/error.tsx` 는 그 아래 화면들만 감싸고, 레이아웃 자체가 터지면 `src/app/global-error.tsx` 가 받는다
- 헤더(`AppHeader`) · 탭바는 레이아웃이 아니라 각 화면 안에 있다. 화면이 터지면 둘 다 걷히므로 **오류 화면이 `AppHeader` 뒤로가기를 직접 그린다** — 동작은 FE-BUG-003 과 같다(기록이 없으면 `/feed`)
- Next 16.3 부터 `error.tsx` 의 `retry()` 가 정식 — 화면을 다시 불러와 그린다(`node_modules/next/dist/docs/…/error.md`)
- 정적 export(앱 빌드)에서도 동작한다 — 오류 경계는 클라이언트 컴포넌트다

---

## Scope

### 포함

```
① 화면 단위  src/app/[locale]/error.tsx
   ┌──────────────────────────────┐
   │ ‹                            │   AppHeader 뒤로가기
   │                              │
   │    화면을 불러오지 못했어요    │
   │  잠시 뒤에 다시 시도해 주세요  │
   │                              │
   │        [ 다시 시도 ]          │   retry()
   └──────────────────────────────┘

② 최상위     src/app/global-error.tsx
   레이아웃까지 터진 경우. 문구 파일 · 글꼴 · 전역 스타일을 못 쓴다(Next 제약)
   → 한 · 영 두 줄을 같이 적고, 새로고침 버튼 하나. 인라인 스타일로 최소한만

③ 카드 단위  ItemBoundary (src/components/common/ItemBoundary.tsx)
   추천 목록 카드 · 저장 목록 행 · 함께 둘러볼 곳 행을 하나씩 감싼다
   터진 카드는 조용히 빠지고 나머지는 그대로 보인다(대체 화면 없음)
```

- 오류는 `console.error` 로 남긴다 — 수집 서비스는 없다
- 카드 단위는 대체 문구를 그리지 않는다. 카드 자리에 "오류"가 보이면 목록이 더 깨져 보인다

### 제외

| 항목 | 이유 |
|---|---|
| 오류 수집 서비스(Sentry 등) | 공모전 범위 밖. 필요해지면 `error.tsx` 한 곳에 붙인다 |
| 화면별 `error.tsx` | 화면 단위 하나로 모든 화면이 덮인다. 화면마다 다른 안내가 필요해질 때 |
| 데이터 이상 자체의 방어(빈 값 처리) | FE-BUG-004 처럼 발견되는 대로 따로 |
| `react-error-boundary` 도입 | 경계 하나에 의존성을 더하지 않는다. 클래스 15줄로 충분 |

---

## 문구

| 자리 | 한국어 | English |
|---|---|---|
| ① 제목 | 화면을 불러오지 못했어요 | Something went wrong |
| ① 설명 | 잠시 뒤에 다시 시도해 주세요 | Please try again in a moment |
| ① 다시 시도 | 다시 시도 | Try again |
| ② 제목 · 설명 · 버튼 | 문제가 생겼어요 / 새로고침해 주세요 / 새로고침 | Something went wrong / Please reload / Reload — 한 화면에 두 언어를 같이 |

①은 기존 `placeDetail.loadFailed`("불러오지 못했어요 · 다시 시도")와 말투를 맞췄다. 새 문구라 유나 확인 대상.

---

## Strategy

| Step | 내용 |
|---|---|
| 1 | 티켓 · 문구 · 도식 검토 |
| 2 | ③ `ItemBoundary` + 목록 세 곳 감싸기 |
| 3 | ① `[locale]/error.tsx` · ② `global-error.tsx` |
| 4 | 확인 — 일부러 예외를 내서(개발용 스위치) 카드 하나 · 화면 전체 · 레이아웃 각각. 캡처 · `qa:ui` |
| 5 | PR |

---

## Acceptance Criteria

- [ ] 추천 목록에서 카드 하나가 터지면 그 카드만 빠지고 나머지 카드는 보인다
- [ ] 저장 목록 · 함께 둘러볼 곳도 같다
- [ ] 화면이 터지면 오류 화면이 뜨고, 다시 시도로 다시 그리거나 뒤로가기로 나갈 수 있다
- [ ] 레이아웃까지 터지면 한 · 영 안내와 새로고침이 뜬다
- [ ] 오류는 콘솔에 남는다
- [ ] 앱 빌드(정적 export)에서도 같다

---

## Verification

| # | 시나리오 | 기대 |
|---|---|---|
| 1 | 추천 목록 — 카드 하나에 강제 예외 | 그 카드만 빠짐 · 나머지 118곳 보임 |
| 2 | 저장 목록 — 행 하나에 강제 예외 | 그 행만 빠짐 |
| 3 | S20 함께 둘러볼 곳 — 행 하나에 강제 예외 | 그 행만 빠짐 · 상세는 정상 |
| 4 | S20 본문에 강제 예외 | ① 오류 화면 · 다시 시도 · 뒤로가기 |
| 5 | 레이아웃에 강제 예외 | ② 최상위 오류 화면 · 새로고침 |
| 6 | 영문 | ① 영문 문구 · ② 두 언어 |

강제 예외는 확인용 임시 코드로 넣고 커밋하지 않는다.

`npx tsc --noEmit` · `npm run lint` · `npm run build` · `BUILD_TARGET=app npm run build`
