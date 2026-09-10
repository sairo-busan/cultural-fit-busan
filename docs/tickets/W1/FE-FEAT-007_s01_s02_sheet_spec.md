# FE-FEAT-007: S01 2지선다 전환 + S02 시트 기반 동적 매핑

```
S01  4/4/3지선다 → 2지선다 3문항 · 문항당 1화면 → 한 화면
S02  코드에 박힌 유형명·설명 → 시트 조회 (8유형 × ui_* 11컬럼)
```

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | FE |
| Type | FEAT |
| Severity | Critical |
| Layer | Page / Data / Types / Lib |
| Status | Done |
| Depends | FE-FEAT-006 (PR #13 — `cfp.ts` 유형명·`trip_setup_mode`) |
| Related | FE-FEAT-008 (S03 전면 개편) |

---

## Problem

**S01** — 피그마의 4/4/3지선다로 구현했는데 유나가 9/9에 "임시안이며 최종안이 아니다"라고 확인해줬다. 시트는 처음부터 2지선다다.

지금은 선택지의 세기가 점수에 반영되지 않는다. `toAxis()` 가 부호만 보므로 `-2`·`-1` 이 같은 축 코드가 된다. 3번 문항의 중립(`0`)은 왼쪽 `D` 로 흡수돼 **어느 쪽도 아닌 답이 한쪽으로 단정된다.**

**S02** — 유형명·설명이 `cfp.ts` 에 하드코딩돼 시트가 바뀔 때마다 코드를 고쳐야 한다. 9/7~9/9 이틀 사이 8개 중 3개(`ELV`·`EFD`·`EFV`)가 바뀌어 PR #13에서 맞춘 이름이 이미 낡았다.

---

## Context

| 용도 | 탭 |
|---|---|
| S01 문항·문구 | [`05_CFQ_취향문항`](https://docs.google.com/spreadsheets/d/1-6usA2CWMCKvUWf53SJRWwzkuvRBmwpE_H958bWAGWE/edit?gid=1808300501) · [`1_03A-1_CF설문3문항`](https://docs.google.com/spreadsheets/d/1-6usA2CWMCKvUWf53SJRWwzkuvRBmwpE_H958bWAGWE/edit?gid=1069717930) (문구 동일) |
| S02 화면 문구 | [`2_03A_CF8프로필`](https://docs.google.com/spreadsheets/d/1-6usA2CWMCKvUWf53SJRWwzkuvRBmwpE_H958bWAGWE/edit?gid=252207444) |
| 계산 규칙 | [`4_03A-2_CF점수기준`](https://docs.google.com/spreadsheets/d/1-6usA2CWMCKvUWf53SJRWwzkuvRBmwpE_H958bWAGWE/edit?gid=11755224) — `CALC_01` 왼쪽 −1 / 오른쪽 +1 |
| 화면 | 피그마 `S01`(1007:1661) · `S02`(1007:1769) · 화면설계서 slide1~2 |

⚠️ 시트가 계속 바뀐다. 착수 시점에 다시 읽을 것.

**S01 3문항** — `CFQ01` `cf_atmosphere` C↔E · `CFQ02` `cf_local_famous` L↔F · `CFQ03` `cf_deep_variety` D↔V. 세 코드를 이어 `cf_type_code`(`CLD`~`EFV`)를 만든다.

**S02 매핑** — 화면에는 `profile_name` 과 `ui_*` 만 쓴다. `axis_*` 는 계산 확인용, `engine_*` 은 엔진 내부용이다.

```
제목 profile_name · 소개 ui_result_intro · 추천방향 ui_recommendation_promise
카드 3종  ui_atmosphere/place/rhythm  각각 _value · _title · _body
```

---

## Scope

### 포함

- `src/data/quiz.ts` · `src/types/cfp.ts` · `src/lib/cfp.ts` — 2지선다 문구 교체, `AxisValue` 를 `-1 | 1` 로 축소
- `src/data/cf8Profiles.ts` (신규) — 8유형 × 11컬럼 시트 사본
- `src/app/profile/page.tsx` — 시트 조회로 교체
- `src/app/onboarding/page.tsx` — 3문항 한 화면으로 재작성
- `src/components/common/ChoiceChipGroup.tsx` (신규) — Radix `RadioGroup` 기반
- `src/components/common/AppHeader.tsx` · `globals.css` — 안전영역·접근성

### 제외

- S03 전면 개편 → `FE-FEAT-008`
- `one_line_ko` 채택 여부 → 유나 확인 후
- **간격 표기 정리와 `text-gray-500` 교체 → `FE-CHORE-001`.** 대상이 S00·S20 등 구버전 화면이라 화면 단위로 다루는 편이 낫다
- 시트 런타임 조회 → 정적 데이터라 빌드 타임 상수로 충분하다

---

## Strategy

### Step 1: 시트 재확인

`05_CFQ` 와 `1_03A-1` 의 문구가 일치하는지 대조한다.

### Step 2: S01 문항 데이터 교체

`quiz.ts` 를 시트 사본으로. 선택지를 2개로 줄이고 `helper_text`·`left/right_description` 을 새로 넣는다.

### Step 3: 축 값 범위 축소

```ts
export type AxisValue = -1 | 1;          // -2 | -1 | 0 | 1 | 2 에서
const resolved: AxisValue = value ?? -1; // toAxis 폴백
atmosphere: safe[0] === "C" ? -1 : 1,    // profileFromCode 복원
```

값만 지우면 4지선다 잔재가 다시 들어와도 컴파일이 통과한다. `profileFromCode()` 를 같이 고치지 않으면 재방문 시 S02 슬라이더가 맨 끝으로 간다.

### Step 4: S02 시트 사본 생성

`cf8Profiles.ts` 를 스크립트로 뽑는다. 손으로 옮기면 8유형 × 11컬럼에서 오타가 난다.

### Step 5: S02 화면을 조회 방식으로

`CF8_PROFILES[profile.code]` 로 바꾸고, 시트에 대응 항목이 없는 것은 지운다 — `AXIS_STYLE`·`AXIS_GUIDE`(절반이 초안), "이렇게 안내하겠습니다" 섹션(위 카드와 중복).

### Step 6: S01을 한 화면으로

3문항을 한 화면에 두고 진행 단계 저장·자동 넘김·퇴장 애니메이션·이어하기 토스트를 걷어낸다. 선택지는 `ChoiceChipGroup` 의 `row` 변형을 쓴다.

### Step 7: 접근성 보완

DS v1이 다루지 않는 영역만 채운다. 토큰 값은 건드리지 않는다.

```
focus-visible · prefers-reduced-motion · pt-safe-header · pb-safe-cta
```

DS v1 **내부에서 어긋난 것**만 고친다 — `ds-display` 두께 100→300, `ds-body-1` 15→16px.

---

## Acceptance Criteria

- [x] S01 3문항이 한 화면에, 각각 선택지 2개
- [x] 왼쪽 `-1`, 오른쪽 `+1` 로만 저장 (`AxisValue` 타입이 강제)
- [x] 문구가 `05_CFQ_취향문항` 과 일치
- [x] S02가 `cf_type_code` 로 `CF8_PROFILES` 를 조회해 표시
- [x] `cfp.ts` 에 유형명·설명 문자열이 남아 있지 않음
- [x] 미응답이 있으면 결과로 이동하지 않음
- [x] `tsc --noEmit` · `npm run build` 통과

---

## Verification

1. `/onboarding` — 3문항이 한 화면에, 각각 선택지 2개
2. 상단 단계 표시가 첫 미응답 문항을 가리키고, 누르면 그 문항으로 스크롤
3. 하나만 비우고 `내 여행 스타일 확인하기` → 결과로 안 가고 그 문항으로 이동
4. 왼쪽만 셋 → `CLD`, 오른쪽만 셋 → `EFV` 로 S02 진입
5. S02 유형명·소개 2문장·축 카드 3종이 시트와 일치, "이렇게 안내하겠습니다" 없음
6. `다시 하기` 로 8유형 확인 — 특히 `ELV`·`EFD`·`EFV`
7. 키보드 — Tab 으로 그룹 진입, 화살표로 선택지 이동, 포커스 링 표시
8. `npx tsc --noEmit` · `npm run build`

---

## Implementation Notes

- 변경 파일: `quiz.ts` · `cf8Profiles.ts`(신규) · `profile.ts` · `types/cfp.ts` · `lib/cfp.ts` · `onboarding/page.tsx` · `profile/page.tsx` · `page.tsx` · `ChoiceChipGroup.tsx`(신규) · `QuizProgress.tsx` · `AppHeader.tsx` · `globals.css`
- 선행: `FE-FEAT-006` ([PR #13](https://github.com/sairo-busan/cultural-fit-busan/pull/13))
- 추가 의존성: `@radix-ui/react-radio-group`

### 주요 결정

- **시트를 런타임에 조회하지 않고 `cf8Profiles.ts` 에 사본을 둔다.** 정적 데이터라 바뀌면 어차피 배포가 필요하다. 대신 시트가 바뀔 때 사람이 갱신해야 하는 중복이 남는다 — 갱신 지점을 한 곳으로 모은 것이 목적이다.
- **`AxisValue` 를 `-1 | 1` 로 좁혔다.** 값만 지우면 잔재가 들어와도 컴파일이 통과한다.
- **shadcn 전체 대신 Radix 프리미티브만 설치했다.** shadcn `init` 의 CSS 변수 체계가 DS v1과 충돌하고, 기존 컴포넌트 12개를 마이그레이션할 여유가 없다.
- **`ChoiceChipGroup` 이 도메인 타입에 의존하지 않게 `ChoiceOption` 을 자체 정의했다.** S01(축 값)과 S03(조건 코드)이 같은 컴포넌트를 쓴다.
- **시트 설명문을 화면에 넣지 않았다.** 피그마엔 라벨만 있고, 3문항을 한 화면에 두면 너무 길어진다. 데이터에는 남겨 필요하면 되살릴 수 있다.
- **타이포는 근거 있는 두 곳만 고쳤다.** 그 밖의 크기 상향은 근거가 없어 되돌렸다. 읽기 어려운 문제는 크기가 아니라 등급으로 푼다.

### 후속 제안

- **`--ds-gray-500`(#9c9ea4) 토큰 값 조정** — 흰 배경 2.68:1 로 텍스트 기준 미달. 이 티켓에서는 `globals.css` 주석으로만 남겼다. `gray-600` 도 `surface` 위에서 4.05:1 이라 S02 축 카드가 해당된다. 유나 판단이 필요하다.
- **`04_CF8_유형` 영문명 재확인** — `type_name_en` 이 그 탭에만 있는데 한글명 셋이 `2_03A_CF8프로필` 과 다르다. W2 다국어 전에 정리.
- **`CLV` 의 `ui_rhythm_title`** — `"(or 자유로운 이동)"` 검토 흔적. 괄호를 빼고 넣었으니 확정 문구를 받아야 한다.
- **`FE-CHORE-001` 로 넘긴 작업** — 간격 표기 Tailwind 스케일 전환과 `text-gray-500` 교체(13개 파일). 변환 스크립트 재실행으로 재생성되지만, 4px 배수가 아닌 값(`gap-[18px]`·`pt-[26px]`·`h-[62px]`)은 피그마를 보고 개별 판단해야 한다.
- **건너뛰기 버튼이 동작하지 않는다** — 피그마 S01 우상단에 있어 넣었으나, 누르면 가는 `/feed` 가 `cf8_code` 없이는 에러를 낸다. "취향 미설정 피드"를 만들지 버튼을 뺄지 정해야 한다.
- `pb-safe-cta` 를 다른 하단 CTA 화면에는 아직 붙이지 않았다.

---

## Derived Artifact Naming Rule

```text
티켓 ID:     FE-FEAT-007
파일명:      FE-FEAT-007_s01_s02_sheet_spec.md
브랜치명:    feat/s01-s02-sheet-spec
```
