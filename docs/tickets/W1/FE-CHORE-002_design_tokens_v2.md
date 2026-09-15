# FE-CHORE-002: 기반 정비 — 디자인 토큰 · 폰트 · i18n

```
색      무채색 → 잉크 위계 + 의미색(danger·caution) + 중립 5단
타이포   임의 값 → 6단 스케일 (12·14·17·19·24·30)
여백    산발 → 4/8 리듬 + --gutter 한 곳
폰트    Noto Sans KR + Cormorant → Pretendard + Instrument Serif
i18n    next-intl · EN/KO · EN 은 일단 KO 복사
```

둘을 한 티켓에 둔 이유 — **전 화면을 기계적으로 훑는 작업**이라 두 번 훑을 이유가 없다.
화면 구조는 건드리지 않으므로 리뷰도 "값이 바뀌었나"만 보면 된다.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | FE |
| Type | CHORE |
| Severity | High |
| Layer | Style / Config / Data |
| Status | Done |
| Screen | 전 화면 |
| Depends | — |
| Related | FE-CHORE-001 (DS v1) |

---

## Problem

DS v1 이 문서 안에서 스스로 모순되고, 실측하면 접근성 기준에 미달한다.

```
"본문에 Light 금지"  라고 적어두고 본문을 300(Light)으로 쓴다
gray-500 #9c9ea4    흰 배경 2.68:1 — 큰 글씨 기준 3:1 도 못 넘음
gray-600 #74767c    surface 위 4.05:1 — 본문 기준 4.5 미달
"색을 쓰지 않습니다"  오류·경고를 표시할 색이 없어 그때그때 만들게 됨
```

타이포도 값이 흩어져 있다. 목업 감사에서 한 화면에 **13종**이 나왔다.

`Cormorant Garamond` 는 디스플레이용 서체다. 16px 숫자로 쓰면 야외에서 가늘어지는데,
이 앱의 사용자는 길에 서서 화면을 본다.

---

## Context

| 용도 | 자료 |
|---|---|
| 확정 토큰 | `docs/_internal/mockup-tokens.css` |
| 근거 | `docs/_internal/concept_v5.html` — 색 체계 · 대비 계산 |
| 현재 | `src/app/globals.css` (310줄) |

`ds-*` 클래스가 화면·컴포넌트 **90곳**에서 쓰인다. 이 티켓이 그 값을 바꾸므로
S00~S03 화면도 함께 변한다.

---

## Scope

### 포함

- `src/app/globals.css` — `:root` 토큰 · `@theme inline` · `.ds-*` 타이포 재정의
- `src/app/layout.tsx` — 폰트 교체
- `src/app/fonts/` — Pretendard 서브셋 3벌
- `next-intl` 설치 · 미들웨어 · 로케일 라우팅 · `messages/{en,ko}.json`
- 위 4개 데이터 파일의 문구를 메시지로 이동

### 제외

- 화면 구조 변경 → 각 화면 티켓에서
- 캐릭터 에셋 → `FE-FEAT-012`
- **영문 번역 작성** → 유나. 이 티켓은 KO 복사로 채운다
- `placeTags` 의 `whyEn` 등 DB 콘텐츠 → 태깅 작업
- 일본어·중국어 → 피그마 S51 은 4개 언어, `CLAUDE.md` 는 EN/KO. 확인 대기

---

## Strategy

### Step 1: 색

```
--primary      #111213  잉크     흰 배경 18.8:1  주요 버튼 · 활성 탭 · 강조
--primary-press #3A3C42          11.0:1         눌림
--primary-tint #F4F4F3           "내 유형" 과 이어지는 영역 배경
--secondary    #A06A48  클레이   4.5:1          쓰는 곳 없음. 존치 여부 확인 대기
--danger       #A33A2A           6.6:1          입력 오류
--caution      #8A6320           5.6:1          정보 없음 · 확인 중
--ink          #111213           18.8:1
--sub          #54565C           7.4:1          메타 · 라벨 (기존 gray-500/600 대체)
```

색은 **의미가 있을 때만** 쓴다. 기본은 잉크와 여백이다.

### Step 2: 타이포

```
12 / 1.5    캡션 · 라벨 · 메타
14 / 1.6    보조 설명
17 / 1.65   본문 — 야외 가독성을 위해 16 에서 올림
19 / 1.5    섹션 제목
24 / 1.45   유형명
30 / 1.3    화면 제목
```

Light(200·300)를 본문에서 뺀다. 안드로이드 WebView 에서 뭉갠다.

### Step 3: 여백 · 레이아웃

```
--s1~s7   4 · 8 · 12 · 16 · 24 · 32 · 48
--gutter  20px   좌우 여백. 모든 컴포넌트가 이 값을 참조한다
```

