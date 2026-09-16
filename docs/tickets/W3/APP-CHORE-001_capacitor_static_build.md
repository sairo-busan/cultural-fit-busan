# APP-CHORE-001: 앱 빌드 — 정적 export 전환과 API 분리

```
웹    화면 + API 가 한 몸으로 Vercel 에 있다
앱    화면만 기기 안에 들어가고 API 는 Vercel 에 남는다
```

이 차이 때문에 지금 코드가 **앱에서 동작하지 않는 지점이 셋**이다.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | APP |
| Type | CHORE |
| Severity | Critical |
| Layer | Config / Route / Lib |
| Status | In Progress |
| Screen | 전 화면 |
| Depends | - |
| Related | WBS `APP-012`(Capacitor 빌드) · `docs/decisions/capacitor_선택.md` · `docs/MEMORY.md` 2026-09-10 |

---

## Problem

- **현재 동작**: `output: 'export'` 를 켠 적이 없다. Capacitor 도 미설치. 앱으로 감싸면 데이터가 아예 오지 않는다.
- **기대 동작**: 화면만 정적 번들로 기기에 넣고, 데이터는 Vercel API 를 절대 주소로 부른다.
- **영향 범위**: `next.config.ts` · `scripts/build-app.sh`(신규) · `src/lib/apiBase.ts`(신규) · `src/hooks/useRecommendations.ts` · `src/app/[locale]/saved/SavedContent.tsx` · `src/components/place/PlaceRow.tsx` · `capacitor.config.ts` · `android/` · `assets/`

---

## Context

### 정적 export 가 버리는 것 셋

Next 16 공식 문서 `01-app/02-guides/static-exports.md` 의 **Unsupported Features** 에서 확인했다.

```
- Route Handlers that rely on Request     ← /api/recommend · /api/weather
- Proxy                                   ← 로케일 판정 (src/proxy.ts)
- Image Optimization (default loader)     ← next/image
```

Route Handler 는 빌드 시점에 **정적 응답으로 구워진다.** `GET` 만 되고 결과가 고정된다.
날씨는 그러면 **빌드 시점 예보가 앱에 박제**된다 — "지금 이 순간" 을 파는 앱에 맞지 않는다.

### API 를 앱에 넣을 수 없다 (2026-09-10 결정)

`/api/recommend`(`MONGODB_URI`) · `/api/weather`(`KMA_API_KEY`) · `/api/tour`(`TOUR_API_KEY`)
셋 다 **시크릿을 숨기려고 만든 프록시**다. 클라이언트로 옮기면 APK 디컴파일로
공공데이터포털 키가 노출된다.

`server.url` 로 Vercel 을 통째로 로드하는 방식은 오프라인 셸이 사라지고 스토어 심사에서
"웹뷰 껍데기" 로 볼 여지가 있어 차선.

### 클라이언트가 실제로 부르는 API 는 둘뿐 (2026-09-14 실측)

```
/api/recommend    useRecommendations.ts · SavedContent.tsx    호출 2곳
/api/weather      useRecommendations.ts                        호출 1곳
/api/tour         호출처 없음 — 배치·수동용
/api/health       호출처 없음 — 모니터링용
```

앱이 부르는 건 둘이지만 CORS 는 `/api/*` 전체에 건다 — 새 라우트가 생길 때 빠뜨리지 않는다.

---

## Scope

### 포함

| # | 작업 | 왜 |
|---|---|---|
| 1 | `apiUrl()` 도입 · 호출 3곳 교체 | 앱 출처에는 `/api` 가 없다 |
| 2 | `next.config.ts` 에서 `/api/*` CORS | 웹뷰 출처와 API 출처가 다르다 |
| 3 | 앱 산출물에 루트 진입점 생성 (`navigator.language` 판정) | 앱엔 미들웨어가 없어 `/` 가 아무 데도 안 간다 |
| 4 | `BUILD_TARGET=app` 일 때만 `output:'export'` | 웹 빌드를 깨뜨리지 않는다 |
| 5 | Capacitor 설치 · APK · 실기기 확인 | |
| 6 | **S20 상세 진입 차단** | 상세가 아직 목업 값이다. 잘못된 데이터를 보여주느니 막는다 |

### 제외

