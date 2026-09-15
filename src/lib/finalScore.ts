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
 * 축별 만점(DB_01 실데이터 기준, 9/15 확정):
 *   CF8    = 고른 컬럼 수 × 3 (cf8Match.cf8FitMax) — 컬럼 하나가 UNKNOWN이면 만점도 줄어듦
 *   동행   = 고른 컬럼 수 × 3 (situationalScore.selectCompanionMax) — CF8과 동일 방식,
 *            동행 5컬럼도 CF6과 같은 0~3 구간으로 확정됐다(#20 PR 리뷰, 고정 8 폐기)
 *   날씨·계절·시간 = 5 (각 컬럼 만점이 5, 항상 단일 컬럼 그대로 읽음)
 */

const FIXED_AXIS_MAX = {
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
  cf8FitScore: number | null;
  /** cf8Match.cf8FitMax(code, place) — 고른 컬럼 수 × 3, cf8FitScore와 세트로 넘긴다 */
  cf8Max: number;
  companionScore: number | null;
  /** situationalScore.selectCompanionMax(place, selection) — 고른 컬럼 수 × 3 */
  companionMax: number;
  weatherScore: number | null; // 0~5
  seasonScore: number | null; // 0~5
  timeScore: number | null; // 0~5
};

export function normalize(value: number | null, max: number): number | null {
  if (value == null) return null;
  if (max === 0) return null; // 만점 0 = 합산한 컬럼이 없었다는 뜻, 점수도 null이어야 정상이지만 방어
  return (value / max) * 100;
}

/** CALC_04 비중 + R031 재정규화를 적용한 최종점수(0~100, 반올림 안 함 — 화면에서 처리) */
export function calculateFinalScore(input: FinalScoreInput): number | null {
  return weightedAverageWithReweight([
    { weight: CALC_04_WEIGHTS.cf8, value: normalize(input.cf8FitScore, input.cf8Max) },
    { weight: CALC_04_WEIGHTS.companion, value: normalize(input.companionScore, input.companionMax) },
    { weight: CALC_04_WEIGHTS.weather, value: normalize(input.weatherScore, FIXED_AXIS_MAX.weather) },
    { weight: CALC_04_WEIGHTS.season, value: normalize(input.seasonScore, FIXED_AXIS_MAX.season) },
    { weight: CALC_04_WEIGHTS.time, value: normalize(input.timeScore, FIXED_AXIS_MAX.time) },
  ]);
}