안전영역과 브레이크포인트는 스크롤 컨테이너 한 곳이 갖는다.

```css
.screen{--gutter:max(20px,env(safe-area-inset-left))}
@media (min-width:600px){.screen{--gutter:32px}}
```

### Step 4: 폰트

Pretendard 는 Google Fonts 에 없다. `next/font/local` 로 넣는다 —
CDN 을 쓰면 Capacitor 오프라인에서 깨진다.

가변 폰트(`PretendardVariable.woff2`)는 **2.0MB** 라 모바일에 무겁다.
서브셋 정적 웨이트를 쓴다 — 브라우저가 실제로 필요한 굵기만 받는다.

```
src/app/fonts/Pretendard-Regular.subset.woff2    400  본문      261KB
src/app/fonts/Pretendard-SemiBold.subset.woff2   600  제목      262KB
src/app/fonts/Pretendard-Bold.subset.woff2       700  강조      264KB
Instrument Serif                                 next/font/google (숫자·브랜드 전용)
```

**굵기를 셋으로 제한한다.** 파일이 늘어나는 것도 있지만, 굵기가 적을수록
디자인이 일관된다. 목업에서 쓰던 450·500 은 400 으로 합쳤다.

한국어 줄바꿈도 여기서 잡는다.

```css
word-break: keep-all;       단어 중간에서 끊기지 않게
overflow-wrap: anywhere;    긴 영문 고유명사 대비
```

### Step 5: i18n

`next-intl` 을 넣는다. **지금 넣는 이유는 화면 수가 가장 적기 때문이다.**

```
지금    S00 · S01 · S02 · S03 · S10 · S20     6개
S10 개편 + 저장 + 내 정보 이후                 9개
```

기본 로케일은 `en` 이다. 타겟이 외국인이다 (요구사항 §1.4).

문구는 이미 데이터 파일에 모여 있어 옮기기 쉽다 — `quiz.ts` · `profile.ts` ·
`tripSetup.ts` · `cf8Profiles.ts`. **구조는 그대로 두고 값만 참조로 바꾼다.**
`QUIZ_QUESTIONS` 같은 배열 모양이 바뀌면 화면 코드까지 손대야 한다.

#### 🔴 영문 콘텐츠가 절반도 없다

```
whyKo / whyEn       49 / 49  →  20 / 49
pro / proEn         49 / 49  →  25 / 49
infoKo / infoEn     49 / 49  →  25 / 49
cf8Profiles         한국어만 — 영문 유형명 3개가 옛 이름, 한 줄 설명 EN 없음
```

**이 티켓은 구조만 넣는다.** EN 메시지는 KO 를 복사해 채우고, 유나 번역이 오는 대로
문구만 갈아끼운다. 그래야 화면이 안 깨지고 재작업도 없다.

DB 콘텐츠는 다르다. **KO 로 대체하지 않는다** — 영어 사용자에게 한국어 문장을
보여주면 읽을 수 없다. 비면 비운 채로 두고 화면이 그 상태를 감당한다
(`FE-FEAT-009` 참고).

```ts
locale === "en" ? (place.whyEn ?? null) : place.whyKo
```

로케일은 `localStorage` 에 둔다. 서버로 보내지 않는다.

#### ⚠️ Next 16 은 `middleware` 가 아니라 `proxy`

`middleware.js` 가 Next 16 에서 deprecated 되고 `proxy.js` 로 바뀌었다
(`node_modules/next/dist/docs/.../middleware.md`). 기능은 같고 파일·export 이름만 다르다.
**next-intl 공식 문서는 아직 `middleware.ts` 기준**이라 참고할 때 헷갈린다.

#### 🔴 정적 export 에는 프록시가 없다

W3 Capacitor 도입 때 걸린다. 앱에서 `/` 를 열면 **아무 일도 일어나지 않는다** —
로케일을 판정할 코드가 없다.

시작 URL 을 `/en/` 으로 박으면 화면은 뜨지만 **기기 언어를 못 읽는다.** `/ko/` 를 박아도
마찬가지다. 어느 쪽을 골라도 절반의 사용자에게 틀린 언어로 시작한다.

둘 중 하나를 W3 에서 검증해야 한다.

```
A  정적 루트 페이지에서 navigator.language 로 판정 후 이동
   웹·앱이 같은 코드로 동작한다
   다만 루트 레이아웃이 app/[locale]/layout.tsx 에 있어 app/layout.tsx 와
   <html> 이 겹칠 수 있다 — 확인 필요

B  @capacitor/device 의 getLanguageCode() 로 읽어 시작 URL 을 정한다
   앱 전용. 웹은 프록시 그대로
```

`generateStaticParams` 로 `/en/*` · `/ko/*` 가 전부 정적 생성되는 것은 확인했다.

