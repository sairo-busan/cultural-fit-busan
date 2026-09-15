/**
 * 추천이유 문장 — Model B (9/10 회의 확정, docs/decisions/2026-09-11_DB필드_확정.md).
 *
 * 두 종류로 나뉜다 — 소스가 다르다:
 *   S10 피드 한 줄   `whyKo`(= DB_02.place_desc, 장소 단위 — 유형과 무관)
 *   S20 상세 이유    `reasonByCf8[cf8Code]`(= DB_03.recommendation_reason, (CF8코드×장소) 단위)
 *
 * whyKo가 placeTags.why_ko를 대체하면서 필드명은 그대로 뒀다 — PlaceRow.tsx 등
 * 화면 코드를 안 건드리기 위해서다(값의 출처만 DB_02로 바뀜, 9/14 PR#18 리뷰 코멘트).
 * LLM 없이 룰 기반, 서버가 이미 붙여서 내려준 문구를 조합만 한다(R060).
 */

export type ReasonInput = {
  cf8FitScore: number | null;
  cf8Max: number;
  companionScore: number | null;
  companionMax: number;
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

/** 축마다 만점이 달라(cf8=9~3, 동행=9~3, 날씨/계절/시간=5) 원점수로 비교하면 안 된다.
 * 0~100 정규화한 뒤 비교한다(#20 PR 리뷰 — cf7/9(78%) vs 날씨4/5(80%)를 원점수로
 * 비교하면 순서가 뒤집힘). */
const FIXED_MAX = 5; // 날씨·계절·시간

/** null 아닌 성분 중 정규화 점수가 가장 높은 축 하나를 고른다. */
function findStrongestComponent(input: ReasonInput): ComponentKey | null {
  const components: { key: ComponentKey; value: number | null; max: number }[] = [
    { key: "cf8", value: input.cf8FitScore, max: input.cf8Max },
    { key: "companion", value: input.companionScore, max: input.companionMax },
    { key: "weather", value: input.weatherScore, max: FIXED_MAX },
    { key: "season", value: input.seasonScore, max: FIXED_MAX },
    { key: "time", value: input.timeScore, max: FIXED_MAX },
  ];

  const available = components
    .filter((c) => c.value !== null && !Number.isNaN(c.value) && c.max > 0)
    .map((c) => ({ key: c.key, pct: (c.value as number) / c.max }));
  if (available.length === 0) return null;

  return available.reduce((max, c) => (c.pct > max.pct ? c : max)).key;
}

/**
 * S10 카드용 reasons 배열. whyKo(=place_desc)가 있으면 그대로 1순위, 없으면 최강
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

/**
 * S20 상세용 — 유저 CF8 코드에 해당하는 DB_03 문구를 고른다.
 * `reasonByCf8`는 서버가 (CF8코드×place_id) 960행을 place_id로 묶어 내려준 값 —
 * 서버는 유저 코드를 모르므로(개인정보 미전송 원칙) 8개를 다 받아 클라이언트에서 고른다.
 */
export function pickDetailReason(
  cf8Code: string,
  reasonByCf8: Record<string, string | null> | undefined
): string | null {
  return reasonByCf8?.[cf8Code] ?? null;
}
