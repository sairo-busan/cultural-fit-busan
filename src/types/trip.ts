import type { ChoiceOption } from "@/components/common/ChoiceChipGroup";

/**
 * S03 조건 입력 — 추천 엔진 입력 계약
 *
 * 정본: 필드명·값은 구글 시트 S03 문항 탭 (`CMP01` ~ `ACT01`),
 *       선택 방식은 화면설계서 `Sairo_화면설계서_08Sep26.pptx` slide5 표
 * 저장 키: `trip_setup` (피그마 UXF2)
 *
 * ─────────────────────────────────────────────────────────────
 * 필드명과 값은 시트의 `stored_field` · `option_code` 를 그대로 쓴다.
 * 저장 객체가 곧 엔진과의 계약이라, 이름을 바꾸면 양쪽에서 번역이 필요해진다.
 * 그래서 TS 관례(camelCase)를 따르지 않고 시트 표기(snake_case)를 유지한다.
 *
 * 선택 방식은 화면설계서를 따른다 (시트는 전부 `SINGLE` — 유나 확인 대기).
 * ─────────────────────────────────────────────────────────────
 */

/** `CMP01` — 함께하는 분. 엑셀 점수판의 동행 5컬럼과 1:1 대응한다. */
export type CompanionType =
  | "SOLO"
  | "FRIEND_COUPLE"
  | "PARENTS"
  | "CHILD"
  | "PET";

/** `CHILD01` — `companion_type = CHILD` 일 때만 */
export type ChildAgeGroup = "INFANT" | "PRESCHOOL" | "ELEMENTARY" | "TEEN";

/** `PET01` — `companion_type = PET` 일 때만 */
export type PetCarry = "LEASH" | "CARRIER" | "BOTH";

/** `MOB01` — 보행 부담 */
export type MobilityCare =
  | "NONE"
  | "LONG_WALK"
  | "STAIRS"
  | "STROLLER"
  | "WHEELCHAIR";

/** `TRN01` — 이동 수단. 동선 계산에만 쓰고 CF8·동행 점수에는 반영하지 않는다. */
export type TransportMode = "WALK" | "TRANSIT" | "CAR";

/** `FOOD01` — 음식 제약. 충돌이 **확인된** 장소만 제외한다(UNKNOWN은 유지). */
export type FoodRestriction =
  | "NONE"
  | "NO_SPICY"
  | "VEGAN"
  | "NO_RAW_MEAT"
  | "NO_RAW_SEAFOOD"
  | "NO_PORK";

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
  companion_type: CompanionType[];
  /** `companion_type` 에 `CHILD` 가 없으면 null */
  child_age_group: ChildAgeGroup | null;
  /** `companion_type` 에 `PET` 이 없으면 null */
  pet_carry: PetCarry | null;
  /** 복수 — "오래 걷기 어렵고 계단도 어려움" 같은 조합이 흔하다 */
  mobility_care: MobilityCare[];
  transport_mode: TransportMode | null;
  /** 복수 — "채식인데 매운 것도 못 먹음" 같은 조합이 흔하다 */
  food_restriction: FoodRestriction[];
  current_context: CurrentContext[];
};

// === 화면 데이터 구조 ===

export type TripQuestion = {
  /** 시트 `question_id` — `CMP01` 등 */
  id: string;
  key: keyof TripSetup;
  multiple?: true;
  /** 시트 `question` */
  title: string;
  /** 시트 `helper_text` */
  helperText?: string;
  options: ChoiceOption[];
  /**
   * 조건부 노출. 트리거 문항에서 이 값이 골라졌을 때만 보인다.
   * 시트 `show_when` 의 `companion_type=CHILD` 를 옮긴 것.
   */
  showWhen?: { key: keyof TripSetup; equals: string };
};
