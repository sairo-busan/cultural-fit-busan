import type { ChoiceOption } from "@/components/common/ChoiceChipGroup";

/**
 * S03 조건 입력 — 추천 엔진 입력 계약. 저장 키 `trip_setup`.
 *
 * 필드명·값은 시트의 `stored_field`·`option_code` 를 그대로 쓴다. 저장 객체가
 * 곧 엔진과의 계약이라 이름을 바꾸면 양쪽에서 번역이 필요해진다 — TS 관례
 * (camelCase) 대신 snake_case 를 쓰는 이유다.
 */

/** `CMP01` — 주 동행 */
export type PrimaryCompanion = "SOLO" | "FRIEND_COUPLE" | "PARENTS";

/** `CHILD01` */
export type ChildAgeGroup = "INFANT" | "PRESCHOOL" | "ELEMENTARY" | "TEEN";

/** `PET01` */
export type PetCarry = "LEASH" | "CARRIER" | "BOTH";

/** `MOB01` — 보행 부담 */
export type MobilityCare =
  "NONE" | "LONG_WALK" | "STAIRS" | "STROLLER" | "WHEELCHAIR";

/** `TRN01` — 이동 수단. 동선 계산에만 쓰고 CF8·동행 점수에는 반영하지 않는다. */
export type TransportMode = "WALK" | "TRANSIT" | "CAR";

/** `FOOD01` — 음식 제약. 충돌이 **확인된** 장소만 제외한다(UNKNOWN은 유지). */
export type FoodRestriction =
  "NONE" | "NO_SPICY" | "VEGAN" | "NO_RAW_MEAT" | "NO_RAW_SEAFOOD" | "NO_PORK";

/**
 * `CTX01` — 현재 상황.
 * `NONE` 은 "추가 보정 없음"이며, 자동 날씨·계절·시간 보정은 그대로 적용된다.
 */
export type CurrentContext =
  | "TIME_FLEXIBLE"
  | "BEFORE_MEAL"
  | "INDOOR_FIRST"
  | "OUTDOOR_PREFERRED"
  | "AVAILABLE_NOW"
  | "AVOID_CROWD"
  | "NONE";

// === 저장 객체 ===

export type TripSetup = {
  primary_companion: PrimaryCompanion | null;
  /** 주 동행과 별개로 함께 고를 수 있다 */
  child_with: boolean;
  pet_with: boolean;
  /** `child_with` 가 false 면 null */
  child_age_group: ChildAgeGroup | null;
  /** `pet_with` 가 false 면 null */
  pet_carry: PetCarry | null;
  mobility_care: MobilityCare[];
  transport_mode: TransportMode | null;
  food_restriction: FoodRestriction[];
  current_context: CurrentContext[];
};

// === 화면 데이터 구조 ===

export type TripQuestion = {
  /** 시트 `question_id` */
  id: string;
  key: keyof TripSetup;
  multiple?: true;
  /** 시트 `question` */
  title: string;
  /** 시트 `helper_text` */
  helperText?: string;
  options: ChoiceOption[];
  /** 주 선택과 배타가 아니라 함께 고르는 선택지 (CMP01 아이·반려동물) */
  toggles?: { key: keyof TripSetup; option: ChoiceOption }[];
  /** 트리거 문항의 값이 이것과 같을 때만 보인다 (시트 `show_when`) */
  showWhen?: { key: keyof TripSetup; equals: string | boolean };
};
