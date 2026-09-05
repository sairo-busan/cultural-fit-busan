/**
 * 추천엔진 조립 (FE-FEAT-005 Step 10, 순수 로직 부분만).
 * cf8Match·hardFilter·situationalScore·finalScore·tripSetupMode 5개 모듈을 엮어
 * /api/recommend가 준 후보 목록을 필터링·채점·정렬한다.
 *
 * 이 파일은 순수 함수만 담는다 — localStorage 읽기·fetch·geolocation 같은 브라우저
 * I/O는 별도 훅(다음 단계)에서 담당하고, 여기는 입력을 전부 인자로 받는다.
 * 그래야 테스트할 때 실제 브라우저 없이 이 함수만 독립적으로 검증할 수 있다.
 */

import { cf8FitScoreFromCode, type PlaceAxisScores } from "./cf8Match";
import { applyHardFilter, matchesSoftFoodPreference, type PlaceForFilter } from "./hardFilter";
import {
  currentSeason,
  currentTimeOfDay,
  selectCompanionScore,
  selectSeasonScore,
  selectTimeScore,
  selectWeatherScore,
  type PlaceSituationalScores,
  type Weather,
} from "./situationalScore";
import { calculateFinalScore } from "./finalScore";
import { resolveActiveFilters, type TripSetupLike, type TripSetupMode } from "./tripSetupMode";
import { generateReasons } from "./reasonText";
import { distanceMinutes } from "./distance";

export type EngineContext = {
  cf8Code: string;
  mode: TripSetupMode;
  tripSetup: TripSetupLike | null;
  weather: Weather;
  now?: Date; // 테스트용 주입 지점, 생략하면 현재 시각
  /** 있으면 카드·상세 표시용 도보 분을 계산(순위엔 미반영). 없으면 distanceMin은 null. */
  userLocation?: { lat: number; lng: number };
};

export type EnginePlaceInput = PlaceForFilter &
  PlaceSituationalScores &
  PlaceAxisScores & {
    contentId: string;
    whyKo: string | null;
    whyEn: string | null;
    mapX: number;
    mapY: number;
  };

export type RankedPlace<T extends EnginePlaceInput> = T & {
  fitScore: number;
  matchesSoftFoodPreference: boolean;
  reasons: string[];
  distanceMin: number | null;
  /** 예시_CF8추천구조의 RANK(AD,...,0)과 동일한 동점 처리 — 동점은 같은 순위, 다음 순위는 그만큼 건너뜀(1,2,2,4). */
  rank: number;
};

/**
 * 하드필터 통과한 장소만 남기고, CF8+상황보정 최종점수로 정렬한다.
 * finalScore가 null(모든 축이 UNKNOWN)인 장소는 0점으로 취급해 하위로 밀리되
 * 제외되지는 않는다 — coverage 게이트를 이미 통과한 태깅 장소라서다.
 */
export function rankPlaces<T extends EnginePlaceInput>(
  candidates: T[],
  context: EngineContext
): RankedPlace<T>[] {
  const filters = resolveActiveFilters(context.mode, context.tripSetup);
  const season = currentSeason(context.now);
  const timeOfDay = currentTimeOfDay(context.now);

  const ranked: RankedPlace<T>[] = [];

  for (const place of candidates) {
    const hf = applyHardFilter(place, filters.foodRestrictions, filters.walkingDifficulties);
    if (hf.excluded) continue;

    const scoreInputs = {
      cf8FitScore: cf8FitScoreFromCode(context.cf8Code, place),
      companionScore: selectCompanionScore(place, filters.companions),
      weatherScore: selectWeatherScore(place, context.weather),
      seasonScore: selectSeasonScore(place, season),
      timeScore: selectTimeScore(place, timeOfDay),
    };
    const finalScore = calculateFinalScore(scoreInputs);

    ranked.push({
      ...place,
      fitScore: finalScore ?? 0,
      matchesSoftFoodPreference: matchesSoftFoodPreference(place, filters.foodRestrictions),
      reasons: generateReasons({ ...scoreInputs, whyKo: place.whyKo, whyEn: place.whyEn }),
      distanceMin: context.userLocation
        ? distanceMinutes(
            context.userLocation.lat,
            context.userLocation.lng,
            place.mapY,
            place.mapX
          )
        : null,
      rank: 0, // 정렬 후 아래서 채움
    });
  }

  ranked.sort((a, b) => b.fitScore - a.fitScore);

  // RANK(AD,...,0) 동일 규칙: 동점은 같은 순위, 다음 순위는 동점 개수만큼 건너뜀
  ranked.forEach((p, i) => {
    p.rank = i > 0 && ranked[i - 1].fitScore === p.fitScore ? ranked[i - 1].rank : i + 1;
  });

  return ranked;
}