| 항목 | 이유 |
|---|---|
| **기기 언어 정밀 판정** (`@capacitor/device`) | 3번의 `navigator.language` 로 충분. 제출 후 |
| **S20 실데이터 연결** | FE-FEAT-010. 이번엔 진입만 막는다 |
| **오프라인 캐시** | 별건. 지금은 네트워크 실패 화면으로 받는다 |
| **PR #16~18 머지** | 앱 빌드와 독립. 열린 PR 넷 모두 `/api/*` 를 한 줄도 안 건드린다 |

---

## Strategy

### Step 1 — API 기준 주소를 환경변수로

```ts
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "").replace(/\/$/, "");
export function apiUrl(path: string) { return `${API_BASE}${path}`; }
```

웹은 빈 문자열이라 상대 경로 그대로. 앱 빌드에서만
`NEXT_PUBLIC_API_BASE=https://cultural-fit-busan.vercel.app` 를 채운다.

### Step 2 — CORS

`next.config.ts` 의 `headers()` 로 `/api/:path*` 전체에 건다. 라우트 파일은 건드리지 않고,
새 라우트도 자동으로 적용된다. 정적 export 는 `headers` 를 지원하지 않아 **웹 빌드에만** 건다.

`*` 를 쓴다. 출처를 좁혀도 얻는 게 없다 — 공개 관광정보를 돌려주고 인증·쿠키가 없으며,
CORS 는 브라우저만 제약해서 `curl` 한 줄은 그대로 통과한다. 반대로 앱의 출처 문자열은
Capacitor 버전·`androidScheme` 설정에 따라 달라져서, 목록으로 박으면 **앱에서만 조용히
깨진다.**

남는 문제는 따로다 — 누구나 이 프록시로 우리 할당량을 쓸 수 있다. 호출량 제한으로 풀 일.

### Step 3 — 루트 로케일 판정

`scripts/build-app.sh` 가 `out/index.html` 을 만든다. Next 라우트로 만들지 않아 웹에는 영향이 없다.

Capacitor 는 확장자 없는 경로(`/en/`, `/en/feed/`)를 받으면 **항상 루트 `index.html`** 을
돌려준다(`WebViewLocalServer` html5mode). 그래서 루트 파일은 `/` 일 때만 언어를 고르고, 나머지는
실제 파일(`…/index.html`)로 보낸다. 각 페이지는 `<head>` 맨 앞 스크립트로 주소에서 `index.html` 을
떼어 라우터가 `/en/feed/` 로 읽게 한다.

기본값은 `ko` 다. 영어 기기만 `/en` 으로 보낸다.

### Step 4 — 빌드 타깃 분리

```ts
const isApp = process.env.BUILD_TARGET === "app";
```

`output:'export'` 와 `images.unoptimized` 를 이 플래그 아래 둔다. Vercel 빌드는 그대로다.

### Step 5 — Capacitor

`androidScheme` 을 확인하고 실기기에서 목록·저장·언어 전환을 본다.

---

## 제외 방식 — 실측으로 정함 (2026-09-14)

`BUILD_TARGET=app npm run build` 를 그냥 돌려 에러를 봤다. **둘이 막고 있었다.**

```
Page "/place/[id]" is missing "generateStaticParams()" so it cannot be used with "output: export"
export const dynamic = "force-static" … not configured on route "/api/tour" with "output: export"
```

빌드 순서가 **페이지 → API** 라 처음엔 `/place/[id]` 만 보였다. 그것만 빼고 다시 돌려서야
API 에러가 드러났다. 하나씩 고치면 두 번 헛짚는다.

`scripts/build-app.sh` 가 빌드 동안만 두 디렉터리를 옮긴다. `trap` 으로 빌드가 죽어도
원위치시킨다 — 작업 트리에 남으면 그다음 웹 빌드가 깨진다.

| 옮기는 것 | 왜 |
|---|---|
| `src/app/api` | 요청 파라미터를 읽는 Route Handler 는 정적 export 가 지원하지 않는다. API 는 Vercel 에 남고 앱은 절대 주소로 부른다 |
| `src/app/place` | `/place/[id]` 가 `generateStaticParams()` 없는 동적 라우트. S20 이 목업 값이라 이번엔 화면을 넣지 않는다. 실데이터가 붙으면(FE-FEAT-010) 이 줄을 지운다 |

`pageExtensions` 로 거르는 방법도 있었으나 에린 소유 파일 4개를 개명해야 해서 택하지 않았다.

