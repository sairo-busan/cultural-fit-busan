/**
 * 상황보정 점수 추출 — Model B (9/10 회의 확정, DB_01 점수판 기준).
 *
 * 동행은 "선택한 컬럼들을 합산"이다 — 주 동행(혼자/친구·연인/부모님 중 최대 1) +
 * 아이 동반 시 아이 컬럼 + 반려동물 동반 시 반려동물 컬럼. 평균이 아니라 합산이고,
 * 소피의 `TripSetup`이 이미 `primaryCompanion`(단일) + `childWith`/`petWith`(불리언)로
 * 나뉘어 있어서 "친구/연인을 둘로 갈라 평균" 같은 변환이 필요 없다 — 값을 그대로 받는다.
 *
 * 동행 5컬럼은 CF6과 동일하게 0~3 구간으로 확정됐다(9/15) — 실제 부모님·반려동물
 * 데이터가 아직 2에 그치는 건 컬럼 스케일이 다른 게 아니라 그 축 값들이 낮게 나온
 * 것뿐이다. 그래서 만점도 CF8과 같은 방식으로 "고른 컬럼 수 × 3"이다(selectCompanionMax).
 *
 * 날씨·계절·시간대는 접속 시점 자동 산출이라 늘 단일 선택 — 컬럼 하나를 그대로 읽는다.
 */

export type PrimaryCompanion = "solo" | "friend_couple" | "parents";
export type Weather = "sunny" | "rainy" | "cloudy";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type TimeOfDay = "morning" | "afternoon" | "evening";

export type CompanionSelection = {
  primary: PrimaryCompanion | null;
  childWith: boolean;
  petWith: boolean;
};

export type PlaceSituationalScores = {
  soloScore: number | null;
  coupleFriendScore: number | null;
  parentsScore: number | null;
  kidsScore: number | null;
  petScore: number | null;
  sunnyScore: number | null;
  rainyScore: number | null;
  cloudyScore: number | null;
  springScore: number | null;
  summerScore: number | null;
  autumnScore: number | null;
  winterScore: number | null;
  morningScore: number | null;
  afternoonScore: number | null;
  eveningScore: number | null;
};

const PRIMARY_FIELD: Record<PrimaryCompanion, keyof PlaceSituationalScores> = {
  solo: "soloScore",
  friend_couple: "coupleFriendScore",
  parents: "parentsScore",
};

/**
 * 선택한 동행 컬럼들을 합산한다. 아무것도 선택 안 했으면(선택 화면 QUICK/건너뛰기)
 * null — finalScore.ts의 R031 재정규화가 이 축을 최종점수 계산에서 뺀다.
 */
export function selectCompanionScore(
  place: PlaceSituationalScores,
  selection: CompanionSelection
): number | null {
  const fields: (keyof PlaceSituationalScores)[] = [];
  if (selection.primary) fields.push(PRIMARY_FIELD[selection.primary]);
  if (selection.childWith) fields.push("kidsScore");
  if (selection.petWith) fields.push("petScore");

  const known = fields.map((f) => place[f]).filter((v): v is number => v !== null);
  if (fields.length === 0 || known.length === 0) return null;
  return known.reduce((sum, v) => sum + v, 0);
}

/**
 * selectCompanionScore가 실제로 합산한 컬럼 수 기준 만점(컬럼당 3점, cf8FitMax와 동일
 * 방식). 주 동행만 선택하면 3, +아이 6, +반려동물 6, 둘 다 9 — #20 PR 리뷰에서 지적된
 * "분모 8 고정" 문제를 해결한다.
 */
export function selectCompanionMax(
  place: PlaceSituationalScores,
  selection: CompanionSelection
): number {
  const fields: (keyof PlaceSituationalScores)[] = [];
  if (selection.primary) fields.push(PRIMARY_FIELD[selection.primary]);
  if (selection.childWith) fields.push("kidsScore");
  if (selection.petWith) fields.push("petScore");

  return fields.filter((f) => place[f] !== null).length * 3;
}

const WEATHER_FIELD: Record<Weather, keyof PlaceSituationalScores> = {
  sunny: "sunnyScore",
  rainy: "rainyScore",
  cloudy: "cloudyScore",
};

/** 날씨를 모르면(조회 실패) null — 날씨 축을 빼고 R031 로 재정규화된다 */
export function selectWeatherScore(place: PlaceSituationalScores, weather: Weather | null): number | null {
  return weather ? place[WEATHER_FIELD[weather]] ?? null : null;
}

const SEASON_FIELD: Record<Season, keyof PlaceSituationalScores> = {
  spring: "springScore",
  summer: "summerScore",
  autumn: "autumnScore",
  winter: "winterScore",
};

export function selectSeasonScore(place: PlaceSituationalScores, season: Season): number | null {
  return place[SEASON_FIELD[season]] ?? null;
}

const TIME_FIELD: Record<TimeOfDay, keyof PlaceSituationalScores> = {
  morning: "morningScore",
  afternoon: "afternoonScore",
  evening: "eveningScore",
};

export function selectTimeScore(place: PlaceSituationalScores, time: TimeOfDay): number | null {
  return place[TIME_FIELD[time]] ?? null;
}

/** 계절 경계는 임시(에린 재량, 9/11 확정 문서 참고) — 3~5월 봄, 6~8월 여름, 9~11월 가을, 12~2월 겨울 */
export function currentSeason(now: Date = new Date()): Season {
  const month = now.getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

/** 시간대 경계도 임시 — 6~12시 오전, 12~18시 오후, 18~24시(+0~6시) 저녁 */
export function currentTimeOfDay(now: Date = new Date()): TimeOfDay {
  const hour = now.getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}
