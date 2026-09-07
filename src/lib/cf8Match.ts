/**
 * CF8 3축 취향 매칭 (03A-2_CF점수기준 CALC_01~03).
 * 공식: axis_match_score = 50 + 25 × user_axis × place_axis (0~100)
 *       cf_fit_score(Y) = 3축 평균
 * 12_CF8매칭검증(gid=319874358) 실데이터로 재검증 완료(40계단 문화관광테마거리 기준
 * CLD=50, CLV=83.3, CFD=50 — 전부 일치).
 */

export type Cf8Code = "CLD" | "CLV" | "CFD" | "CFV" | "ELD" | "ELV" | "EFD" | "EFV";

export type UserAxes = {
  atmosphere: -1 | 1; // C(차분함)=-1, E(에너지)=+1
  place: -1 | 1; // L(로컬)=-1, F(대표명소)=+1
  pace: -1 | 1; // D(깊게 머무름)=-1, V(다양하게 경험)=+1
};

export type PlaceAxisScores = {
  cfAtmosphereScore: number | null; // -2~+2
  cfLocalFamousScore: number | null;
  cfDeepVarietyScore: number | null;
};

/** "CLD" → {atmosphere:-1, place:-1, pace:-1} 등 3글자 CF8 코드를 축값으로 변환 */
export function parseCf8Code(code: Cf8Code): UserAxes {
  return {
    atmosphere: code[0] === "C" ? -1 : 1,
    place: code[1] === "L" ? -1 : 1,
    pace: code[2] === "D" ? -1 : 1,
  };
}

function axisMatchScore(userAxis: -1 | 1, placeAxis: number): number {
  return 50 + 25 * userAxis * placeAxis;
}

/**
 * 3축 중 장소 점수가 null(UNKNOWN)인 축은 제외하고 나머지로 평균한다
 * (04_추천로직 R031: UNKNOWN 축은 제외 후 재정규화, NONE 값으로 대체 금지).
 * 3축 전부 null이면 매칭 불가로 null 반환.
 */
export function cf8FitScore(userAxes: UserAxes, place: PlaceAxisScores): number | null {
  const pairs: [number, number | null][] = [
    [userAxes.atmosphere, place.cfAtmosphereScore ?? null],
    [userAxes.place, place.cfLocalFamousScore ?? null],
    [userAxes.pace, place.cfDeepVarietyScore ?? null],
  ];

  const scores = pairs
    .filter((pair): pair is [number, number] => pair[1] !== null)
    .map(([userAxis, placeAxis]) => axisMatchScore(userAxis as -1 | 1, placeAxis));

  if (scores.length === 0) return null;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

/** cf8Code 문자열(예: "EFV")로 바로 계산하는 헬퍼 */
export function cf8FitScoreFromCode(cf8Code: string, place: PlaceAxisScores): number | null {
  if (!/^[CE][LF][DV]$/.test(cf8Code)) return null;
  return cf8FitScore(parseCf8Code(cf8Code as Cf8Code), place);
}