> `docs/MEMORY.md`(2026-09-10)의 *"`.cap_bak/` 으로 옮기고 빌드하는 방식을 쓸 수 없다"* 는
> **빌드에서 잠시 빼는 것을 막는 말이 아니었다.** 근거가 *"시크릿을 클라이언트로 옮기면
> 안 된다"* 인데, 우리는 API 를 앱에 넣지 않고 Vercel 에 그대로 둔다. 메모를 명확히 고쳤다.

---

## 에린에게 미치는 영향

에린 소유 파일 중 **1개**만 건드린다. 라우트 파일은 그대로다.

| 파일 | 변경 | 등급 |
|---|---|---|
| `useRecommendations.ts` | `fetch("/api/…")` → `apiUrl(…)` | 🟡 |
| `api/**/route.ts` · `recommendEngine.ts` · `recommend.ts` | 안 건드림 | ⚪ |

**앞으로 지켜야 할 규칙 둘이 생긴다.** 둘 다 **웹에서는 멀쩡해서 리뷰에서 놓치기 쉽다.** (2026-09-15 에린 동의)

```
클라이언트 호출          fetch(apiUrl("/api/…"))
앱 업로드 ~ 심사 종료    recommend · weather 응답은 필드 추가만 (삭제 · 이름 · 형태 · 파라미터 변경 안 함)
```

상세는 `docs/앱_출시_가이드.md`.

계산식·DB 스키마는 건드리지 않는다.

---

## Acceptance Criteria

- [x] 웹 빌드(`npm run build`)가 이전과 동일하게 통과한다 — API 4개·`/place/[id]` 동적 유지
- [x] `/api/*` 응답에 `Access-Control-Allow-Origin: *` 이 있고 화면 페이지에는 없다 (로컬 `next start` 확인)
- [x] `NEXT_PUBLIC_API_BASE` 가 비면 웹이 상대 경로로 그대로 동작한다
- [x] 앱 빌드(`npm run build:app`)가 `out/` 에 정적 파일을 만든다 — 8페이지
- [x] 앱에서 `/` 를 열면 기기 언어에 따라 `/en` 또는 `/ko` 로 간다 (에뮬레이터 · 영어 기기)
- [ ] 실기기에서 추천 목록이 뜨고, 저장·해제가 유지되고, 언어 전환이 된다
- [x] S20 상세로 들어갈 수 없다 — 앱 번들에 `/place/` 링크 0건
- [x] 서명된 AAB · APK — `com.sairo.app` · `7 / 2.3.0` · 원스토어 업로드 키와 SHA-256 일치
- [x] `tsc --noEmit` 통과
- [x] `lint` — 이번 브랜치가 바꾼 파일에서 문제 없음

---

## Verification

1. `npm run build` — 웹 빌드가 깨지지 않는지
2. `curl -D - .../api/recommend?limit=1` — CORS 헤더
3. `curl -D - .../en/feed` — 화면 페이지엔 헤더가 **없는지**
4. `npm run build:app` — `out/` 에 정적 파일. 환경변수가 비면 중단하는지도 확인
5. 에뮬레이터 — 목록 · 저장 후 앱 재시작 · 언어 전환 · 상세 진입 차단
6. 비행기 모드 — "목록을 불러오지 못했어요" + 다시 시도

---

## Implementation Notes

| 항목 | 값 |
|---|---|
| Capacitor | 8.5.2 · Node 22 · JDK 21 · compileSdk/targetSdk 36 · minSdk 24 |
| 패키지 · 버전 | `com.sairo.app` · versionCode `7` / versionName `2.3.0` — 원스토어 `1 / 1.0`, Play 콘솔 `6 / 2.2.1` 보다 크게 |
| 서명 | `~/.android/keystores/sairo.jks` · 비밀번호는 `~/.gradle/gradle.properties` (`SAIRO_*`). 둘 다 저장소 밖 |
| 아이콘 · 스플래시 | 원본 `assets/SAIRO_wordmark_*.png`. adaptive 전경 로고 폭 52% · 흰 배경. 스플래시는 짧은 변의 45% |
| 빌드 | `NEXT_PUBLIC_API_BASE=https://cultural-fit-busan.vercel.app npm run build:app` → `npx cap sync android` → `./gradlew assembleRelease bundleRelease` |

---

## Derived Artifact Naming Rule

```text
티켓 ID:     APP-CHORE-001
파일명:      APP-CHORE-001_capacitor_static_build.md
브랜치명:    feat/capacitor-build
```
