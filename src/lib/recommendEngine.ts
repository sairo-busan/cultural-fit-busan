/**
 * 추천엔진 조립 (FE-FEAT-005 Step 10) — Model B.
 * cf8Match·hardFilter·situationalScore·finalScore·tripSetupMode 5개 모듈을 엮어
 * /api/recommend가 준 후보 목록(개인화 없음)을 필터링·채점·정렬한다.
 *
 * 이 파일은 순수 함수만 담는다 — localStorage 읽기·fetch 같은 브라우저 I/O는
 * useRecommendations.ts가 담당하고, 여기는 입력을 전부 인자로 받는다.
 *
 * GPS·위치 관련 필드는 전부 제거됐다(9/10 회의 — 앱스토어 심사 리스크). 도보 분·거리
 * 표시는 없고, "근처 장소 추천"은 서버 쪽 별도 API(content_id 기준 거리 계산)로 뺐다.
 */

import { cf8FitScoreFromCode, cf8FitMaxFromCode, type PlaceCf8Scores } from "./cf8Match";
import { applyHardFilter, type PlaceForFilter } from "./hardFilter";
import {
  currentSeason,
  currentTimeOfDay,
  selectCompanionScore,
  selectCompanionMax,
  selectSeasonScore,
  selectTimeScore,
  selectWeatherScore,
  type PlaceSituationalScores,
  type Weather,
} from "./situationalScore";
import { calculateFinalScore } from "./finalScore";
import { resolveActiveFilters, type TripSetupLike, type TripSetupMode } from "./tripSetupMode";
import { generateReasons } from "./reasonText";

export type EngineContext = {
  cf8Code: string;
  mode: TripSetupMode;
  tripSetup: TripSetupLike | null;
  weather: Weather;
  now?: Date; // 테스트용 주입 지점, 생략하면 현재 시각
};

export type EnginePlaceInput = PlaceForFilter &
  PlaceSituationalScores &
  PlaceCf8Scores & {
    contentId: string | null;
    whyKo: string | null;
    whyEn: string | null;
    /** (CF8코드 → 문구) 8개 — S20 상세용, generateReasons가 아니라 pickDetailReason이 쓴다 */
    reasonByCf8?: Record<string, string | null>;
  };

export type RankedPlace<T extends EnginePlaceInput> = T & {
  fitScore: number;
  reasons: string[];
  /** 엑셀 RANK(AD,...,0)과 동일한 동점 처리 — 동점은 같은 순위, 다음 순위는 그만큼 건너뜀(1,2,2,4). */
  rank: number;
};

/**
 * 하드필터 통과한 장소만 남기고, CF8+상황보정 최종점수로 정렬한다.
 * finalScore가 null(모든 축이 UNKNOWN)인 장소는 0점으로 취급해 하위로 밀리되
 * 제외되지는 않는다.
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
    const hf = applyHardFilter(place, filters.hardFilter);
    if (hf.excluded) continue;

    const scoreInputs = {
      cf8FitScore: cf8FitScoreFromCode(context.cf8Code, place),
      cf8Max: cf8FitMaxFromCode(context.cf8Code, place),
      companionScore: selectCompanionScore(place, filters.companion),
      companionMax: selectCompanionMax(place, filters.companion),
      weatherScore: selectWeatherScore(place, context.weather),
      seasonScore: selectSeasonScore(place, season),
      timeScore: selectTimeScore(place, timeOfDay),
    };
    const finalScore = calculateFinalScore(scoreInputs);

    ranked.push({
      ...place,
      fitScore: finalScore ?? 0,
      reasons: generateReasons({ ...scoreInputs, whyKo: place.whyKo, whyEn: place.whyEn }),
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
