# FE-FEAT-003: 진단 체계 CF8 전환 — S01 취향 진단 · S02 취향 결과

CFP 16유형(4축 6문항)으로 구현된 진단을 **CF8 8유형(3축 3문항)** 으로 전환한다. 정본은 기획 구글 시트 `[최] SAIRO 통합본` 이며, 정의가 완비되어 있어 그대로 옮기면 된다.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | FE |
| Type | FEAT |
| Severity | Critical |
| Layer | Page / Component / Lib |
| Status | In Progress |
| Screen | S01, S02 |
| Depends | — |
| Related | FE-FEAT-001(온보딩 최초 구현, PR #1) · PR #7(CF8 문서 정리, 머지 대기) · BE-FEAT-005(에린 — 이 티켓이 확정하는 `cf8_code` 가 입력 규격) |

---

## Problem

- **현재 동작**: 6문항(동반인·걷기·분위기·장소성향·체류·매운맛) + Hard Filter 폼 → 4축 환산 → `QLMS` 같은 CFP 4글자 코드. S02는 축 슬라이더 4개와 유형 코드를 표시한다.
- **기대 동작**: 3문항(4/4/3지선다) → 축 값의 부호를 이어붙여 `CLD`~`EFV` 3글자 `cf8_code`. S02는 축 카드 3개를 보여주고 **코드·점수는 숨긴다**.
- **영향**: 진단이 구버전이면 저장되는 프로필 자체가 틀리고, 그 위에 붙는 추천·피드·상세가 전부 잘못된 기준으로 동작한다. 에린의 BE-FEAT-005도 프론트가 저장하는 값에 맞춰야 하므로 이 티켓이 선행이다.

---

## Context

```
정본: 기획 구글 시트 [최] SAIRO 통합본
  - CFQ01~03 문항(질문·선택지·helper_text·screen_order, status ACTIVE)
  - cf_code 8종(CLD~EFV) + profile_name + explanation_template
  - 축 필드 cf_atmosphere / cf_local_famous / cf_deep_variety

관련 문서:
  - docs/decisions/진단체계_CF8_전환_검토.md 2절(CF8 정의) · 3-A절(코드 전환 범위)
  - docs/화면_IA.md FLOW 01

수정 대상:
  - src/types/cfp.ts      축·응답·프로필 타입
  - src/data/quiz.ts      CFQ01~03 문항 데이터
  - src/lib/cfp.ts        환산 + 8유형 메타데이터
  - src/data/profile.ts   축 라벨 + 결과 문구
  - src/app/onboarding/page.tsx  S01
  - src/app/profile/page.tsx     S02
```

### CF8 정의 (정본 그대로)

문항 문구는 **피그마 S01(`1007:1661`) 실물 기준**이다. 정본 시트는 같은 축을 2지선다로 정의하고 있으나 화면은 4/4/3지선다다.

| id | axis_field | 단계 라벨 | 질문 | 선택지 → 축 값 |
|---|---|---|---|---|
| CFQ01 | `cf_atmosphere` | 1단계 · 분위기 | 지금 어떤 분위기의 여행을 원하시나요? | 차분하고 여유로운 곳 `-2` / 조용하지만 볼거리는 있는 곳 `-1` / 적당히 사람이 있는 곳 `+1` / 활기차고 북적이는 곳 `+2` |
| CFQ02 | `cf_local_famous` | 2단계 · 장소 발견 | 장소는 어떻게 발견하고 싶으신가요? | 숨은 골목과 로컬 분위기 `-2` / 현지인이 자주 가는 곳 `-1` / 알려졌지만 붐비지 않는 곳 `+1` / 부산의 대표 명소 `+2` |
| CFQ03 | `cf_deep_variety` | 3단계 · 여행 방식 | 여행 방식은 어떤 편인가요? | 한 곳을 오래 즐기기 `-2` / 적당히 머물며 이동하기 `0` / 여러 곳을 돌아보기 `+2` |

**환산: 축 값의 부호가 코드를 결정하고, 세 코드를 이어붙이면 유형 코드다** (`C + L + D` → `CLD`). 중립(`0`)은 왼쪽으로 귀결시킨다.

⚠️ 선택지를 축 값으로 접는 규칙은 정본 시트에도 피그마에도 없다. 화면 단계 수와 장소 태깅 척도(−2~+2)에 맞춰 정한 것이며 **유나 확인 필요**.

| cf_code | profile_name | axis_vector |
|---|---|---|
| CLD | 고요한 로컬 몰입가 | `-1,-1,-1` |
| CLV | 조용한 골목 탐험가 | `-1,-1,+1` |
| CFD | 느긋한 명소 감상가 | `-1,+1,-1` |
| CFV | 차분한 명소 수집가 | `-1,+1,+1` |
| ELD | 활기찬 로컬 몰입가 | `+1,-1,-1` |
| ELV | 로컬 에너지 탐험가 | `+1,-1,+1` |
| EFD | 활기찬 명소 체험가 | `+1,+1,-1` |
| EFV | 에너지 명소 순회자 | `+1,+1,+1` |

⚠️ **축 글자가 CFP16과 겹치지만 뜻이 다르다.** `V` 가 CFP16에서는 "활기"(분위기), CF8에서는 "다양하게 경험"(경험)이다. 기계적 치환 금지.

---

## Scope

### 포함

- `types/cfp.ts` — `CfpAxes` 4축→3축, `QuizAnswers` 6개→3개, 축 코드 `C/E`·`L/F`·`D/V`. 음식 축(`PalateAnswer`·`PalateCode`) 제거
- `data/quiz.ts` — 6스텝 → CFQ01~03 3문항. 질문·선택지·설명·helper_text를 정본에서 그대로
- `lib/cfp.ts` — 1~5 점수 매핑 삭제, 축 값 부호 판정으로 단순화. `CFP_TYPES` 16종 → CF8 8종. 프리셋 재정의
- `data/profile.ts` — `AXIS_CONFIG` 3축(차분함↔에너지 / 로컬↔대표명소 / 깊게 머무름↔다양하게), 결과 문구를 유형별 `explanation_template` 로 교체
- `app/onboarding/page.tsx` — S01 3문항. Hard Filter 바텀시트 제거
- `app/profile/page.tsx` — 축 슬라이더 3개, **유형 코드 표기 제거**(정본·피그마 모두 "코드·점수 숨김"), CTA "바로 추천받기" / "조건 더 알려주기"
- localStorage — `cf8_code` 저장(피그마 UXF2 확정 키). 구 키 `cfb-quiz-answers`·`cfb-hard-filter`·`cfb-quiz-step` 정리
- **디자인 시스템 v1 토큰 정의**(`globals.css`)와 **S01·S02 계열 적용** — 색 7종 · 타이포 클래스 9종

### 제외

- **S03 조건 입력** — `travel_mode`(FREE/MEMORY/COMFORT/KID) · `child_age_group` · 보행 부담 · 이동 수단 · 음식 제약. 신규 화면이라 별도 티켓(FE-FEAT-004). 그때까지 `hardFilter` 는 빈 값으로 유지해 S10·S20 동작을 보존한다
- **추천 엔진 매칭** — CF8 축 점수·Fit 산출은 에린 BE-FEAT-005 범위
- **나머지 화면의 디자인 시스템 v1 적용** — S00·S10·S20과 공용 컴포넌트는 위반 100건 이상이라 별도 티켓(FE-CHORE-001). `globals.css` 구버전 토큰도 그쪽에서 정리한다
- **S01 단일 스크롤 레이아웃** — 피그마는 3문항을 한 화면에 두지만, 이번 구현은 기존 스텝 방식(문항당 1화면)을 유지하기로 했다. 문항 데이터와 환산 로직이 레이아웃과 분리돼 있어 `onboarding/page.tsx` 만 손보면 전환 가능

---

## Strategy

### Step 1: 타입 재정의 (`types/cfp.ts`)
CF8 3축 응답 타입과 `Cf8Code` 유니온을 정의한다. `HardFilter` 는 S03 티켓까지 유지.

### Step 2: 문항 데이터 (`data/quiz.ts`)
CFQ01~03을 피그마 문구 그대로 옮긴다. 선택지마다 축 값(−2~+2)을 부여.

### Step 3: 환산 + 유형 메타 (`lib/cfp.ts`)
답 3개 연결로 코드 산출. 8유형 `profile_name`·`explanation_template` 반영.

### Step 4: S01 화면 (`app/onboarding/page.tsx`)
3문항으로 축소, Hard Filter 단계 제거.

### Step 5: S02 화면 (`app/profile/page.tsx`)
축 3개 표시, 코드 숨김, CTA 2개.

### Step 6: 빌드 + 흐름 검증

---

## Acceptance Criteria

- [ ] S00 → S01 → S02 → S10 흐름이 끊기지 않는다
- [ ] S01이 3문항이고 선택지가 4/4/3개다
- [ ] 세 답의 조합 8가지가 각각 올바른 `cf_code` 로 산출된다 (`C+L+D` → `CLD` 등)
- [ ] S02에 축 카드 3개가 표시되고 **유형 코드·점수가 노출되지 않는다**
- [ ] S02 유형명·설명이 정본 `profile_name`·`explanation_template` 와 일치한다
- [ ] `cf8_code` 가 localStorage에 저장된다
- [ ] 구 키(`cfb-quiz-answers`·`cfb-hard-filter`·`cfb-quiz-step`)가 남아 있어도 오류 없이 새 진단으로 진입한다
- [ ] S10 피드·S20 상세가 기존대로 동작한다 (목데이터)
- [ ] `npm run build` 통과

---

## Verification

- 8가지 조합을 모두 눌러 유형명이 정본과 일치하는지 확인
- 브라우저 localStorage에서 `cf8_code` 값 확인
- 기존 사용자 시나리오: 구 키가 남은 상태에서 `/onboarding` 진입 → 정상 동작

---

## Implementation Notes

### 2026-09-03: 구현 완료

**신규**
- `src/lib/storage.ts` — localStorage 키를 한 곳에 모았다. `cf8_code` 는 피그마 UXF2 확정 이름이라 그대로 쓰고, 앱 내부 상태는 `cfb-` 접두사를 유지했다. `clearDiagnosis()` 가 구 키(`cfb-quiz-answers`·`cfb-quiz-step`)까지 함께 지운다.

**변경**
- `types/cfp.ts` — `Cf8Code` 유니온 8종, `AxisValue`(−2~+2), `Cf8Axes`, `Cf8Profile`. `HardFilter` 는 S03 티켓까지 유지
- `data/quiz.ts` — `QUIZ_QUESTIONS` 3문항(4/4/3지선다). 피그마 S01 문구 그대로 + 선택지별 축 값
- `lib/cfp.ts` — 점수 매핑 삭제. `getCf8Code()` 는 축 코드 3개를 이어붙이기만 한다. `profileFromCode()` 추가 — `cf8_code` 만 남은 재방문 경로에서 프로필 복원용
- `data/profile.ts` — 3축 라벨 + 축 코드별 안내 문구 6종
- `onboarding/page.tsx` — 534줄 → 148줄. Hard Filter 바텀시트·드래그 핸들러 전부 제거
- `profile/page.tsx` — 슬라이더 3개, 동반인·걷기 칩 제거(S03로 이동), CTA "바로 추천받기" / "조건 더 알려주기"(현재는 안내 토스트) + "다시 하기"
- `feed/page.tsx` — 뱃지에서 유형 코드 제거, 유형명만 표시
- `components/quiz/QuizProgress.tsx` — 세그먼트 수 하드코딩 6 → `totalSteps`
- `components/profile/AxisSlider.tsx` — `value` 1~5 척도 → −2~+2. 점 위치가 선택 단계를 반영
- `CLAUDE.md` — 핵심 차별점·F1·W1 항목·심사 기준의 진단 서술을 CF8 기준으로 갱신

**검증**
- `npm run build` 통과
- 8가지 조합이 모두 정본 유형명과 일치하는지 대조 완료
- `/` `/onboarding` `/profile` `/feed` `/place/126078` 전부 200

### 2026-09-03: 피그마 대조 후 수정

피그마 S01·S02를 직접 확인한 결과 초기 구현이 세 군데 틀려 고쳤다.

1. **선택지 수** — 2지선다로 만들었으나 실제는 4/4/3지선다. 문항 데이터와 축 값 모델(`-1|1` → `-2~+2`)을 교체
2. **문구** — 정본 시트 문구를 썼으나 화면 문구가 다름. 피그마 기준으로 교체
3. **디자인 시스템** — 파란 강조색·`font-light`·스케일 밖 폰트를 쓰고 있었음. DS v1 토큰으로 교체

### 디자인 시스템 v1 적용 범위

`globals.css` 에 색 7종·타이포 클래스 9종을 정의하고 **S01 계열에만** 적용했다(`onboarding/page.tsx`·`QuizOption`·`QuizProgress`·`AxisSlider`). 구버전 토큰(`accent`·`muted` 등)은 S00·S10·S20이 쓰고 있어 남겨뒀다 → **FE-CHORE-001**

### 남은 확인 사항

- **Q3 중립(`0`) 처리** — "적당히 머물며 이동하기"를 고르면 코드가 `D` 로 귀결된다. 근거 없이 정한 규칙이라 유나 확인 필요
- **S02 정보 구조** — 피그마는 축 카드마다 제목·설명이 있고("분위기 우선 / 공간의 감성과 분위기를 가장 먼저 살펴요") "이런 스타일이에요" 섹션으로 묶여 있다. 축 방향별로 6종씩 필요한데 정본·피그마 어디에도 3종만 있어 문구 확보가 필요하다
- **피그마 유형명 "감성 탐험가"** — 정본 8유형에 없다. 목업으로 보고 정본 `profile_name` 을 썼다
