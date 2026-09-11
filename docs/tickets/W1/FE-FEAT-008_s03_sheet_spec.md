# FE-FEAT-008: S03 조건 입력 — 시트·화면설계서 반영

```
필드명   travelWith[] · walkingDifficulty[] · transport · foodRestriction[] · currentSituation[]
      →  primaryCompanion · childWith · petWith · mobilityCare[]
         transportMode · foodRestriction[] · currentContext[]
선택지   피그마 칩 → 문항 7개 (혼합 1 · 복수 3 · 단일 3)
검증     5개 기본 영역 필수 · 펼쳐진 상세도 필수 · 미선택 시 건너뛰기만 가능
```

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | FE |
| Type | FEAT |
| Severity | Critical |
| Layer | Page / Components / Data / Types |
| Status | In Progress |
| Depends | FE-FEAT-007 (PR #14 — `ChoiceChipGroup`·`trip_setup_mode`) |
| Related | FE-FEAT-006 (PR #13 — 추천 엔진이 `trip_setup` 을 소비) |

---

## Problem

화면이 저장하는 값이 엔진이 기대하는 형태와 다르다. 필드명·값·선택 방식이 전부 어긋나 있다.

`companion_type` 은 최종점수의 25%(동행 적합도)를 만든다. 형태가 틀리면 그 25%가 계산되지 않는다.

에린의 `tripSetupMode.ts` 가 옛 필드명(`travelWith`·`walkingDifficulty`·`foodRestriction`)으로 짜여 있어, 이 티켓이 확정돼야 엔진을 맞출 수 있다.

---

## Context

| 용도 | 자료 |
|---|---|
| 필드명·값 | 구글 시트 S03 문항 탭 — `CMP01` 로 검색 |
| 선택 방식·배타 규칙·검증 | [화면설계서](https://docs.google.com/presentation/d/1MCnA2tATKYjmn2D1C08pviy3FBNOr2Ds-JEqqERtY0A/edit) 4·5쪽 — 9/10 갱신본 |
| 하드필터 규칙 | [`04_추천로직`](https://docs.google.com/spreadsheets/d/1-6usA2CWMCKvUWf53SJRWwzkuvRBmwpE_H958bWAGWE/edit?gid=1087571184) — `R013` 음식 · `R036` 아이 동반 |

⚠️ 시트가 계속 바뀐다. 착수 시점에 다시 읽을 것.

**선택 방식은 유나 9/10 확정안을 따른다.** 시트는 7문항 전부 `SINGLE`, 화면설계서 slide5 표는 4문항 "여러 개"로 서로 반대였고, 확정안은 그 중간이다 — `함께하는 분` 만 혼합이고 나머지는 표를 따른다.

**필수 규칙** (화면설계서 5쪽, 9/10 갱신)

```
5개 기본 영역은 필수. NONE(불편한 점 없어요·피하는 음식 없어요)도 완료값
아이·반려동물 상세는 해당 동반을 골랐을 때만 필수
아무것도 안 고른 상태에서만 건너뛰기 가능 — CF8은 유지한 채 S10 [취향 설정됨] 으로
```

⚠️ 로컬 `Sairo_화면설계서_08Sep26.pptx` 는 낡은 스냅샷이다. 파일명이 같아 헷갈리므로 위 링크를 본다.

시트 `CMP01` 행은 아직 `SINGLE` · `stored_field = companion_type` 이다. 확정안대로 문항 2개·필드 3개로 갱신 요청해 둔 상태다.

**문항 7개**

```
CMP01   primaryCompanion  단일   solo · friend_couple · parents
        childWith         토글   아이 동반
        petWith           토글   반려동물 동반
 └ CHILD01 childAgeGroup   단일   childWith = true 일 때
 └ PET01   petCarry        단일   petWith = true 일 때
MOB01   mobilityCare      복수   none · long_walk · stairs_slope · stroller · wheelchair
TRN01   transportMode     단일   walk · transit · car
FOOD01  foodRestriction   복수   none · spicy · vegan · raw_meat · raw_seafood · pork
CTX01   currentContext    복수   time_flexible · before_meal · indoor_first ·
                                outdoor_preferred · available_now · avoid_crowd · none
```

주 동행 3개는 서로 배타지만 `아이 동반`·`반려동물 동반` 은 함께 고를 수 있다. `혼자 + 아이 동반` 이 가능하다.

**저장값은 시트 코드가 아니라 엔진 값을 쓴다.** 시트 `option_code` 를 그대로 저장해도
값이 달라 어차피 번역이 필요했다. 엔진에 맞추면 번역이 주 동행 하나만 남는다.

| 문항 | 시트 `option_code` | 저장값 = 엔진 값 |
|---|---|---|
| `MOB01` | `STAIRS` 등 | `stairs_slope` 등 — 엔진 `WalkingDifficulty` 와 동일 |
| `FOOD01` | `NO_RAW_SEAFOOD` 등 | `raw_seafood` 등 — 엔진 `FoodRestriction` + `pork` |
| `CMP01` | `FRIEND_COUPLE` 등 | `friend_couple` 등 |
| 나머지 4문항 | 대문자 | 같은 뜻의 소문자. 엔진에 대응 타입이 아직 없다 |

옮기지 못한 두 곳이 `tripSetupMode.ts` 에 남는다.

```
friend_couple   엔진 Companion 은 couple · friends 로 나뉘어 있다 (1:2)
pork            대응 태깅 컬럼이 없어 엔진 FoodRestriction 에 자리가 없다 → 떨어진다
```

값이 어긋나지 않는 두 항목은 허용 배열을 엔진 타입으로 선언해 뒀다. 에린이 엔진 값을
바꾸면 그 자리에서 컴파일 에러가 난다.

---

## Scope

### 포함

- `src/types/trip.ts` — 타입 전면 교체. 필드명·값 모두 엔진 표기
- `src/data/tripSetup.ts` — 시트 사본으로 재생성
- `src/app/trip-setup/page.tsx` — 재작성. 조건부 문항 · 요약 바 · 필수 검증
- `ChoiceChipGroup` — 복수 선택(`CheckChipGroup`) · 배타 규칙 · 단일 문항 해제
- `src/lib/tripSetupMode.ts` — `TripSetupLike` 를 새 저장 계약에 맞춤

### 제외

- 복수 선택 시 현재 상황 점수 합산 규칙 → 유나·에린 확정 후

### 에린 영역을 건드린 곳

PR #15 리뷰에서 에린이 `lib/` 3개는 본인이 맞추겠다고 했다. 그중 `tripSetupMode.ts`
하나만 이 브랜치에서 함께 고쳤다. 저장 계약과 그것을 읽는 쪽은 짝이라, 나눠서
머지하면 그 사이 `resolveActiveFilters` 가 없는 필드를 읽어 **타입 에러 없이**
조건이 빈 배열이 된다 — S03 조건이 조용히 무시되고 QUICK 으로 돈다.

`hardFilter.ts` · `situationalScore.ts` 는 건드리지 않았다.

---

## Strategy

### Step 1: 시트 재확인

`CMP01`~`ACT01` 문항 탭을 다시 읽는다. 같은 문항이 세 벌 있어 어느 탭인지 확인이 필요하다 (Verification 참고).

### Step 2: 타입 교체

필드명·값 모두 엔진 표기를 쓴다. 이 객체는 localStorage에 그대로 직렬화되어 엔진이 읽는 계약이다. 시트 `option_code` 를 그대로 저장해도 값이 달라 번역은 어차피 필요하므로, 번역이 적게 남는 쪽으로 맞춘다.

### Step 3: 데이터 생성

`tripSetup.ts` 를 스크립트로 뽑는다. 문항 7개 × 옵션 5~7개라 손으로 옮기면 오타가 난다.

### Step 4: 화면 재작성

```
조건부 노출    showWhen 으로 CHILD·PET 하위 문항. 트리거가 배열이라 includes 로 판정
요약 바        선택값 전체 + 우측 "n개 선택해제" (전체 초기화)
검증          Step 6 참고 — 미선택 영역이 있으면 보내지 않는다
```

### Step 5: 배타 규칙

두 종류가 필요하다 (화면설계서 §B).

```
exclusive       none                     같은 문항의 나머지를 전부 해제
conflictsWith   실내 우선 ↔ 야외 선호       지정한 값만 해제
```

값 묶음 테이블 대신 옵션 자체에 표시한다. 묶음은 "한 묶음 안의 값끼리 서로 배타"라는 뜻이라 일부와만 충돌하는 값을 표현할 수 없다.

`함께하는 분` 은 배타 규칙이 아니라 컨트롤을 나눠 푼다 — 주 동행은 라디오, 아이·반려동물은 체크박스다. 화면설계서 §B의 `혼자 ↔ 아이 동반` 은 확정안에서 폐기됐다.

### Step 6: 필수 검증

기본 5개 영역과 펼쳐진 상세 문항이 다 채워져야 S10으로 보낸다. 비었으면 첫 미선택 문항으로 스크롤하고 테두리를 올린다. `none` 은 완료값이라 통과한다.

주 동행 없이 아이·반려동물만 켤 수 없고, 상세를 취소하면 동반 선택도 함께 꺼진다.

### Step 7: 단일 문항 해제

Radix `RadioGroup` 은 선택된 항목을 다시 눌러도 `onValueChange` 를 부르지 않는다. 화면설계서 §A가 "1개 선택 항목도 해제할 수 있습니다"라 별도 처리가 필요하다.

---

## Acceptance Criteria

- [x] 문항·선택지가 시트와 일치하고, 저장 필드명·값이 엔진 표기와 일치
- [x] 주 동행 3개는 하나만 · `아이 동반`·`반려동물 동반` 은 추가로 함께 선택
- [x] `혼자 + 아이 동반` 이 가능하다
- [x] 복수 3문항(보행 부담·음식 제약·현재 상황) · 단일 3문항
- [x] 단일 문항에만 "단일 선택" 표시 (혼합 문항은 안내문으로 대신)
- [x] `childWith` 가 켜졌을 때만 아이 연령, `petWith` 일 때만 반려동물 이동 방식
- [x] 토글을 끄면 딸린 조건부 값이 비워진다
- [x] `불편한 점 없어요`·`피하는 음식 없어요` 가 나머지를 해제하고, `실내 우선` 은 `야외 선호` 만 해제
- [x] 미선택 영역이 있으면 S10으로 보내지 않고 첫 미선택 문항으로 이동한다
- [x] `NONE`(불편한 점 없어요·피하는 음식 없어요)은 완료값으로 인정된다
- [x] 주 동행 없이 아이·반려동물만 선택할 수 없다
- [x] 상세를 취소하면 해당 동반 선택도 취소된다
- [x] 아무것도 안 고른 상태에서만 건너뛰기가 보인다
- [x] 단일 문항에서 선택된 칩을 다시 누르면 해제된다
- [x] `tsc --noEmit` · `npm run build` 통과

---

## Verification

1. `/trip-setup` — 문항 5개, 하단에 `각 영역에서 조건을 선택해주세요` 안내
1-1. 아무것도 안 고른 상태에서만 `건너뛰기` 가 보인다. 하나라도 고르면 사라진다
2. `함께하는 분` → `친구·연인` + `아이 동반` 동시 선택되고 아이 연령 문항 등장
3. `혼자` 를 누르면 `친구·연인` 만 풀리고 `아이 동반` 은 남는다
4. `아이 동반` 을 끄면 아이 연령이 사라지고, Local Storage 의 `trip_setup` 에서 `childAgeGroup` 이 `null` 인지 확인
5. `음식 제약` 에서 `채식·비건` + `매운 음식` 동시 선택 → `특별히 없어요` 누르면 둘 다 해제
6. `현재 상황` 에서 `실내 우선` + `혼잡 피하기` 동시 선택 → `야외 선호` 누르면 `실내 우선` 만 해제
7. `이동 수단` 에서 선택된 칩을 다시 누르면 해제
8. 아무것도 안 고르고 `추천 받기` → 이동하지 않고 `함께하는 분` 으로 스크롤·강조
9. 아무것도 안 고르고 `건너뛰기` → `/feed` 로 이동 (CF8 유지)
10. 키보드 — 단일 문항은 화살표로 이동·`Space` 로 해제, 복수 문항은 Tab으로 개별 이동
11. `npx tsc --noEmit` · `npm run build`

---

## Implementation Notes

- 변경 파일: `types/trip.ts` · `data/tripSetup.ts` · `trip-setup/page.tsx` · `ChoiceChipGroup.tsx` · `lib/tripSetupMode.ts`
- 선행: `FE-FEAT-007` ([PR #14](https://github.com/sairo-busan/cultural-fit-busan/pull/14))

### 주요 결정

- **선택 방식은 유나 9/10 확정안.** 시트(전부 `SINGLE`)와 화면설계서 slide5 표(4문항 복수)가 반대라 한 번 뒤집었고, 확정안이 그 중간이다. 시트 `CMP01` 갱신은 요청해 둔 상태.
- **배타 규칙을 값 묶음 테이블 대신 옵션 플래그로.** `EXCLUSIVE_GROUPS` 는 "한 묶음 안의 값끼리 서로 배타"라는 뜻인데, 전 항목을 한 묶음에 넣어 두어 사실상 단일 선택이 되어 있었다.
- **`함께하는 분` 은 배타 규칙이 아니라 컨트롤을 나눠 풀었다.** 주 동행은 라디오, 아이·반려동물은 체크박스다. 저장도 `primaryCompanion`·`childWith`·`petWith` 세 필드로 나눈다 — 유나 9/10 확정.
- **칩 색을 화면설계서 §A와 반대로 했다.** §A는 "선택 후 검은 배경·흰 글자"인데, 그러면 하단 `추천 받기` 와 무게가 같아져 위계가 사라진다. 채워진 요소는 CTA 하나만 남겼다.
- **조건부 문항 박스를 채움이 아닌 테두리로.** `--ds-gray-200`(#ededef)과 `--ds-surface`(#f2f2f1)가 거의 같은 색이라, 미선택 칩이 옅은 채움이 되면서 박스 안에서 사라졌다.
- **음식 제약 안내문에 화면설계서 9번 문구를 썼다.** 시트 `helper_text` 는 여섯 항목을 모두 "제외"로 묶는데, §E는 `채식·비건` 이 제외가 아니라 맞는 메뉴를 찾는 조건이라고 명시한다.
- **요약 바 빈 상태 문구를 `조건 미선택` 으로.** §2의 `조건을 알려주세요` 는 바로 아래 화면 제목과 같은 말이다.
- **필수 검증을 되살렸다.** 화면설계서 9/10 갱신본이 "5개 기본 영역 필수 · 상세도 동반 선택 시 필수"로 바꿨다. 이전 스냅샷의 "0개여도 이동 가능"을 보고 뺐던 것을 되돌렸다.
- **건너뛰기를 넣었다.** 갱신본에서 "취향 미설정으로 보내면 안 된다"로 바뀌어 갈 화면(`S10 [취향 설정됨]`)이 생겼다. 아무것도 안 고른 상태에서만 보인다.
- **저장 스키마 마이그레이션은 넣지 않았다.** 아직 테스트한 사용자가 없다. 방어 코드를 영구히 두는 대신 아래 안내로 갈음한다.

  ```
  옛 trip_setup 이 남은 브라우저는 /trip-setup 이 흰 화면이 된다.
  mobilityCare 자리가 undefined 라 isUntouched 의 .length 에서 죽는다.
  → 개발자도구 Application → Local Storage 에서 trip_setup 삭제
  ```

### 후속 제안

- **동행 점수 25% 계산** — `혼자 + 아이 동반` 처럼 주 동행과 토글이 겹치면 엑셀 동행 5컬럼 중 무엇을 쓸지가 없다. `currentContext` 도 `constraint_type = SCORE_OR_CONTEXT` 라 복수일 때 합산 규칙이 없다. 유나·에린 확정 필요.
- **S01 건너뛰기** — S01 우상단 버튼도 같은 규칙(CF8 유지 · 취향 설정됨으로)으로 맞춰야 한다. 이 티켓 범위 밖이다.
- **`hardFilter.ts`·`situationalScore.ts`** — 이번에 `tripSetupMode.ts` 만 맞췄다. 나머지 둘은 에린 영역이라 그대로 뒀고, 지금 계약으로도 동작한다.
- **`currentContext` 복수 선택** — 엔진이 아직 이 필드를 읽지 않는다. 합산 규칙이 정해지면 `resolveActiveFilters` 에 자리를 만들어야 한다.
- **`--ds-gray-500` 대비 미달** — `FE-FEAT-007` 에서 넘어온 건. 유나 판단 대기.

---

## Derived Artifact Naming Rule

```text
티켓 ID:     FE-FEAT-008
파일명:      FE-FEAT-008_s03_sheet_spec.md
브랜치명:    feat/s03-sheet-spec
```
