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

/** 소피 types/trip.ts TripSetup의 부분집합 — 이 엔진이 실제로 쓰는 필드만 */
export type TripSetupLike = {
  travelWith: string[];
  walkingDifficulty: string[];
  foodRestriction: string[];
};

export type ActiveFilters = {
  companions: Companion[];
  walkingDifficulties: WalkingDifficulty[];
  foodRestrictions: FoodRestriction[];
};

/**
 * QUICK이면 trip_setup을 아예 안 걷어와서 전부 빈 배열 — CF8 매칭·자동상황만
 * 반영되게 한다. CUSTOM이면 실제 응답값을 그대로 넘긴다(응답 없는 필드는
 * 소피 쪽에서 이미 빈 배열/null로 들어옴).
 */
export function resolveActiveFilters(
  mode: TripSetupMode,
  tripSetup: TripSetupLike | null
): ActiveFilters {
  if (mode === "QUICK" || !tripSetup) {
    return { companions: [], walkingDifficulties: [], foodRestrictions: [] };
  }
  return {
    companions: tripSetup.travelWith as Companion[],
    walkingDifficulties: tripSetup.walkingDifficulty as WalkingDifficulty[],
    foodRestrictions: tripSetup.foodRestriction as FoodRestriction[],
  };
}
