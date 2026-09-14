/**
 * CF8 3축 취향 매칭 — Model B (9/10 회의 확정, 엑셀 점수판 기준).
 *
 * DB_01 점수판은 3개 축을 각각 두 컬럼으로 나눠 갖고 있다(차분함/에너지 ·
 * 로컬/대표명소 · 깊게머무름/다양하게경험, 각 0~3). 유저 CF8 코드 3글자가 가리키는
 * 컬럼 3개를 그대로 합산한다 — 반대 방향 페널티 없음(Model A의 "50+25×축곱" 공식은
 * 폐기됨).
 *
 * 예: 황령산이 차분함2·로컬2·깊게머무름3이면 CLD 유저에게 2+2+3=7점.
 */

export type Cf8Code = "CLD" | "CLV" | "CFD" | "CFV" | "ELD" | "ELV" | "EFD" | "EFV";

export type PlaceCf8Scores = {
  calmnessScore: number | null; // C
  energyScore: number | null; // E
  localScore: number | null; // L
  landmarkScore: number | null; // F
  stayDeeplyScore: number | null; // D
  diverseExperienceScore: number | null; // V
};

/** 코드 3글자가 가리키는 컬럼 3개를 순서대로 뽑는다. 컬럼 자체가 없으면(UNKNOWN) null. */
export function pickCf8Columns(code: Cf8Code, place: PlaceCf8Scores): (number | null)[] {
  return [
    code[0] === "C" ? place.calmnessScore : place.energyScore,
    code[1] === "L" ? place.localScore : place.landmarkScore,
    code[2] === "D" ? place.stayDeeplyScore : place.diverseExperienceScore,
  ];
}

/**
 * 3개 컬럼을 합산한다. 없는 컬럼은 R031(UNKNOWN 축 제외·재정규화)에 따라 빼고 나머지만
 * 더한다 — DB_01은 120곳 전부 6컬럼이 채워져 있어 실제로는 거의 안 벌어지는 경우다.
 * 전부 없으면 매칭 불가로 null.
 */
export function cf8FitScore(code: Cf8Code, place: PlaceCf8Scores): number | null {
  const known = pickCf8Columns(code, place).filter((v): v is number => v !== null);
  if (known.length === 0) return null;
  return known.reduce((sum, v) => sum + v, 0);
}

/** cf8Code 문자열(예: "EFV")로 바로 계산하는 헬퍼. 형식이 안 맞으면 null. */
export function cf8FitScoreFromCode(cf8Code: string, place: PlaceCf8Scores): number | null {
  if (!/^[CE][LF][DV]$/.test(cf8Code)) return null;
  return cf8FitScore(cf8Code as Cf8Code, place);
}
