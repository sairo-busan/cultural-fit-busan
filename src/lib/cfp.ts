/** S02 화면 표시용 임시 클라이언트 로직 */

import type {
  QuizAnswers,
  HardFilter,
  CfpAxes,
  CfpProfile,
  AtmosphereCode,
  PlaceTypeCode,
  PalateCode,
  PaceCode,
  AtmosphereAnswer,
  PlaceTypeAnswer,
  PalateAnswer,
  PaceAnswer,
  WalkingDistance,
} from "@/types/cfp";

// === 점수 매핑 (1-5 척도) ===

const ATMOSPHERE_SCORE: Record<AtmosphereAnswer, number> = {
  quiet: 1,
  both: 3,
  vivid: 5,
};

const PLACE_TYPE_SCORE: Record<PlaceTypeAnswer, number> = {
  familiar: 1,
  both: 3,
  local: 5,
};

const PALATE_SCORE: Record<PalateAnswer, number> = {
  mild: 1,
  both: 3,
  hot: 5,
};

const WALKING_DISTANCE_SCORE: Record<WalkingDistance, number> = {
  short: 1,
  medium: 3,
  long: 5,
};

const PACE_SCORE: Record<PaceAnswer, number> = {
  slow: 1,
  both: 3,
  walk: 5,
};

// === 16유형 메타데이터 ===

type CfpTypeMeta = {
  nameKo: string;
  nameEn: string;
  description: string;
};

const CFP_TYPES: Record<string, CfpTypeMeta> = {
  QLMS: { nameKo: "조용한 골목 산책자", nameEn: "Quiet Alley Wanderer", description: "사람 적은 현지 골목을 천천히 걷는 분입니다." },
  QLMW: { nameKo: "로컬 탐험 은둔자", nameEn: "Hidden Local Explorer", description: "조용한 현지 동네를 많이 걷는 분입니다." },
  QLHS: { nameKo: "고요한 미식 정착자", nameEn: "Still Flavor Seeker", description: "한적한 로컬 맛집에 오래 머무는 분입니다." },
  QLHW: { nameKo: "매운맛 골목 순례자", nameEn: "Spice Alley Pilgrim", description: "현지 매운맛을 찾아 걷는 분입니다." },
  QFMS: { nameKo: "느긋한 뷰 감상자", nameEn: "Slow View Watcher", description: "조용하고 편한 곳에서 풍경을 보는 분입니다." },
  QFMW: { nameKo: "조용한 명소 수집가", nameEn: "Quiet Landmark Collector", description: "익숙하고 조용한 곳을 두루 보는 분입니다." },
  QFHS: { nameKo: "한적한 맛집 애호가", nameEn: "Calm Table Lover", description: "편한 환경에서 매운맛을 여유롭게 즐기는 분입니다." },
  QFHW: { nameKo: "조용한 미식 산책자", nameEn: "Quiet Food Walker", description: "안내 잘 된 매운맛 집을 걸어서 찾는 분입니다." },
  VLMS: { nameKo: "시장 골목 미식가", nameEn: "Market Alley Gourmet", description: "북적이는 현지 시장에 머무는 분입니다." },
  VLMW: { nameKo: "활기찬 로컬 러너", nameEn: "Vivid Local Runner", description: "현지의 활기를 빠르게 훑는 분입니다." },
  VLHS: { nameKo: "매운맛 시장 정착자", nameEn: "Hot Market Settler", description: "시장 매운맛에 자리 잡는 분입니다." },
  VLHW: { nameKo: "로컬 미식 모험가", nameEn: "Local Taste Adventurer", description: "매운맛 현지 맛집을 여러 곳 도는 분입니다." },
  VFMS: { nameKo: "핫플 여유 감상자", nameEn: "Hotspot Relaxer", description: "인기 명소를 느긋하게 즐기는 분입니다." },
  VFMW: { nameKo: "인기 명소 순회자", nameEn: "Landmark Hopper", description: "유명한 곳을 부지런히 도는 분입니다." },
  VFHS: { nameKo: "활기찬 맛집 정착자", nameEn: "Lively Table Settler", description: "붐비는 맛집에 오래 머무는 분입니다." },
  VFHW: { nameKo: "부산 완주형 미식가", nameEn: "Busan Full-Course Foodie", description: "매운맛부터 야경까지 전부 즐기는 분입니다." },
};

// === 프리셋 (건너뛰기용) ===

export const CFP_PRESETS = {
  quiet: "QLMS",
  foodie: "VLHW",
  safe: "QFMS",
} as const;

// === 환산 로직 ===

/**
 * 6문항 응답 → 4축 점수 계산
 *
 * - Q1(동반인): 축 아님, 추천 컨텍스트로만 사용
 * - Q2(걷기여력) + Q5(체류): 평균 → Pace축
 * - Q3(분위기): Atmosphere축
 * - Q4(장소성향): LocalDepth축
 * - Q6(매운맛): Palate축
 *
 * 점수 3(중립)은 보수적 쪽(Q, F, M, S)으로 귀결
 */
export function calculateAxes(answers: QuizAnswers): CfpAxes {
  const atmosphereValue = answers.atmosphere
    ? ATMOSPHERE_SCORE[answers.atmosphere]
    : 3;

  const placeTypeValue = answers.placeType
    ? PLACE_TYPE_SCORE[answers.placeType]
    : 3;

  const palateValue = answers.palate ? PALATE_SCORE[answers.palate] : 3;

  const walkingValue = answers.walkingDistance
    ? WALKING_DISTANCE_SCORE[answers.walkingDistance]
    : 3;
  const paceValue = answers.pace ? PACE_SCORE[answers.pace] : 3;
  const paceAverage = Math.round((walkingValue + paceValue) / 2);

  return {
    atmosphere: {
      code: (atmosphereValue > 3 ? "V" : "Q") as AtmosphereCode,
      value: atmosphereValue,
    },
    placeType: {
      code: (placeTypeValue > 3 ? "L" : "F") as PlaceTypeCode,
      value: placeTypeValue,
    },
    palate: {
      code: (palateValue > 3 ? "H" : "M") as PalateCode,
      value: palateValue,
    },
    pace: {
      code: (paceAverage > 3 ? "W" : "S") as PaceCode,
      value: paceAverage,
    },
  };
}

/** 4축 코드 → CFP 4글자 유형 코드 */
export function getCfpTypeCode(axes: CfpAxes): string {
  return `${axes.atmosphere.code}${axes.placeType.code}${axes.palate.code}${axes.pace.code}`;
}

/** 유형 코드로 메타데이터 조회 */
export function getCfpTypeMeta(typeCode: string): CfpTypeMeta {
  return CFP_TYPES[typeCode] ?? CFP_TYPES["QFMS"];
}

/** 전체 프로필 빌드 */
export function buildCfpProfile(
  answers: QuizAnswers,
  hardFilter: HardFilter,
): CfpProfile {
  const axes = calculateAxes(answers);
  const typeCode = getCfpTypeCode(axes);
  const meta = getCfpTypeMeta(typeCode);

  return {
    typeCode,
    nameKo: meta.nameKo,
    nameEn: meta.nameEn,
    description: meta.description,
    axes,
    companion: answers.companion ?? "solo",
    walkingDistance: answers.walkingDistance ?? "medium",
    hardFilter,
  };
}
