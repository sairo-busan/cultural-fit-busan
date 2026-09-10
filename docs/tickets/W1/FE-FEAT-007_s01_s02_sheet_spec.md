# FE-FEAT-007: S01 2지선다 전환 + S02 시트 기반 동적 매핑

유나 9/9 전달로 S01 선택지 구조와 S02 문구 출처가 확정됐다. 두 화면 모두 **하드코딩을 걷어내고 구글 시트를 단일 출처로** 만드는 작업이다.

```
S01  4/4/3지선다 → 2지선다 3문항        피그마 임시안 폐기, 시트가 기준
     문항당 1화면 → 3문항 한 화면        피그마·화면설계서 기준
S02  코드에 박힌 유형명·설명 → 시트 조회   8유형 × ui_* 11컬럼
```

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | FE |
| Type | FEAT |
| Severity | Critical |
| Layer | Page / Data / Types / Lib |
| Status | In Progress |
| Depends | FE-FEAT-006 (PR #13 — `cfp.ts` 유형명·`trip_setup_mode`) |
| Related | FE-FEAT-008 (S03 전면 개편 — 대괄호 건 확인 후 착수) |

---

## Problem

**S01** — 피그마의 4/4/3지선다로 구현돼 있는데, 유나가 "디자인 과정에서 임시로 만들어 본 안이며 최종 확정안이 아니다"라고 확인해줬다. 시트는 처음부터 2지선다였다.

지금은 선택지의 세기가 점수에 반영되지 않는다. `toAxis()` 가 부호만 보기 때문에 `-2`·`-1` 이 똑같이 `C` 가 된다. 3번 문항은 더 나쁘다 — 중립(`0`)이 왼쪽 `D` 로 흡수돼 **어느 쪽도 아닌 답이 한쪽으로 단정된다.**

**S02** — 유형명·설명이 `cfp.ts` 에 하드코딩돼 있다. 시트가 바뀔 때마다 코드를 고쳐야 하고, 실제로 이틀 사이 8개 중 3개가 바뀌었다.

```
9/7 시트   ELV 활기찬 로컬 러너 · EFD 핫플 여유 감상자 · EFV 인기 명소 순회자
9/9 시트   ELV 활기찬 동네 탐험가 · EFD 활기찬 명소 감상자 · EFV 인기 명소 탐방가
```

PR #13에서 방금 맞춘 이름이 이미 낡았다. **하드코딩을 유지하는 한 계속 어긋난다.**

---

## Context

```
S01 정본   1_03A-1_CF설문3문항 (gid=1069717930)
           05_CFQ_취향문항    (gid=1808300501)  — question · helper_text · left/right_label
S02 정본   2_03A_CF8프로필     (gid=252207444)  — profile_name · ui_* 11컬럼
계산 정본   4_03A-2_CF점수기준  (gid=11755224)   — CALC_01 왼쪽 -1 / 오른쪽 +1
```

⚠️ 유나가 시트를 계속 고치는 중이다. 착수 시점에 **반드시 다시 읽을 것.**

### S01 3문항

| 문항 | 축 필드 | 왼쪽 | 오른쪽 |
|---|---|---|---|
| CFQ01 | `cf_atmosphere` | `C` 차분하고 여유로운 분위기 | `E` 활기차고 에너지 넘치는 분위기 |
| CFQ02 | `cf_local_famous` | `L` 현지의 매력을 느낄 수 있는 곳 | `F` 꼭 가봐야 할 유명한 곳 |
| CFQ03 | `cf_deep_variety` | `D` 한 곳을 천천히 즐기는 편 | `V` 여러 곳을 돌아보는 편 |

세 코드를 이어붙여 `cf_type_code`(`CLD`~`EFV`)를 만든다.

### S02 컬럼 매핑

```
내 여행 유형      profile_name
유형 소개         ui_result_intro
추천 방향         ui_recommendation_promise

분위기 카드       ui_atmosphere_value / _title / _body
장소 카드         ui_place_value / _title / _body
리듬 카드         ui_rhythm_value / _title / _body
```

`axis_*` 는 유형·계산 확인용, `engine_*` 은 추천 엔진 내부용이다. **사용자 화면에는 `profile_name` 과 `ui_*` 만 쓴다.**

CF8 유형별 화면 8개를 따로 만들지 않는다. 같은 레이아웃에서 조회 결과만 바꾼다.

---

## Scope

### 포함

- `src/data/quiz.ts` — 3문항 2지선다로 교체, 문구는 시트 그대로
- `src/types/cfp.ts` — `AxisValue` 를 `-1 | 1` 로 축소
- `src/lib/cfp.ts` — `toAxis()` 폴백 `-2` → `-1`, `profileFromCode()` 복원 `±2` → `±1`
- `src/data/cf8Profiles.ts` (신규) — 8유형 × 11컬럼을 시트에서 뽑아 상수화
- `src/app/profile/page.tsx` — 하드코딩 문구를 시트 데이터 조회로 교체
- `CF8_TYPES` 의 `nameKo`·`description` 제거 (신규 데이터로 대체)
- `src/app/onboarding/page.tsx` — 3문항 한 화면으로 재작성
- `src/components/common/ChoiceChipGroup.tsx` (신규) — Radix `RadioGroup` 기반
- `src/components/common/AppHeader.tsx` — 상단 여백을 기기 안전영역에 맞춤
- 간격·크기 표기를 Tailwind 기본 스케일로 (14개 파일)

### 제외

- S03 전면 개편 → FE-FEAT-008
- `one_line_ko` 채택 여부 → 유나 확인 후 별건
- 시트 실시간 조회 → 빌드 타임 상수로 충분하다. 8행짜리 정적 데이터에 런타임 fetch는 과하다

---

## Strategy

### Step 1: 시트 재확인

유나가 시트를 계속 고친다. 착수 시점에 **반드시 다시 읽는다.** 9/8 스냅샷으로 답했다가 하루 사이 바뀐 내용을 놓친 적이 있다.

```
05_CFQ_취향문항     question · helper_text · left/right_label · left/right_description
2_03A_CF8프로필     profile_name · ui_* 11컬럼
```

두 탭의 문구가 `1_03A-1_CF설문3문항` 과 일치하는지도 대조한다 — 한때 어긋나 있었다.

### Step 2: S01 문항 데이터 교체

`src/data/quiz.ts` 를 시트 사본으로 바꾼다. 선택지를 4/4/3에서 2/2/2로 줄이고, 시트에만 있던 `helper_text`·`left_description`·`right_description` 을 새로 넣는다.

```
QuizChoiceData   + description
QuizQuestionData + helperText
```

문구 데이터를 교체한 뒤 화면 구조를 바꾼다 — 피그마 `S01`(1007:1661)과 화면설계서 slide1이 **3문항을 한 화면**에 둔다. 2지선다로 줄면 화면 하나에 선택지 두 개만 남아 허전하다.

진행 단계 저장·자동 넘김·퇴장 애니메이션·이어하기 토스트를 전부 걷어낸다. 한 화면이라 불필요하다.

시트 `left_description`·`right_description` 은 데이터에만 남기고 화면에는 넣지 않는다. 피그마엔 라벨만 있고, 3문항을 한 화면에 두면 설명문까지는 너무 길다.

### Step 3: 축 값 범위 축소

값만 지우지 않고 **타입을 좁힌다.** 열어두면 4지선다 잔재가 다시 들어와도 컴파일이 통과한다.

```ts
// src/types/cfp.ts
export type AxisValue = -1 | 1;          // -2 | -1 | 0 | 1 | 2 에서

// src/lib/cfp.ts
const resolved: AxisValue = value ?? -1; // ?? -2 에서
atmosphere: safe[0] === "C" ? -1 : 1,    // ? -2 : 2 에서 (profileFromCode)
```

`profileFromCode()` 를 같이 고치지 않으면 재방문 시 S02 슬라이더가 맨 끝으로 간다.

### Step 4: S02 시트 사본 생성

`src/data/cf8Profiles.ts` 를 만든다. 시트에서 스크립트로 뽑아 상수화한다 — 손으로 옮기면 8유형 × 11컬럼에서 오타가 난다.

```
CF8_PROFILES: Record<Cf8Code, Cf8ProfileCopy>
  profileName · resultIntro · recommendationPromise
  atmosphere / place / rhythm  각각 { value, title, body }
```

런타임 fetch는 하지 않는다. 정적 데이터라 바뀌면 어차피 배포가 필요하다.

### Step 5: S02 화면을 조회 방식으로 교체

`profile.nameKo`·`profile.description` 대신 `CF8_PROFILES[profile.code]` 를 쓴다. 유형별 화면 8개를 만들지 않고 같은 레이아웃에서 값만 바꾼다.

시트에 대응 항목이 없는 것은 지운다.

```
AXIS_STYLE · AXIS_GUIDE          축 코드별 6종, 절반이 시트에 없는 초안
"이렇게 안내하겠습니다" 섹션        유나 매핑에 없음 · 위 카드와 내용 중복
```

### Step 6: 접근성·타이포 보완

DS v1이 다루지 않는 영역만 채운다. 토큰 값은 건드리지 않는다.

```
focus-visible             키보드 위치가 전혀 안 보였다
prefers-reduced-motion    최종 상태로 고정 — animation:none은 opacity:0에 멈춘다
pb-safe-cta 유틸          Capacitor Android 제스처 바
text-gray-500 → gray-600  2.68:1 로 WCAG 텍스트 기준 미달
```

DS v1 **내부에서 어긋난 것**만 고친다 — `ds-display` 두께 100→300, `ds-body-1` 15→16px. 그 밖의 크기 상향은 근거가 없다.

---

## Acceptance Criteria

- [ ] S01 3문항이 각각 선택지 2개다
- [ ] 왼쪽 `-1`, 오른쪽 `+1` 로만 저장된다 (`AxisValue` 타입이 강제)
- [ ] 문구가 시트의 `question`·`helper_text`·`left_label`·`right_label` 과 일치한다
- [ ] S02가 `cf_type_code` 로 `CF8_PROFILES` 를 조회해 표시한다
- [ ] 8유형 전부 문구가 시트와 일치한다
- [ ] `cfp.ts` 에 유형명·설명 문자열이 남아 있지 않다
- [ ] `tsc --noEmit` · `npm run build` 통과

---

## Verification

{구현 완료 후 기록.}

---

## Implementation Notes

{구현 완료 후 기록. 변경된 파일, 주요 결정 사항, 후속 작업 등.}

---

## Derived Artifact Naming Rule

```text
티켓 ID:     FE-FEAT-007
파일명:      FE-FEAT-007_s01_s02_sheet_spec.md
브랜치명:    feat/s01-s02-sheet-spec
```
