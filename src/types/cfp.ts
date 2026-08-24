// === Locale ===

export type Locale = "ko" | "en";

// === S01 온보딩 응답 타입 ===

// S01-1 동반인
export type Companion = "solo" | "couple" | "friends" | "family";

// S01-2 걷기 여력 (도보 10분 / 15분 / 20분)
export type WalkingDistance = "short" | "medium" | "long";

// S01-3 분위기 — Q/V 축 (3지선다: 중간값 = 중립)
export type AtmosphereAnswer = "quiet" | "both" | "vivid";

// S01-4 장소 성향 — L/F 축
export type PlaceTypeAnswer = "local" | "both" | "familiar";

// S01-5 체류 성향 — S/W 축
export type PaceAnswer = "slow" | "both" | "walk";

// S01-6 매운맛 — M/H 축
export type PalateAnswer = "mild" | "both" | "hot";

// S01-7 Hard Filter (폼 패턴 — 퀴즈와 별도 UI)
export type CannotEat = "raw_fish" | "all_seafood" | "pork";
export type VeganStatus = "none" | "partial" | "full";
export type DiningPreference = "anywhere" | "seated";

export type HardFilter = {
  cannotEat: CannotEat[];
  veganStatus: VeganStatus | null;
  diningPreference: DiningPreference | null;
};

// 6문항 응답 묶음
export type QuizAnswers = {
  companion: Companion | null;
  walkingDistance: WalkingDistance | null;
  atmosphere: AtmosphereAnswer | null;
  placeType: PlaceTypeAnswer | null;
  pace: PaceAnswer | null;
  palate: PalateAnswer | null;
};

// === CFP 축 코드 ===

export type AtmosphereCode = "Q" | "V";
export type PlaceTypeCode = "L" | "F";
export type PalateCode = "M" | "H";
export type PaceCode = "S" | "W";

// === CFP 프로필 ===

export type CfpAxes = {
  atmosphere: { code: AtmosphereCode; value: number };
  placeType: { code: PlaceTypeCode; value: number };
  palate: { code: PalateCode; value: number };
  pace: { code: PaceCode; value: number };
};

export type CfpProfile = {
  typeCode: string;
  nameKo: string;
  nameEn: string;
  description: string;
  axes: CfpAxes;
  companion: Companion;
  walkingDistance: WalkingDistance;
  hardFilter: HardFilter;
};

// === 퀴즈 UI 데이터 구조 ===

export type QuizOptionData = {
  value: string;
  label: string;
  description: string;
};

export type QuizStepData = {
  stepNumber: number;
  categoryLabel: string;
  title: string;
  description: string;
  options: QuizOptionData[];
};
