# FE-FEAT-008: S03 조건 입력 — 시트·화면설계서 반영

```
필드명   travelWith[] · walkingDifficulty[] · transport · foodRestriction[] · currentSituation[]
      →  primary_companion · child_with · pet_with · mobility_care[]
         transport_mode · food_restriction[] · current_context[]
선택지   피그마 칩 → 문항 7개 (혼합 1 · 복수 3 · 단일 3)
검증     필수 검증 제거 · 건너뛰기 없음
```

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | FE |
| Type | FEAT |
| Severity | Critical |
| Layer | Page / Components / Data / Types |
| Status | Done |
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
| 선택 방식·배타 규칙·검증 | 화면설계서 `Sairo_화면설계서_08Sep26.pptx` slide5 |
| 하드필터 규칙 | [`04_추천로직`](https://docs.google.com/spreadsheets/d/1-6usA2CWMCKvUWf53SJRWwzkuvRBmwpE_H958bWAGWE/edit?gid=1087571184) — `R013` 음식 · `R036` 아이 동반 |

⚠️ 시트가 계속 바뀐다. 착수 시점에 다시 읽을 것.

**선택 방식은 유나 9/10 확정안을 따른다.** 시트는 7문항 전부 `SINGLE`, 화면설계서 slide5 표는 4문항 "여러 개"로 서로 반대였고, 확정안은 그 중간이다 — `함께하는 분` 만 혼합이고 나머지는 표를 따른다.

**필수 검증은 확정안에 없다.** 시트는 `REQUIRED`, 화면설계서는 "0개여도 막지 않는다". 화면설계서를 따라 검증을 뺀 상태이며 유나 확인 대기.

시트 `CMP01` 행은 아직 `SINGLE` · `stored_field = companion_type` 이다. 확정안대로 문항 2개·필드 3개로 갱신 요청해 둔 상태다.

**문항 7개**

```
CMP01   primary_companion  단일   SOLO · FRIEND_COUPLE · PARENTS
        child_with         토글   아이 동반
        pet_with           토글   반려동물 동반
 └ CHILD01 child_age_group  단일   child_with = true 일 때
 └ PET01   pet_carry        단일   pet_with = true 일 때
MOB01   mobility_care     복수   NONE · LONG_WALK · STAIRS · STROLLER · WHEELCHAIR
TRN01   transport_mode    단일   WALK · TRANSIT · CAR
FOOD01  food_restriction  복수   NONE · NO_SPICY · VEGAN · NO_RAW_MEAT · NO_RAW_SEAFOOD · NO_PORK
CTX01   current_context   복수   TIME_FLEXIBLE · BEFORE_MEAL · INDOOR_FIRST ·
                                OUTDOOR_PREFERRED · AVAILABLE_NOW · AVOID_CROWD · NONE
```

주 동행 3개는 서로 배타지만 `아이 동반`·`반려동물 동반` 은 함께 고를 수 있다. `혼자 + 아이 동반` 이 가능하다.

---

## Scope

### 포함

- `src/types/trip.ts` — 타입 전면 교체. 필드명은 시트 `stored_field` 그대로
- `src/data/tripSetup.ts` — 시트 사본으로 재생성
- `src/app/trip-setup/page.tsx` — 재작성. 조건부 문항 · 요약 바
- `ChoiceChipGroup` — 복수 선택(`CheckChipGroup`) · 배타 규칙 · 단일 문항 해제

### 제외

- 에린 엔진의 `TripSetupLike` 필드명 정렬 → 에린 영역
- 건너뛰기 버튼 → "취향 미설정 피드"가 없어 별건
- 복수 선택 시 동행·현재 상황 점수 합산 규칙 → 유나·에린 확정 후

---

## Strategy

### Step 1: 시트 재확인

`CMP01`~`ACT01` 문항 탭을 다시 읽는다. 같은 문항이 세 벌 있어 어느 탭인지 확인이 필요하다 (Verification 참고).

### Step 2: 타입 교체

필드명에 snake_case를 쓴다. 이 객체는 localStorage에 그대로 직렬화되어 엔진이 읽는 계약이라, 시트 `stored_field` 와 이름이 다르면 양쪽에서 번역이 필요해진다.

### Step 3: 데이터 생성

`tripSetup.ts` 를 스크립트로 뽑는다. 문항 7개 × 옵션 5~7개라 손으로 옮기면 오타가 난다.

### Step 4: 화면 재작성

```
조건부 노출    showWhen 으로 CHILD·PET 하위 문항. 트리거가 배열이라 includes 로 판정
요약 바        선택값 전체 + 우측 "n개 선택해제" (전체 초기화)
검증 없음      0개여도 그대로 S10으로 보낸다
```

### Step 5: 배타 규칙

두 종류가 필요하다 (화면설계서 §B).

```
exclusive       무관 · 특별히 없어요        같은 문항의 나머지를 전부 해제
conflictsWith   실내 우선 ↔ 야외 선호       지정한 값만 해제
```

값 묶음 테이블 대신 옵션 자체에 표시한다. 묶음은 "한 묶음 안의 값끼리 서로 배타"라는 뜻이라 일부와만 충돌하는 값을 표현할 수 없다.

`함께하는 분` 은 배타 규칙이 아니라 컨트롤을 나눠 푼다 — 주 동행은 라디오, 아이·반려동물은 체크박스다. 화면설계서 §B의 `혼자 ↔ 아이 동반` 은 확정안에서 폐기됐다.

### Step 6: 단일 문항 해제

Radix `RadioGroup` 은 선택된 항목을 다시 눌러도 `onValueChange` 를 부르지 않는다. 화면설계서 §A가 "1개 선택 항목도 해제할 수 있습니다"라 별도 처리가 필요하다.

---

## Acceptance Criteria

- [x] 필드명·값이 시트 `stored_field`·`option_code` 와 일치
- [x] 주 동행 3개는 하나만 · `아이 동반`·`반려동물 동반` 은 추가로 함께 선택
- [x] `혼자 + 아이 동반` 이 가능하다
- [x] 복수 3문항(보행 부담·음식 제약·현재 상황) · 단일 3문항
- [x] 단일 문항에만 "단일 선택" 표시 (혼합 문항은 안내문으로 대신)
- [x] `child_with` 가 켜졌을 때만 아이 연령, `pet_with` 일 때만 반려동물 이동 방식
- [x] 토글을 끄면 딸린 조건부 값이 비워진다
- [x] `무관`·`특별히 없어요` 가 나머지를 해제하고, `실내 우선` 은 `야외 선호` 만 해제
- [x] 선택 0개여도 S10으로 이동한다
- [x] 단일 문항에서 선택된 칩을 다시 누르면 해제된다
- [x] `tsc --noEmit` · `npm run build` 통과

---

## Verification

1. `/trip-setup` — 문항 5개, 건너뛰기 없음, 하단에 선택사항 안내
2. `함께하는 분` → `친구·연인` + `아이 동반` 동시 선택되고 아이 연령 문항 등장
3. `혼자` 를 누르면 `친구·연인` 만 풀리고 `아이 동반` 은 남는다
4. `아이 동반` 을 끄면 아이 연령이 사라지고, Local Storage 의 `trip_setup` 에서 `child_age_group` 이 `null` 인지 확인
5. `음식 제약` 에서 `채식·비건` + `매운 음식` 동시 선택 → `특별히 없어요` 누르면 둘 다 해제
6. `현재 상황` 에서 `실내 우선` + `혼잡 피하기` 동시 선택 → `야외 선호` 누르면 `실내 우선` 만 해제
7. `이동 수단` 에서 선택된 칩을 다시 누르면 해제
8. 아무것도 안 고르고 `추천 받기` → `/feed` 로 이동
9. 키보드 — 단일 문항은 화살표로 이동·`Space` 로 해제, 복수 문항은 Tab으로 개별 이동
10. `npx tsc --noEmit` · `npm run build`

---

## Implementation Notes

- 변경 파일: `types/trip.ts` · `data/tripSetup.ts` · `trip-setup/page.tsx` · `ChoiceChipGroup.tsx`
- 선행: `FE-FEAT-007` ([PR #14](https://github.com/sairo-busan/cultural-fit-busan/pull/14))

### 주요 결정

- **선택 방식은 유나 9/10 확정안.** 시트(전부 `SINGLE`)와 화면설계서 slide5 표(4문항 복수)가 반대라 한 번 뒤집었고, 확정안이 그 중간이다. 시트 `CMP01` 갱신은 요청해 둔 상태.
- **배타 규칙을 값 묶음 테이블 대신 옵션 플래그로.** `EXCLUSIVE_GROUPS` 는 "한 묶음 안의 값끼리 서로 배타"라는 뜻인데, 전 항목을 한 묶음에 넣어 두어 사실상 단일 선택이 되어 있었다.
- **`함께하는 분` 은 배타 규칙이 아니라 컨트롤을 나눠 풀었다.** 주 동행은 라디오, 아이·반려동물은 체크박스다. 저장도 `primary_companion`·`child_with`·`pet_with` 세 필드로 나눈다 — 유나 9/10 확정.
- **칩 색을 화면설계서 §A와 반대로 했다.** §A는 "선택 후 검은 배경·흰 글자"인데, 그러면 하단 `추천 받기` 와 무게가 같아져 위계가 사라진다. 채워진 요소는 CTA 하나만 남겼다.
- **조건부 문항 박스를 채움이 아닌 테두리로.** `--ds-gray-200`(#ededef)과 `--ds-surface`(#f2f2f1)가 거의 같은 색이라, 미선택 칩이 옅은 채움이 되면서 박스 안에서 사라졌다.
- **음식 제약 안내문에 화면설계서 9번 문구를 썼다.** 시트 `helper_text` 는 여섯 항목을 모두 "제외"로 묶는데, §E는 `채식·비건` 이 제외가 아니라 맞는 메뉴를 찾는 조건이라고 명시한다.
- **요약 바 빈 상태 문구를 `조건 미선택` 으로.** §2의 `조건을 알려주세요` 는 바로 아래 화면 제목과 같은 말이다.
- **저장 스키마 마이그레이션은 넣지 않았다.** 아직 배포 전이라 기기에 남은 옛 `trip_setup` 은 개발 중 잔재뿐이다. 실사용자가 생긴 뒤 형태를 또 바꾸게 되면 그때 넣는다.

### 후속 제안

- **동행 점수 25% 계산** — `혼자 + 아이 동반` 처럼 주 동행과 토글이 겹치면 엑셀 동행 5컬럼 중 무엇을 쓸지가 없다. `current_context` 도 `constraint_type = SCORE_OR_CONTEXT` 라 복수일 때 합산 규칙이 없다. 유나·에린 확정 필요.
- **필수 검증** — 확정안에 없다. 시트는 `REQUIRED`, 화면설계서는 "0개여도 막지 않는다". 화면설계서를 따른 상태.
- **건너뛰기 버튼** — 화면설계서 §D에 `조건 미적용 + 취향 미설정 피드` 로 정의돼 있으나 그 화면이 없다. S01도 마찬가지다.
- **에린 엔진의 `TripSetupLike` 필드명 정렬** — 아직 `travelWith`·`walkingDifficulty`·`foodRestriction` 이다. `companion_type` 이 세 필드로 갈라지고 `current_context` 가 배열이 된 것도 함께 반영돼야 한다.
- **`--ds-gray-500` 대비 미달** — `FE-FEAT-007` 에서 넘어온 건. 유나 판단 대기.

---

## Derived Artifact Naming Rule

```text
티켓 ID:     FE-FEAT-008
파일명:      FE-FEAT-008_s03_sheet_spec.md
브랜치명:    feat/s03-sheet-spec
```
