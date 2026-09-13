# FE-CHORE-002: 기반 정비 — 디자인 토큰 · 폰트 · i18n

```
색      무채색 → 브랜드(딥그린) + 의미색(danger·caution) + 중립 5단
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
| Status | Backlog |
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
- `public/fonts/` — Pretendard 로컬 파일
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
--primary      #2A5A48  딥그린   흰 배경 7.9:1   주요 버튼 · 활성 탭 · 강조
--primary-tint #EEF3F1           "내 유형" 과 이어지는 영역 배경
--secondary    #A06A48  클레이   4.5:1          보조 강조. 본문에는 쓰지 않는다
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

```
public/fonts/PretendardVariable.woff2     가변 폰트 1개
Instrument Serif                          next/font/google (숫자·브랜드 전용)
```

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

---

## Acceptance Criteria

- [ ] 본문 텍스트 대비가 전부 4.5:1 이상 (흰 배경 · surface 위 모두)
- [ ] `.ds-*` 가 6단으로 정리되고, 화면에서 쓰는 크기가 그 여섯 개뿐이다
- [ ] 좌우 여백이 `--gutter` 한 곳에서 나온다
- [ ] Pretendard 가 로컬 파일에서 로드된다 (네트워크 차단 상태에서 확인)
- [ ] S00~S03 이 깨지지 않는다
- [ ] `/en/feed` · `/ko/feed` 가 각각 뜨고 전환이 유지된다
- [ ] 위 4개 데이터 파일에 한국어 문자열이 남아 있지 않다
- [ ] `whyEn` 이 없는 장소에서 한국어 문장이 섞여 나오지 않는다
- [ ] `tsc --noEmit` · `lint` · `build` 통과

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

(구현 후 작성)

---

## Derived Artifact Naming Rule

```text
티켓 ID:     FE-CHORE-002
파일명:      FE-CHORE-002_design_tokens_v2.md
브랜치명:    chore/foundation-tokens-i18n
```
