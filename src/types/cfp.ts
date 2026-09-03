// === Locale ===

export type Locale = "ko" | "en";

// === CF8 축 코드 ===
// 화면 정본: 피그마 Page 2_최종 S01(1007:1661) · S02(1007:1769)
// 체계 정본: 기획 구글 시트 [최] SAIRO 통합본 (CFQ01~03)
//
// ⚠️ 구버전 CFP16과 글자가 겹치지만 뜻이 다르다.
//    V가 CFP16에서는 "활기"(분위기)였으나 CF8에서는 "다양하게 경험"(경험)이다.

/** CFQ01 · cf_atmosphere — C 차분 / E 활기 */
export type AtmosphereCode = "C" | "E";

/** CFQ02 · cf_local_famous — L 현지 / F 대표명소 */
export type PlaceTypeCode = "L" | "F";

/** CFQ03 · cf_deep_variety — D 한 곳 / V 여러 곳 */
export type ExperienceCode = "D" | "V";

/** 세 축 코드를 순서대로 이어붙인 8유형 코드 */
export type Cf8Code =
  | "CLD"
  | "CLV"
  | "CFD"
  | "CFV"
  | "ELD"
  | "ELV"
  | "EFD"
  | "EFV";

/**
 * 축 값. 피그마 S01은 4지선다(분위기·장소)와 3지선다(방식)이고
 * S02는 그 단계를 슬라이더 위치로 보여준다. 장소 태깅도 −2~+2 5단계라
 * 같은 척도를 쓴다.
 *
 * 4지선다: -2 / -1 / +1 / +2
 * 3지선다: -2 /  0 / +2   (0 = 중립)
 */
export type AxisValue = -2 | -1 | 0 | 1 | 2;

// === S01 취향 진단 응답 ===

/** 문항별로 선택한 축 값. 부호가 곧 축 코드다. */
export type QuizAnswers = {
  atmosphere: AxisValue | null;
  placeType: AxisValue | null;
  experience: AxisValue | null;
};

// === CF8 프로필 ===

export type Cf8Axis<T extends string> = {
  code: T;
  value: AxisValue;
};

export type Cf8Axes = {
  atmosphere: Cf8Axis<AtmosphereCode>;
  placeType: Cf8Axis<PlaceTypeCode>;
  experience: Cf8Axis<ExperienceCode>;
};

export type Cf8Profile = {
  /** cf8_code — 예: "CLD" */
  code: Cf8Code;
  nameKo: string;
  description: string;
  axes: Cf8Axes;
  hardFilter: HardFilter;
};

// === S03 조건 입력 (FE-FEAT-004에서 구현 예정) ===
// 진단에서 빠져 조건 입력으로 이동한 항목들. 지금은 빈 값으로 유지해
// S10·S20 동작을 보존한다.

export type CannotEat = "raw_fish" | "all_seafood" | "pork";
export type VeganStatus = "none" | "partial" | "full";
export type DiningPreference = "anywhere" | "seated";

export type HardFilter = {
  cannotEat: CannotEat[];
  veganStatus: VeganStatus | null;
  diningPreference: DiningPreference | null;
};

// === 퀴즈 UI 데이터 구조 ===

export type QuizChoiceData = {
  label: string;
  /** 선택 시 축에 기록되는 값 */
  value: AxisValue;
};

export type QuizQuestionData = {
  /** CFQ01 ~ CFQ03 */
  id: string;
  /** 응답 객체의 키 */
  answerKey: keyof QuizAnswers;
  /** "1단계 · 분위기" */
  stepLabel: string;
  question: string;
  choices: QuizChoiceData[];
};
