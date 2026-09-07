# FE-FEAT-004: S03 조건 입력 — 필드 정의 + 화면

CF8 진단(S01·S02)에서 빠진 상황 조건을 입력받는 화면. **추천 엔진의 두 번째 입력 계약**이라, 화면보다 **필드 스키마 확정이 본체**다.

```
S01/S02 → cf8_code     → 유형 매칭      ✅ FE-FEAT-003 (PR #8)
S03     → trip_setup   → 필터 · 보정    ⬅ 이 티켓
```

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | FE |
| Type | FEAT |
| Severity | Critical |
| Layer | Page / Component / Lib |
| Status | In Progress |
| Screen | S03 |
| Depends | FE-FEAT-003 (`cf8_code` 계약) |
| Related | 에린 추천 엔진(FE-FEAT-005) — 이 티켓이 확정하는 `trip_setup` 이 입력 규격 |
| Deadline | 2026-09-10 (9/4 회의 액션 아이템) |

---

## Problem

- **현재 동작**: S02의 `조건 더 알려주기` 가 안내 토스트만 띄운다. 온보딩이 S00→S01→S02→S10 에서 끊긴다.
- **기대 동작**: S03에서 동반·보행·이동수단·음식제약·현재상황을 입력받아 `trip_setup` 으로 저장하고, 추천 엔진이 그 값으로 필터·보정을 수행한다.
- **영향**: 9/4 회의에서 "Flow03 + S03 필드 우선순위 설정 (소피, ~9/10)"으로 배정됐다. 에린이 이 스키마를 기다리고 있어 **추천 엔진 착수의 선행 조건**이다.

---

## Context

```
화면 정본: 피그마 Page 2_최종 `S03 · 조건 입력` (1007:1857, 390×1563)
체계 정본: 기획 구글 시트 [최] SAIRO 통합본 — travel_mode · child_age_group
저장 키:   피그마 UXF2 온보딩 순서도 — trip_setup · trip_setup_mode

관련 문서:
- docs/회의록/2026-09-04_추천엔진_구조.md — 정본 대조 #4
- docs/decisions/진단체계_CF8_전환_검토.md 2-e절

신규/수정:
- src/types/trip.ts          (신규) 필드 정의 — 에린 공유 대상
- src/data/tripSetup.ts      (신규) 칩 목록 · 화면 문구
- src/components/common/Chip.tsx (신규) 칩 UI
- src/app/trip-setup/page.tsx    (신규) S03
- src/app/profile/page.tsx       조건 더 알려주기 → /trip-setup
- src/lib/storage.ts             trip_setup 키 추가
```

---

## 필드 스키마 (에린 공유용)

저장 키 **`trip_setup`**, 단일 객체. 모든 필드 선택 사항이며 미선택은 `null` 또는 빈 배열이다.

| 필드 | 타입 | 값 | 제약 성격 | 근거 |
|---|---|---|---|---|
| `travelWith` | `string[]` | `solo` · `friends_couple` · `parents` · `kid` · `pet` | **SCORE** | 피그마 "복수로 고르실 수 있어요" |
| `childAgeGroup` | `string \| null` | `age_0_3` · `age_4_7` · `age_8_13` · `age_14_18` | **HARD_AND_SCORE** | `travelWith` 에 `kid` 포함 시에만 |
| `petTravelMode` | `string \| null` | `leash` · `carrier` · `both` | **SCORE** | `travelWith` 에 `pet` 포함 시에만 |
| `walkingDifficulty` | `string[]` | `none` · `long_walk` · `stairs_slope` · `stroller` · `wheelchair` | **HARD_AND_SCORE** | 접근성은 배제 성격 |
| `transport` | `string \| null` | `walk` · `transit` · `car` | **SCORE** | 단일 선택 |
| `foodRestriction` | `string[]` | `none` · `spicy` · `vegan` · `raw_meat` · `raw_seafood` | **🔴 HARD** | 피그마 "고르신 항목은 추천에서 아예 제외합니다" |
| `currentSituation` | `string[]` | `rain` · `time_rich` · `before_meal` · `indoor` · `outdoor` · `right_now` · `avoid_crowd` | **SCORE** | 실시간 변수(시간·날씨)와 연결 |

### Hard Filter 대응

`foodRestriction` 은 정본 추천 로직 `R013`(검증된 음식 제약)과 태깅 컬럼에 직접 매핑된다.

| 선택 | 태깅 컬럼 | 동작 |
|---|---|---|
| `spicy` | `spice_level` | 매운 장소 제외 |
| `vegan` | `has_meat_only` | 육류 전용 제외 |
| `raw_meat` | `has_raw` | 날것 제외 |
| `raw_seafood` | `has_seafood_only` | 생해산물 제외 |
| `none` | — | 다른 선택을 모두 해제 |

