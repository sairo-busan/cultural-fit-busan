/**
 * 하드필터 — 클라이언트에서 CF8 매칭 전에 후보를 제외/표시하는 로직 (FE-FEAT-005 Step 6).
 *
 * 06_TRV_여행경험문항(TRV06) 옵션 설명 기준 설계:
 *   - raw_meat/raw_seafood = 안전 성격 → 확인되면(true) 무조건 제외(하드)
 *   - vegan/spicy         = 선호도 성격 → CALC_04에 가중치가 정의돼 있지 않아 점수 가산은
 *                           하지 않고, "적합 후보" 배지만 붙인다(matchesPreference)
 *   - allergy             = 자동판단 안 함, 필터링 대상 아님(매장 확인 필요 안내만)
 *
 * 03A-4_평가기준·근거(HF_WHEELCHAIR 등) 기준: 접근성 필드는 명시적으로 false(확인된
 * 불가)일 때만 제외. null(UNKNOWN)은 제외하지 않고 "정보 확인 중" 표시 대상으로 남긴다
 * (07_UI_화면수정 S20/S30 원칙과 동일).
 */

export type FoodRestriction = "none" | "spicy" | "vegan" | "raw_meat" | "raw_seafood" | "allergy";
export type WalkingDifficulty = "none" | "long_walk" | "stairs_slope" | "stroller" | "wheelchair";

export type PlaceForFilter = {
  coverage: number;
  hasRaw: boolean | null;
  hasMeatOnly: boolean | null;
  hasSeafoodOnly: boolean | null;
  spiceLevel: number | null;
  wheelchairAccessible: boolean | null;
  strollerAccessible: boolean | null;
  stairsAlternative: boolean | null;
};

export type HardFilterResult = {
  excluded: boolean;
  /** 제외 사유 코드(디버그·QA용, 화면에 그대로 노출하지 않음) */
  reasons: string[];
};

/** COVERAGE_LOW(<40) · 확인된 raw_meat/raw_seafood · 확인된(false) 접근성 제약만 제외한다. */
export function applyHardFilter(
  place: PlaceForFilter,
  foodRestrictions: FoodRestriction[],
  walkingDifficulties: WalkingDifficulty[]
): HardFilterResult {
  const reasons: string[] = [];

  if (place.coverage < 40) reasons.push("COVERAGE_LOW");

  if (foodRestrictions.includes("raw_meat") && place.hasRaw === true) {
    reasons.push("RAW_MEAT_CONFIRMED");
  }
  if (foodRestrictions.includes("raw_seafood") && place.hasSeafoodOnly === true) {
    reasons.push("RAW_SEAFOOD_CONFIRMED");
  }

  if (walkingDifficulties.includes("wheelchair") && place.wheelchairAccessible === false) {
    reasons.push("WHEELCHAIR_NOT_ACCESSIBLE");
  }
  if (walkingDifficulties.includes("stroller") && place.strollerAccessible === false) {
    reasons.push("STROLLER_NOT_ACCESSIBLE");
  }
  if (walkingDifficulties.includes("stairs_slope") && place.stairsAlternative === false) {
    reasons.push("NO_STAIRS_ALTERNATIVE");
  }

  return { excluded: reasons.length > 0, reasons };
}

/**
 * vegan/spicy 선호 배지 — 점수에 반영하지 않고 UI 표시용 플래그만 반환한다
 * (CALC_04에 이 항목 가중치가 없어서 임의 숫자를 만들지 않기로 결정, 2026-09-05).
 */
export function matchesSoftFoodPreference(
  place: PlaceForFilter,
  foodRestrictions: FoodRestriction[]
): boolean {
  if (foodRestrictions.includes("vegan") && place.hasMeatOnly === false) return true;
  if (foodRestrictions.includes("spicy") && place.spiceLevel !== null && place.spiceLevel <= 1) {
    return true;
  }
  return false;
}
