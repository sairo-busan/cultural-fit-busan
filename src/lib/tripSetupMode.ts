/**
 * trip_setup_mode 분기 (FE-FEAT-005 Step 9, 04_추천로직 R024) — Model B.
 * QUICK = CF8 + 자동상황(날씨·계절·시간대)만 적용, S02에서 S10 직행.
 * CUSTOM = 사용자가 S03에서 답한 옵션(동행·이동제약·현재상황)을 추가 적용.
 *
 * 소피 `types/trip.ts`의 `TripSetup`이 이미 엔진 표기(필드명·값)를 그대로 쓰므로
 * Model A 시절 있었던 "friend_couple을 couple+friends로 갈라 평균" 같은 변환이
 * 없어졌다 — situationalScore.ts가 `primaryCompanion`을 그대로 받는다.
 */

import type { CompanionSelection } from "./situationalScore";
import type { HardFilterInput, WalkingDifficulty, CurrentContext } from "./hardFilter";

export type TripSetupMode = "QUICK" | "CUSTOM";

/** S03이 localStorage `trip_setup`에 저장하는 형태(`types/trip.ts` 부분집합) */
export type TripSetupLike = {
  primaryCompanion: string | null;
  childWith: boolean;
  petWith: boolean;
  mobilityCare: string[];
  currentContext: string[];
};

export type ActiveFilters = {
  companion: CompanionSelection;
  hardFilter: HardFilterInput;
};

const WALKING_DIFFICULTIES: WalkingDifficulty[] = [
  "none",
  "long_walk",
  "stairs_slope",
  "stroller",
  "wheelchair",
];

const CURRENT_CONTEXTS: CurrentContext[] = [
  "time_flexible",
  "before_meal",
  "indoor_first",
  "outdoor_preferred",
  "available_now",
  "avoid_crowd",
  "none",
];

/** localStorage에서 온 문자열이라 그대로 믿지 않는다 — 엔진이 아는 값만 통과시킨다 */
function keepKnown<T extends string>(values: string[], allowed: T[]): T[] {
  return values.filter((v): v is T => (allowed as string[]).includes(v));
}

function isPrimaryCompanion(v: string | null): v is CompanionSelection["primary"] {
  return v === "solo" || v === "friend_couple" || v === "parents";
}

/**
 * QUICK이면 trip_setup을 아예 안 걷어와서 전부 빈 값 — CF8 매칭·자동상황만
 * 반영되게 한다. CUSTOM이면 실제 응답값을 넘긴다.
 */
export function resolveActiveFilters(
  mode: TripSetupMode,
  tripSetup: TripSetupLike | null
): ActiveFilters {
  if (mode === "QUICK" || !tripSetup) {
    return {
      companion: { primary: null, childWith: false, petWith: false },
      hardFilter: { hasMobilityConstraint: false, petWith: false, currentContext: [] },
    };
  }

  const mobilityCare = keepKnown(tripSetup.mobilityCare ?? [], WALKING_DIFFICULTIES);
  const currentContext = keepKnown(tripSetup.currentContext ?? [], CURRENT_CONTEXTS);

  return {
    companion: {
      primary: isPrimaryCompanion(tripSetup.primaryCompanion) ? tripSetup.primaryCompanion : null,
      childWith: tripSetup.childWith,
      petWith: tripSetup.petWith,
    },
    hardFilter: {
      hasMobilityConstraint: mobilityCare.some((v) => v !== "none"),
      petWith: tripSetup.petWith,
      currentContext,
    },
  };
}
