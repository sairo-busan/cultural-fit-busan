import type { ChoiceOption } from "@/components/common/ChoiceChipGroup";

/**
 * S03 조건 입력 — 추천 엔진 입력 계약. 저장 키 `trip_setup`.
 *
 * 필드명과 값 모두 엔진 표기를 따른다 — `lib/hardFilter.ts` · `lib/situationalScore.ts`.
 * 시트 `option_code` 와의 대응표는 티켓 `FE-FEAT-008` 에 있다.
 */

/** `CMP01` — 주 동행. `friend_couple` 만 엔진 `Companion` 에서 둘로 갈린다 */
export type PrimaryCompanion = "solo" | "friend_couple" | "parents";

/** `CHILD01` */
export type ChildAgeGroup = "infant" | "preschool" | "elementary" | "teen";

/** `PET01` */
export type PetCarry = "leash" | "carrier" | "both";

/** `MOB01` — 엔진 `WalkingDifficulty` 와 같은 값 */
export type MobilityCare =
  "none" | "long_walk" | "stairs_slope" | "stroller" | "wheelchair";

/** `TRN01` — 이동 수단. 동선 계산에만 쓰고 CF8·동행 점수에는 반영하지 않는다. */
export type TransportMode = "walk" | "transit" | "car";

/**
 * `FOOD01` — 엔진 `FoodRestriction` 과 같은 값에 `pork` 하나가 더 있다.
 * 충돌이 **확인된** 장소만 제외한다(UNKNOWN은 유지).
 */
export type FoodRestriction =
  "none" | "spicy" | "vegan" | "raw_meat" | "raw_seafood" | "pork";

/**
 * `CTX01` — 현재 상황. 엔진에 대응 타입이 아직 없다.
 * `none` 은 "추가 보정 없음"이며, 자동 날씨·계절·시간 보정은 그대로 적용된다.
 */
export type CurrentContext =
  | "time_flexible"
  | "before_meal"
  | "indoor_first"
  | "outdoor_preferred"
  | "available_now"
  | "avoid_crowd"
  | "none";

// === 저장 객체 ===

export type TripSetup = {
  primaryCompanion: PrimaryCompanion | null;
  /** 주 동행과 별개로 함께 고를 수 있다 */
  childWith: boolean;
  petWith: boolean;
  /** `childWith` 가 false 면 null */
  childAgeGroup: ChildAgeGroup | null;
  /** `petWith` 가 false 면 null */
  petCarry: PetCarry | null;
  mobilityCare: MobilityCare[];
  transportMode: TransportMode | null;
  foodRestriction: FoodRestriction[];
  currentContext: CurrentContext[];
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
