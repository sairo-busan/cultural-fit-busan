/**
 * 하드필터 — Model B (9/10 회의 확정, docs/decisions/2026-09-11_DB필드_확정.md).
 *
 * CF8만 점수화하고 조건값은 점수에 안 반영한다 — 전부 후보를 빼거나 남기는
 * WHERE 조건이다. "확인된 false"와 "미등록(null)"을 구분한다: null은 통과시키고
 * 화면에 "정보 확인 중"으로만 표시한다(false는 두 API 특성상 실무적으로 거의 안 나옴).
 *
 * 음식 제약은 이번 범위에서 빼는 쪽으로 제안됐지만 팀 결정 대기 중이라 값은 받되
 * 필터링에는 안 쓴다(no-op) — 결정되면 여기 한 군데만 고치면 된다.
 */

export type FoodRestriction = "none" | "spicy" | "vegan" | "raw_meat" | "raw_seafood" | "pork";
export type WalkingDifficulty = "none" | "long_walk" | "stairs_slope" | "stroller" | "wheelchair";
export type CurrentContext =
  | "time_flexible"
  | "before_meal"
  | "indoor_first"
  | "outdoor_preferred"
  | "available_now"
  | "avoid_crowd"
  | "none";

export type PlaceForFilter = {
  /**
   * DB_01 신설 컬럼(indoor_outdoor). 필드명은 화면(`RecommendedPlace.weatherType`,
   * PlaceRow.tsx 뱃지)이 이미 쓰는 이름을 그대로 재사용해서 값을 중복으로 안 갖고 간다.
   * 유나가 태깅하기 전까지 전부 null.
   */
  weatherType: "indoor" | "outdoor" | "mixed" | null;
  /** TourAPI contenttypeid=39 등으로 자동 파생(recommend.ts) */
  isRestaurant: boolean | null;
  /** 무장애 API 파생값(ingest-places.ts) — "이동약자 배려시설 있음" */
  barrierFree: boolean | null;
  /** DB_01 수작업 태깅(API 시드 + 유나 보완) */
  petAllowed: boolean | null;
};

export type HardFilterInput = {
  /** S03 mobilityCare에서 "none" 아닌 값이 하나라도 있으면 true — 세부 4종 다 이 하나로 합침 */
  hasMobilityConstraint: boolean;
  petWith: boolean;
  currentContext: CurrentContext[];
};

export type HardFilterResult = {
  excluded: boolean;
  /** 제외 사유 코드(디버그·QA용, 화면에 그대로 노출하지 않음) */
  reasons: string[];
};

export function applyHardFilter(place: PlaceForFilter, input: HardFilterInput): HardFilterResult {
  const reasons: string[] = [];

  // 보행부담 — 뭐든 하나 선택돼 있으면 확인된 불가(false)만 제외, null은 통과
  if (input.hasMobilityConstraint && place.barrierFree === false) {
    reasons.push("BARRIER_NOT_FREE");
  }

  // 반려동물 동반 — 확인된 불가(false)만 제외, null은 통과
  if (input.petWith && place.petAllowed === false) {
    reasons.push("PET_NOT_ALLOWED");
  }

  // current_context — CF8과 별개인 필터링 룰(9/10 회의)
  // "식사 전"을 고르지 않았으면 식당류를 뺀다. isRestaurant가 UNKNOWN(null)이면 통과.
  if (!input.currentContext.includes("before_meal") && place.isRestaurant === true) {
    reasons.push("NOT_BEFORE_MEAL");
  }
  if (input.currentContext.includes("indoor_first") && place.weatherType === "outdoor") {
    reasons.push("NOT_INDOOR");
  }
  if (input.currentContext.includes("outdoor_preferred") && place.weatherType === "indoor") {
    reasons.push("NOT_OUTDOOR");
  }
  // available_now·avoid_crowd·time_flexible: 대응 데이터 없음, 이번 범위에서 미반영

  return { excluded: reasons.length > 0, reasons };
}
