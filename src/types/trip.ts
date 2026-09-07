/**
 * S03 조건 입력 — 추천 엔진 입력 계약
 *
 * 화면 정본: 피그마 Page 2_최종 `S03 · 조건 입력` (1007:1857)
 * 저장 키:   `trip_setup` (피그마 UXF2 온보딩 순서도에서 확정)
 *
 * ─────────────────────────────────────────────────────────────
 * 추천 엔진(에린)이 소비하는 값이다. 필드마다 제약 성격을 명시한다.
 *
 *   HARD            — 해당 장소를 결과에서 제외한다
 *   HARD_AND_SCORE  — 일부는 제외, 나머지는 가중치로 반영
 *   SCORE           — 점수 보정에만 반영
 *
 * 모든 필드는 선택 사항이다. 미선택은 빈 배열 또는 null이며,
 * "선택하지 않아도 추천 피드에 진입할 수 있어요"(피그마 S03)를 따른다.
 * ─────────────────────────────────────────────────────────────
 */

// === 함께하는 분 (SCORE · 복수 선택) ===
//
// ⚠️ 미확정. `06_TRV_여행경험문항` 에는 동반자를 묻는 문항이 없다. 시트가 묻는 것은
//    `TRV01` `travel_mode`(여행 목적) 4종 단일 선택이고, 이 필드는 피그마 S03
//    기준으로 만든 것이다. 유나 확인 대기 중(2026-09-07 질의).
//
// 값은 `예시_CF8추천구조` 탭의 동반 **점수 컬럼** 6종에 대응시켜 두었다.
// 문항 정의가 아니라 장소별 점수라서, 시트가 이 필드를 승인한 것은 아니다.
//   혼자 · 연인과 · 친구와 · 부모님과 · 아이와 · 반려동물과
//
// `solo` 만 배타적이다(혼자면 동반자가 없다). 나머지는 겹칠 수 있다 —
// 부모님+아이(3대), 연인+아이(가족), 친구+반려동물 등.
//
// 복수 선택 시 점수 조회 방식은 미정이다. 최소값(가장 까다로운 동반자 기준)을
// 제안했으나 시트에 규칙이 없어 에린과 합의가 필요하다.
//   예) 아이와 60 · 연인과 90 → 60

export type TravelWith =
  | "solo"
  | "couple"
  | "friends"
  | "parents"
  | "kid"
  | "pet";

/** 아이 동반 시에만 (HARD_AND_SCORE) — 정본 `child_age_group` 과 구간 동일 */
export type ChildAgeGroup = "age_0_3" | "age_4_7" | "age_8_13" | "age_14_18";

/** 반려동물 동반 시에만 (SCORE) — 캐리어면 실내 가능 장소가 늘어난다 */
export type PetTravelMode = "leash" | "carrier" | "both";

// === 보행 부담 (HARD_AND_SCORE) ===
// 접근성 제약이라 일부는 배제 성격이다. 정본 시트에는 대응 항목이 없고,
// 무장애 여행 정보 API(MVP2)와 연결될 가능성이 있다.

export type WalkingDifficulty =
  | "none"
  | "long_walk"
  | "stairs_slope"
  | "stroller"
  | "wheelchair";

// === 이동 수단 (SCORE) ===

export type Transport = "walk" | "transit" | "car";

// === 음식 제약 (🔴 HARD) ===
// 피그마 문구: "고르신 항목은 추천에서 아예 제외합니다"
// 정본 추천 로직 R013(검증된 음식 제약)과 태깅 컬럼에 매핑된다.
//
//   spicy        → spice_level
//   vegan        → has_meat_only
//   raw_meat     → has_raw
//   raw_seafood  → has_seafood_only
//   none         → 다른 선택을 모두 해제

export type FoodRestriction =
  | "none"
  | "spicy"
  | "vegan"
  | "raw_meat"
  | "raw_seafood";

// === 현재 상황 (SCORE) ===
// 9/4 회의 기준 실시간 변수는 시간·날씨 2개다. 여기서 받는 값은
// 사용자가 직접 지정한 것이고, 자동 감지분은 서버가 채운다.

export type CurrentSituation =
  | "rain"
  | "time_rich"
  | "before_meal"
  | "indoor"
  | "outdoor"
  | "right_now"
  | "avoid_crowd";

// === 저장 객체 ===

export type TripSetup = {
  travelWith: TravelWith[];
  /** travelWith 에 "kid" 가 없으면 null */
  childAgeGroup: ChildAgeGroup | null;
  /** travelWith 에 "pet" 이 없으면 null */
  petTravelMode: PetTravelMode | null;
  walkingDifficulty: WalkingDifficulty[];
  transport: Transport | null;
  foodRestriction: FoodRestriction[];
  currentSituation: CurrentSituation[];
};

// === 화면 데이터 구조 ===

export type ChipOption = {
  value: string;
  label: string;
};

export type TripSection = {
  key: keyof TripSetup;
  title: string;
  /** 제목 아래 보조 문구 */
  helperText?: string;
  /** 복수 선택 여부 */
  multiple: boolean;
  /** 이 값을 고르면 같은 섹션의 다른 선택이 해제된다 */
  exclusiveOption?: string;
  options: ChipOption[];
};