---

## Acceptance Criteria

- [ ] 본문 텍스트 대비가 전부 4.5:1 이상 (흰 배경 · surface 위 모두)
- [ ] `.ds-*` 가 6단으로 정리되고, 화면에서 쓰는 크기가 그 여섯 개뿐이다 — 크기 토큰은 6단, `.ds-*` 클래스는 10개
- [x] 좌우 여백이 `--gutter` 한 곳에서 나온다
- [x] Pretendard 가 로컬 파일에서 로드된다 (네트워크 차단 상태에서 확인)
- [x] 본문 굵기가 400·600·700 셋뿐이다
- [ ] S00~S03 이 깨지지 않는다
- [ ] `/en/feed` · `/ko/feed` 가 각각 뜨고 전환이 유지된다
- [ ] 위 4개 데이터 파일에 한국어 문자열이 남아 있지 않다 — `quiz` · `profile` · `cf8Profiles` 완료, `tripSetup.ts` 는 FE-FEAT-012
- [x] `whyEn` 이 없는 장소에서 한국어 문장이 섞여 나오지 않는다
- [x] `tsc --noEmit` · `lint` · `build` 통과

---

## Verification

1. 개발자도구로 본문·메타 텍스트의 대비를 측정 — `surface` 배경 위 포함
2. 네트워크 탭에서 `fonts.googleapis.com` 요청이 Instrument Serif 하나뿐인지
3. 오프라인 모드로 새로고침 — 한글이 시스템 폰트로 떨어지지 않는지
4. S00 · S01 · S02 · S03 을 차례로 열어 레이아웃이 무너진 곳이 없는지
5. iPhone SE 폭(375px)에서 좌우 여백이 20px 인지
6. `/` 진입 → `/en` 으로 가는지
7. `/en/feed` 에서 `whyEn` 이 없는 장소(29곳)에 한국어가 섞이지 않는지
8. Application 탭 — 로케일이 `localStorage` 에만 있는지 (쿠키·서버 전송 없음)
9. `npx tsc --noEmit` · `npm run lint` · `npm run build`

---

## Implementation Notes

### 2026-09-13: 토큰 · 폰트

**옛 토큰 이름을 새 값에 매핑했다.** 화면 코드를 한 줄도 건드리지 않기 위해서다 —
`ds-*` 와 구버전 토큰이 합쳐 96곳에서 쓰이는데, 그중 상당수가 S10·온보딩을
다시 쓰면서 지워진다. 지금 고쳐봐야 두 번 일하게 된다.

```
--muted        #9aa0a6  2.9:1 미달   →  --sub  7.4:1
--ds-gray-500  #9c9ea4  2.68:1 미달  →  --sub  7.4:1
--ds-gray-600  #74767c  4.05:1 미달  →  --sub  7.4:1
```

대비 미달 3건이 값 교체만으로 풀렸다.

**S00 은 토큰을 안 쓰고 있었다.** `text-[12.5px] font-light` 처럼 하드코딩돼 있어
이 티켓의 영향을 안 받는다. Pretendard 에 300 이 없어 400 으로 대체되므로 글자가
조금 굵어진다. `FE-FEAT-012` 에서 다시 쓴다.

**`.screen` 을 추가했다.** 좌우 여백·안전영역·브레이크포인트를 한 곳이 갖는다.
지금은 쓰는 화면이 없고 `FE-FEAT-009` 부터 쓴다.

### 2026-09-14: primary 를 잉크로 (유나 확정)

딥그린 `#2A5A48` 은 피그마에 색 변수·색 스타일로 등록된 적이 없고, 쓰인 곳도
FLOW 04 코스 화면(S32·S33·S34·S36)의 토글·상태 칩과 비교용 시안 프레임
`S20 · 장소 상세 [green]` 뿐이었다. 둘 다 이번 공모전 범위 밖이다.
DS v1 의 Primary 는 `#111213`, Accent 는 배경 틴트 `#EFF5F0` 이고 초록은
사진 위 스크림 `#06422F` 가 유일한 예외다.

```
--primary       #2A5A48 → #111213   18.8:1
--primary-press #1E4436 → #3A3C42   11.0:1
--primary-tint  #EEF3F1 → #F4F4F3
viewport.themeColor  #2A5A48 → #FFFFFF
```

초록 도입 여부는 유나가 따로 정한다. 그때 위 세 줄만 바꾸면 된다.
`--secondary`(클레이)는 색으로 칠하는 곳이 하나도 없어 값만 남겨뒀다.

---

## Derived Artifact Naming Rule

```text
티켓 ID:     FE-CHORE-002
파일명:      FE-CHORE-002_design_tokens_v2.md
브랜치명:    chore/foundation-tokens-i18n
```
