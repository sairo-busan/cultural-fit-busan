/**
 * 최종점수(AD) 계산 — Model B (엑셀 점수판 CALC_04, 9/10 회의 확정).
 *
 * 엑셀 원 공식: `70×CF + 90×동행 + 54×날씨 + 36×계절 + 54×시간`, ÷18, ROUND.
 * 비중은 CF35% · 동행25% · 날씨15% · 계절10% · 시간15% (가중치 자체는 안 바뀜).
 *
 * 원 공식은 "점수 그대로 더해서 나누기"라 축이 하나라도 없으면(R031) 재정규화가
 * 안 된다. 그래서 축마다 0~100으로 먼저 정규화한 뒤(`값 / 그 축 만점 × 100`)
 * CALC_04 비중으로 가중평균한다 — 결과는 전부 있을 때 원 공식과 동일하고, 축이
 * 없을 때만 R031대로 남은 비중으로 재정규화된다(기존 `weightedAverageWithReweight`
 * 그대로 재사용).
 *
 * 축별 만점(DB_01 실데이터 기준):
 *   CF8    = 9   (0~3인 컬럼 3개 합산, 컬럼 만점이 항상 3이라 구조적으로 고정)
 *   날씨·계절·시간 = 5 (각 컬럼 만점이 5)
 *   동행   = 8   (주 동행 최대 3 + 아이 최대 3 + 반려동물 최대 2, 셋 다 겹치는 최악 케이스)
 *              ⚠️ 실제로는 대부분 주 동행 하나만 선택돼 만점 3에 그침 — 90×동행 항이
 *              날씨/계절/시간(만점 5)과 같은 급으로 설계된 원 공식과 안 맞는 지점.
 *              유나·태무 확인 대기(Sophie PR#15 "동행 점수 25%" 후속 제안과 동일 이슈).
 */

const AXIS_MAX = {
  cf8: 9,
  companion: 8,
  weather: 5,
  season: 5,
  time: 5,
} as const;

export const CALC_04_WEIGHTS = {
  cf8: 0.35,
  companion: 0.25,
  weather: 0.15,
  season: 0.1,
  time: 0.15,
} as const;

export type ScoreComponent = { weight: number; value: number | null };

/** null인 성분은 제외하고 남은 가중치 비율대로 재정규화한 가중평균. 전부 null이면 null. */
export function weightedAverageWithReweight(components: ScoreComponent[]): number | null {
  const available = components.filter(
    (c): c is { weight: number; value: number } => c.value != null && !Number.isNaN(c.value)
  );
  if (available.length === 0) return null;

  const totalWeight = available.reduce((sum, c) => sum + c.weight, 0);
  return available.reduce((sum, c) => sum + (c.weight / totalWeight) * c.value, 0);
}

export type FinalScoreInput = {
  cf8FitScore: number | null; // 0~9
  companionScore: number | null; // 0~8
  weatherScore: number | null; // 0~5
  seasonScore: number | null; // 0~5
  timeScore: number | null; // 0~5
};

function normalize(value: number | null, max: number): number | null {
  return value == null ? null : (value / max) * 100;
}

/** CALC_04 비중 + R031 재정규화를 적용한 최종점수(0~100, 반올림 안 함 — 화면에서 처리) */
export function calculateFinalScore(input: FinalScoreInput): number | null {
  return weightedAverageWithReweight([
    { weight: CALC_04_WEIGHTS.cf8, value: normalize(input.cf8FitScore, AXIS_MAX.cf8) },
    { weight: CALC_04_WEIGHTS.companion, value: normalize(input.companionScore, AXIS_MAX.companion) },
    { weight: CALC_04_WEIGHTS.weather, value: normalize(input.weatherScore, AXIS_MAX.weather) },
    { weight: CALC_04_WEIGHTS.season, value: normalize(input.seasonScore, AXIS_MAX.season) },
    { weight: CALC_04_WEIGHTS.time, value: normalize(input.timeScore, AXIS_MAX.time) },
  ]);
}
