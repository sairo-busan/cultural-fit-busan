/**
 * 최종점수(AD) 계산 (FE-FEAT-005 Step 8).
 * 03A-2_CF점수기준 CALC_04: CF8 35% + 동행 25% + 날씨 15% + 계절 10% + 시간대 15%
 * (DRAFT 상태 — 최종 확정 여부 확인 필요, docs/구글시트_데이터_감사.md §8 참고).
 *
 * 04_추천로직 R031: UNKNOWN(null)인 축은 제외하고 나머지 가중치로 재정규화한다.
 * 지금은 예시_CF8추천구조가 13건뿐이라 companion/weather/season/time이 대부분
 * null — CF8 매칭(Y) 100%로 계산되는 게 정상 동작이다.
 */

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
    (c): c is { weight: number; value: number } => c.value !== null
  );
  if (available.length === 0) return null;

  const totalWeight = available.reduce((sum, c) => sum + c.weight, 0);
  return available.reduce((sum, c) => sum + (c.weight / totalWeight) * c.value, 0);
}

export type FinalScoreInput = {
  cf8FitScore: number | null; // Y
  companionScore: number | null; // Z
  weatherScore: number | null; // AA
  seasonScore: number | null; // AB
  timeScore: number | null; // AC
};

/** CALC_04 가중치 + R031 재정규화를 적용한 최종점수(AD, 0~100) */
export function calculateFinalScore(input: FinalScoreInput): number | null {
  return weightedAverageWithReweight([
    { weight: CALC_04_WEIGHTS.cf8, value: input.cf8FitScore },
    { weight: CALC_04_WEIGHTS.companion, value: input.companionScore },
    { weight: CALC_04_WEIGHTS.weather, value: input.weatherScore },
    { weight: CALC_04_WEIGHTS.season, value: input.seasonScore },
    { weight: CALC_04_WEIGHTS.time, value: input.timeScore },
  ]);
}
