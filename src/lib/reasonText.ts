/**
 * 추천이유 문장 생성 (FE-FEAT-005, 04_추천로직 R060).
 * "최강 일치축 + why_ko → 근거 1문장 생성" — LLM 없이 룰 기반, placeTags에
 * 이미 사전 생성·DB화된 문구(whyKo/whyEn)를 조합만 한다. 서버 왕복 불필요 —
 * /api/recommend 응답에 whyKo 등이 이미 포함돼 있어 클라이언트에서 바로 계산.
 */

export type ReasonInput = {
  cf8FitScore: number | null;
  companionScore: number | null;
  weatherScore: number | null;
  seasonScore: number | null;
  timeScore: number | null;
  whyKo: string | null;
  whyEn: string | null;
};

type ComponentKey = "cf8" | "companion" | "weather" | "season" | "time";

const COMPONENT_LABEL_KO: Record<ComponentKey, string> = {
  cf8: "취향",
  companion: "동행",
  weather: "날씨",
  season: "계절",
  time: "시간대",
};

/** "최강 일치축" — null 아닌 성분 중 점수가 가장 높은 축 하나를 고른다. */
function findStrongestComponent(input: ReasonInput): ComponentKey | null {
  const components: { key: ComponentKey; value: number | null }[] = [
    { key: "cf8", value: input.cf8FitScore },
    { key: "companion", value: input.companionScore },
    { key: "weather", value: input.weatherScore },
    { key: "season", value: input.seasonScore },
    { key: "time", value: input.timeScore },
  ];

  const available = components.filter(
    (c): c is { key: ComponentKey; value: number } => c.value !== null && !Number.isNaN(c.value)
  );
  if (available.length === 0) return null;

  return available.reduce((max, c) => (c.value > max.value ? c : max)).key;
}

/**
 * S10 카드용 reasons 배열 생성. whyKo가 있으면 그대로 1순위, 없으면 최강
 * 일치축 기반 기본 문장으로 대체. 과장·평점 추정 금지(R060) — 원문 그대로만 사용.
 */
export function generateReasons(input: ReasonInput): string[] {
  const reasons: string[] = [];

  if (input.whyKo) {
    reasons.push(input.whyKo);
  } else {
    const strongest = findStrongestComponent(input);
    if (strongest) {
      reasons.push(`${COMPONENT_LABEL_KO[strongest]} 조건과 잘 맞아요`);
    }
  }

  return reasons;
}
