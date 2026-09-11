/**
 * trip_setup_mode 분기 (FE-FEAT-005 Step 9, 04_추천로직 R024).
 * QUICK = CF8 + 자동상황(날씨·계절·시간대)만 적용, S02에서 S10 직행.
 * CUSTOM = 사용자가 S03에서 답한 옵션(동행·이동제약·음식제약)을 추가 적용.
 *
 * R024 원문: "미응답은 '특별히 없음'이 아니며 하드필터를 만들지 않음" —
 * QUICK이거나 CUSTOM인데 특정 항목에 응답이 없으면 빈 배열/null로 취급하고,
 * hardFilter.ts·situationalScore.ts는 이미 빈 배열·null을 "제약 없음"으로
 * 안전하게 처리하므로 여기서는 모드에 따라 입력을 흘려보낼지만 결정한다.
 */

import type { FoodRestriction, WalkingDifficulty } from "./hardFilter";
import type { Companion } from "./situationalScore";

export type TripSetupMode = "QUICK" | "CUSTOM";

/** S03이 localStorage `trip_setup` 에 저장하는 형태 (`types/trip.ts` 부분집합) */
export type TripSetupLike = {
  primaryCompanion: string | null;
  childWith: boolean;
  petWith: boolean;
  mobilityCare: string[];
  foodRestriction: string[];
};

export type ActiveFilters = {
  companions: Companion[];
  walkingDifficulties: WalkingDifficulty[];
  foodRestrictions: FoodRestriction[];
};

/**
 * S03 저장값은 엔진 값과 같은 표기를 쓴다. 옮길 게 남은 곳은 주 동행 하나뿐이다 —
 * `friend_couple` 이 엔진에서 둘로 나뉘어 있고 selectCompanionScore 가 평균을
 * 내므로 두 개를 함께 넘긴다. 시트 CALC_03C("친구·연인은 두 값 평균")와 같다.
 */
const PRIMARY_COMPANION: Record<string, Companion[]> = {
  solo: ["solo"],
  friend_couple: ["couple", "friends"],
  parents: ["parents"],
};

/**
 * `trip_setup` 은 localStorage 에서 온 문자열이라 그대로 믿지 않는다.
 * 배열을 엔진 타입으로 선언해 두었으므로 엔진 값이 바뀌면 여기서 컴파일 에러가 난다.
 */
const WALKING_DIFFICULTIES: WalkingDifficulty[] = [
  "none",
  "long_walk",
  "stairs_slope",
  "stroller",
  "wheelchair",
];

/** S03 의 `pork` 은 대응하는 태깅 컬럼이 없어 여기서 떨어진다 */
const FOOD_RESTRICTIONS: FoodRestriction[] = [
  "none",
  "spicy",
  "vegan",
  "raw_meat",
  "raw_seafood",
];

function keepKnown<T extends string>(values: string[], allowed: T[]): T[] {
  return values.filter((v): v is T => (allowed as string[]).includes(v));
}

/** 주 동행 1개 + 아이·반려동물 여부를 엔진 Companion 배열로 조립한다 */
function toCompanions(setup: TripSetupLike): Companion[] {
  const companions: Companion[] = setup.primaryCompanion
    ? (PRIMARY_COMPANION[setup.primaryCompanion] ?? [])
    : [];
  if (setup.childWith) companions.push("kid");
  if (setup.petWith) companions.push("pet");
  return companions;
}

/**
 * QUICK이면 trip_setup을 아예 안 걷어와서 전부 빈 배열 — CF8 매칭·자동상황만
 * 반영되게 한다. CUSTOM이면 실제 응답값을 넘긴다.
 */
export function resolveActiveFilters(
  mode: TripSetupMode,
  tripSetup: TripSetupLike | null,
): ActiveFilters {
  if (mode === "QUICK" || !tripSetup) {
    return { companions: [], walkingDifficulties: [], foodRestrictions: [] };
  }
  return {
    companions: toCompanions(tripSetup),
    walkingDifficulties: keepKnown(
      tripSetup.mobilityCare ?? [],
      WALKING_DIFFICULTIES,
    ),
    foodRestrictions: keepKnown(
      tripSetup.foodRestriction ?? [],
      FOOD_RESTRICTIONS,
    ),
  };
}