### 정본 시트와 다른 점 (⚠️ 확인 필요)

| # | 항목 | 정본 시트 | 피그마 S03 | 이 티켓의 선택 |
|---|---|---|---|---|
| 1 | 동반 | `travel_mode` 4종 · **단일** · "여행 목적"(FREE/MEMORY/COMFORT/KID) | "함께하는 분" 5칩 · **복수** · 동반자. 반려동물 추가 | 피그마(복수 배열) |
| 2 | 아이 연령 | INFANT/PRESCHOOL/ELEMENTARY/TEEN | 0~3 / 4~7 / 8~13 / 14~18 | ✅ 동일 — 값 이름만 정리 |
| 3 | 반려동물 이동 | 없음 | 3종 | 피그마 |
| 4 | 보행 부담 | **없음** | 5종 | 피그마 |
| 5 | 이동 수단 | **없음** | 3종 | 피그마 |
| 6 | 현재 상황 | **없음** | 7종 | 피그마 |

**1번이 가장 큰 차이다.** 정본 `travel_mode` 는 `constraint_type: SCORE_MODE` 로 점수에 반영되는 단일 값인데, 복수 선택이면 그 로직이 성립하지 않는다. 9/4 회의록 정본 대조 #4가 같은 지점을 짚고 있다.

> S03 필드 — 엑셀 디멘션에는 동반·시간대만 확인됨 / S03은 동반·보행·이동수단·음식제약 4개 → 나머지 3개가 점수에 반영되는지, 리스크 필터로 빠지는지 매핑 확인

`trip_setup_mode` 키의 용도도 확인이 필요하다(피그마 UXF2에 이름만 있고 정의 없음).

---

## Scope

### 포함

- `types/trip.ts` — 위 스키마 타입 정의. **에린 공유 대상**
- `data/tripSetup.ts` — 칩 목록·섹션 문구(피그마 실물 기준)
- `components/common/Chip.tsx` — DS v1 기준 칩 (선택 시 잉크 테두리 + surface 배경, 999px)
- `app/trip-setup/page.tsx` — S03 화면. 섹션 5개 + 조건부 확장 2개(아이 연령 · 반려동물 이동) + 선택 요약 고정 바
- `profile/page.tsx` — `조건 더 알려주기` → `/trip-setup` 연결
- `storage.ts` — `trip_setup` 키 추가, `clearDiagnosis()` 에 포함

### 제외

- **추천 엔진의 필터·보정 적용** — 에린 범위. 이 티켓은 값을 만들어 저장하는 데까지
- `currentSituation` 의 날씨 자동 감지 — 9/4 회의 "자동 입력: 계절·시간·날씨"는 서버 몫
- 나머지 화면 DS 적용 — FE-CHORE-001

---

## Strategy

### Step 1: 타입 정의 (`types/trip.ts`)
필드·값 도메인·제약 성격을 코드에 명시한다. 에린이 이 파일만 보면 되도록 주석에 근거를 남긴다.

### Step 2: 칩 데이터 (`data/tripSetup.ts`)
피그마 S03 문구 그대로. 섹션별 라벨·헬퍼 텍스트 포함.

### Step 3: Chip 컴포넌트
DS v1 — 모서리 999px, 선택 시 `ink` 테두리 + `ds-surface` 배경.

### Step 4: S03 화면
섹션 5개, 조건부 확장 2개, 선택 요약 고정 바, 하단 CTA 2개(추천 받기 · 건너뛰기).

### Step 5: 연결 + 검증
S02 CTA 연결, 빌드, 흐름 확인.

---

## Acceptance Criteria

- [ ] S00 → S01 → S02 → **S03** → S10 흐름이 끊기지 않는다
- [ ] `조건 더 알려주기` 가 `/trip-setup` 으로 이동한다
- [ ] 섹션 5개가 피그마 순서·문구와 일치한다
- [ ] `아이 동반` 선택 시 연령 확장이, `반려동물 동반` 선택 시 이동 방식 확장이 나타난다
- [ ] 선택 해제 시 확장이 접히고 해당 값이 `null` 로 초기화된다
- [ ] 음식 제약에서 `특별히 없어요` 를 고르면 다른 선택이 해제된다
- [ ] 선택 요약 고정 바가 선택 항목과 개수를 표시한다
- [ ] `건너뛰기` 로도 `/feed` 진입이 가능하다 (전부 미선택 허용)
- [ ] `trip_setup` 이 localStorage에 저장된다
- [ ] DS v1 준수 — `font-light` 0, 스케일 밖 폰트 0, 팔레트 밖 색 0
- [ ] `npm run build` 통과

---

## Implementation Notes

(작업 중 기록)
