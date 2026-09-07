/**
 * 상황보정 점수 추출 (FE-FEAT-005 Step 7).
 * 예시_CF8추천구조(gid=1126787505)의 동행/날씨/계절/시간대 점수 중 현재 상황에
 * 해당하는 값을 골라낸다. 이 탭이 아직 13건(해운대·센텀만) 샘플이라 실데이터는
 * 대부분 null — 로직만 미리 구현해두고 62건 채워지면 바로 동작한다.
 */

export type Companion = "solo" | "couple" | "friends" | "parents" | "kid" | "pet";
export type Weather = "sunny" | "rainy" | "cloudy";
export type Season = "spring" | "summer" | "fall" | "winter";
export type TimeOfDay = "morning" | "afternoon" | "evening";

export type PlaceSituationalScores = {
  companionScoreSolo: number | null;
  companionScoreCouple: number | null;
  companionScoreFriends: number | null;
  companionScoreParents: number | null;
  companionScoreKid: number | null;
  companionScorePet: number | null;
  weatherScoreSunny: number | null;
  weatherScoreRainy: number | null;
  weatherScoreCloudy: number | null;
  seasonScoreSpring: number | null;
  seasonScoreSummer: number | null;
  seasonScoreFall: number | null;
  seasonScoreWinter: number | null;
  timeScoreMorning: number | null;
  timeScoreAfternoon: number | null;
  timeScoreEvening: number | null;
};

const COMPANION_FIELD: Record<Companion, keyof PlaceSituationalScores> = {
  solo: "companionScoreSolo",
  couple: "companionScoreCouple",
  friends: "companionScoreFriends",
  parents: "companionScoreParents",
  kid: "companionScoreKid",
  pet: "companionScorePet",
};

/**
 * travelWith는 소피 쪽 타입상 복수선택 배열(single-select 전환 논의 중, PR#10).
 * 여러 개 선택된 경우 임시로 평균 처리 — 단일 선택으로 확정되면 이 분기 제거.
 */
export function selectCompanionScore(
  place: PlaceSituationalScores,
  companions: Companion[]
): number | null {
  const scores = companions
    .map((c) => place[COMPANION_FIELD[c]] ?? null)
    .filter((s): s is number => s !== null);
  if (scores.length === 0) return null;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

const WEATHER_FIELD: Record<Weather, keyof PlaceSituationalScores> = {
  sunny: "weatherScoreSunny",
  rainy: "weatherScoreRainy",
  cloudy: "weatherScoreCloudy",
};

export function selectWeatherScore(place: PlaceSituationalScores, weather: Weather): number | null {
  return place[WEATHER_FIELD[weather]] ?? null;
}

const SEASON_FIELD: Record<Season, keyof PlaceSituationalScores> = {
  spring: "seasonScoreSpring",
  summer: "seasonScoreSummer",
  fall: "seasonScoreFall",
  winter: "seasonScoreWinter",
};

export function selectSeasonScore(place: PlaceSituationalScores, season: Season): number | null {
  return place[SEASON_FIELD[season]] ?? null;
}

const TIME_FIELD: Record<TimeOfDay, keyof PlaceSituationalScores> = {
  morning: "timeScoreMorning",
  afternoon: "timeScoreAfternoon",
  evening: "timeScoreEvening",
};

export function selectTimeScore(place: PlaceSituationalScores, timeOfDay: TimeOfDay): number | null {
  return place[TIME_FIELD[timeOfDay]] ?? null;
}

/** 현재 날짜로 계절 자동 판단(서버 응답 대기 없이 클라이언트에서 바로 계산 가능) */
export function currentSeason(date: Date = new Date()): Season {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "fall";
  return "winter";
}

/**
 * ⚠️ 시간대 경계값은 시트에 명시된 근거 없음(CTX_NIGHT의 "18시부터"만 참고).
 * 통상적 3분할(06~12/12~18/18~24)로 임시 구현 — 확인되면 교체 필요.
 */
export function currentTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}
