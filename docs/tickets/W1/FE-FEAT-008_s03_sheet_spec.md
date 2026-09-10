# FE-FEAT-008: S03 조건 입력 — 시트·화면설계서 반영

```
필드명   travelWith[] · walkingDifficulty[] · transport · foodRestriction[] · currentSituation[]
      →  companion_type[] · mobility_care[] · transport_mode · food_restriction[] · current_context[]
선택지   피그마 칩 → 문항 7개 (복수 4 · 단일 3)
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
| 선택 방식·배타 규칙·검증 | 화면설계서 `Sairo_화면설계서_08Sep26.pptx` slide5 |
| 하드필터 규칙 | [`04_추천로직`](https://docs.google.com/spreadsheets/d/1-6usA2CWMCKvUWf53SJRWwzkuvRBmwpE_H958bWAGWE/edit?gid=1087571184) — `R013` 음식 · `R036` 아이 동반 |

⚠️ 시트가 계속 바뀐다. 착수 시점에 다시 읽을 것.

**정본이 둘로 갈린다.** 시트는 7문항 전부 `SINGLE` 이고 `selection_rule` 에도 "새 선택 시 기존값 교체"라고 적혀 있는데, 화면설계서 slide5 `항목별 선택 방식` 표는 4문항을 "여러 개"로 정의한다. 필수 검증도 시트는 `REQUIRED`, 화면설계서는 "0개여도 막지 않는다"로 반대다.

**필드명·값은 시트, 선택 방식·검증은 화면설계서를 따른다.** 시트 수정은 유나에게 요청해 둔 상태다.

**문항 7개**

```
CMP01   companion_type    복수   SOLO · FRIEND_COUPLE · PARENTS · CHILD · PET
 └ CHILD01 child_age_group  단일   CHILD 선택 시
 └ PET01   pet_carry        단일   PET 선택 시
MOB01   mobility_care     복수   NONE · LONG_WALK · STAIRS · STROLLER · WHEELCHAIR
TRN01   transport_mode    단일   WALK · TRANSIT · CAR
FOOD01  food_restriction  복수   NONE · NO_SPICY · VEGAN · NO_RAW_MEAT · NO_RAW_SEAFOOD · NO_PORK
CTX01   current_context   복수   TIME_FLEXIBLE · BEFORE_MEAL · INDOOR_FIRST ·
                                OUTDOOR_PREFERRED · AVAILABLE_NOW · AVOID_CROWD · NONE
```

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
요약 바        선택값 전체 + 우측 "n개 선택"
검증 없음      0개여도 그대로 S10으로 보낸다
```

### Step 5: 배타 규칙

두 종류가 필요하다 (화면설계서 §B).

```
exclusive       무관 · 특별히 없어요        나머지를 전부 해제
conflictsWith   혼자 ↔ 사람 동반 3종         지정한 값만 해제
                실내 우선 ↔ 야외 선호
```

값 묶음 테이블 대신 옵션 자체에 표시한다. 묶음은 "한 묶음 안의 값끼리 서로 배타"라는 뜻이라, `혼자` 처럼 일부와만 충돌하는 값을 표현할 수 없다.

### Step 6: 단일 문항 해제

Radix `RadioGroup` 은 선택된 항목을 다시 눌러도 `onValueChange` 를 부르지 않는다. 화면설계서 §A가 "1개 선택 항목도 해제할 수 있습니다"라 별도 처리가 필요하다.

---

## Acceptance Criteria

- [ ] 필드명·값이 시트 `stored_field`·`option_code` 와 일치
- [ ] 복수 4문항(함께하는 분·보행 부담·음식 제약·현재 상황) · 단일 3문항
- [ ] 단일 문항에만 "단일 선택" 표시
- [ ] `CHILD` 선택 시에만 아이 연령, `PET` 선택 시에만 반려동물 이동 방식
- [ ] 트리거가 풀리면 딸린 조건부 값이 비워진다
- [ ] `무관`·`특별히 없어요` 가 나머지를 해제하고, `혼자`·`실내 우선` 은 지정한 값만 해제
- [ ] 선택 0개여도 S10으로 이동한다
- [ ] 단일 문항에서 선택된 칩을 다시 누르면 해제된다
- [ ] `tsc --noEmit` · `npm run build` 통과

---

## Verification

1. `/trip-setup` — 문항 5개, 건너뛰기 없음, 하단에 선택사항 안내
2. `함께하는 분` → `친구·연인` + `아이 동반` 동시 선택되고 아이 연령 문항 등장
3. `혼자` 를 누르면 앞의 둘이 풀리고 아이 연령이 사라짐. `혼자` + `반려동물 동반` 은 함께 남음
4. 개발자도구 → Application → Local Storage 의 `trip_setup` 에서 `child_age_group` 이 `null` 인지 확인
5. `음식 제약` 에서 `채식·비건` + `매운 음식` 동시 선택 → `특별히 없어요` 누르면 둘 다 해제
6. `현재 상황` 에서 `실내 우선` + `혼잡 피하기` 동시 선택 → `야외 선호` 누르면 `실내 우선` 만 해제
7. `이동 수단` 에서 선택된 칩을 다시 누르면 해제
8. 아무것도 안 고르고 `추천 받기` → `/feed` 로 이동
9. 키보드 — 단일 문항은 화살표로 이동·`Space` 로 해제, 복수 문항은 Tab으로 개별 이동
10. `npx tsc --noEmit` · `npm run build`

---

## Implementation Notes

{구현 완료 후 기록.}

---

## Derived Artifact Naming Rule

```text
티켓 ID:     FE-FEAT-008
파일명:      FE-FEAT-008_s03_sheet_spec.md
브랜치명:    feat/s03-sheet-spec
```
