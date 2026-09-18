"use client";

import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "@/lib/apiBase";
import { isCf8Code } from "@/lib/cfp";
import { STORAGE_KEYS, readCf8Code } from "@/lib/storage";
import { rankPlaces, type EnginePlaceInput, type RankedPlace } from "@/lib/recommendEngine";
import {
  currentForecastSlot,
  currentWeatherFromForecast,
  currentTemperatureFromForecast,
  type KmaForecastItem,
  type WeatherBucket,
} from "@/lib/kma";
import type { TripSetupLike, TripSetupMode } from "@/lib/tripSetupMode";
import type { RecommendedPlace } from "@/types/place";

/** 대표 명소 점수 내림차순. 같은 점수는 넘겨받은 순서(상황 점수)를 그대로 둔다 */
function byLandmark<T extends { landmarkScore: number | null }>(ranked: T[]): T[] {
  return [...ranked].sort((a, b) => (b.landmarkScore ?? -1) - (a.landmarkScore ?? -1));
}

/**
 * 날씨 조회 기준점 — 부산시청.
 *
 * 추천 대상이 전부 부산이라 기상 격자가 사실상 하나다. 위치 권한을 물어 얻는
 * 정확도가 날씨 한 줄을 바꾸지 못하는데, 앱을 열자마자 뜨는 권한 팝업은
 * 그대로 비용이다. 그래서 묻지 않는다.
 *
 * 거리 표시는 이 좌표로 계산하지 않는다 — 사용자가 어디 있든 시청 기준 거리가
 * 나와 실제와 다른 값을 사실처럼 보여주게 된다.
 */
const BUSAN_CITY_HALL = { lat: 35.1796, lng: 129.0756 };

type EngineOutput = RankedPlace<RecommendedPlace & EnginePlaceInput>;

/** 목록을 못 받은 경우. 진단 여부와 무관하다 */
export type FeedError = "LOAD_FAILED";

export type UseRecommendationsResult = {
  places: EngineOutput[];
  loading: boolean;
  error: FeedError | null;
  /** 진단을 마쳤는가. 화면이 박스·정렬 라벨을 이 값 하나로 가른다 */
  hasTaste: boolean;
  /** 네트워크 실패에서 다시 불러온다 */
  retry: () => void;
  /** 화면에도 날씨를 보여줘야 해서 점수 보정에 쓴 값을 그대로 내준다 */
  weather: WeatherBucket | null;
  temperature: number | null;
  /** 위 두 값이 몇 시 예보인지. `{ date: "20260914", time: "1000" }` */
  forecastSlot: { date: string; time: string } | null;
};

/**
 * 클라이언트 추천엔진 훅(FE-FEAT-005 Step 10 — 브라우저 I/O 담당).
 * localStorage(cf8_code·trip_setup·trip_setup_mode) + geolocation + /api/recommend
 * + /api/weather를 모아서 rankPlaces(순수 로직)에 넘긴다.
 *
 * S10 화면 연결은 이 훅을 호출하는 쪽(소피)에서 처리 — 이 파일은 훅만 제공한다.
 */
export function useRecommendations(): UseRecommendationsResult {
  const [places, setPlaces] = useState<EngineOutput[]>([]);
  const [hasTaste, setHasTaste] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FeedError | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [weatherState, setWeatherState] = useState<WeatherBucket | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [forecastSlot, setForecastSlot] = useState<
    { date: string; time: string } | null
  >(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        // 저장값이 깨졌으면(구 CFP16 코드 · 빈 문자열) 진단 전과 같게 본다.
        // 판정을 여기서만 하고 화면에 넘겨야 목록 순서와 머리말이 어긋나지 않는다.
        const stored = readCf8Code();
        const cf8Code = stored && isCf8Code(stored) ? stored : "";
        if (!cancelled) setHasTaste(cf8Code !== "");

        const modeRaw = localStorage.getItem(STORAGE_KEYS.tripSetupMode);
        const mode: TripSetupMode = modeRaw === "CUSTOM" ? "CUSTOM" : "QUICK";
        const tripSetupRaw = localStorage.getItem(STORAGE_KEYS.tripSetup);
        let tripSetup: TripSetupLike | null = null;
        try {
          tripSetup = tripSetupRaw ? JSON.parse(tripSetupRaw) : null;
        } catch {
          tripSetup = null;
        }

        const { lat, lng } = BUSAN_CITY_HALL;

        const [recommendRes, weatherRes] = await Promise.all([
          // 9/15 소피 리뷰 발견 — main 병합 중 120→100으로 되돌아가 20곳이 추천에서
          // 빠지는 문제. 정본 120곳 전체를 후보로 받아야 클라이언트 랭킹이 맞다.
          fetch(apiUrl("/api/recommend?limit=120")),
          fetch(apiUrl(`/api/weather?lat=${lat}&lng=${lng}&op=forecast`)),
        ]);

        if (!recommendRes.ok) throw new Error("추천 목록을 불러오지 못했습니다");
        const candidates = (await recommendRes.json()) as (RecommendedPlace & EnginePlaceInput)[];

        let weather: WeatherBucket = "sunny";
        if (weatherRes.ok) {
          const weatherBody = await weatherRes.json();
          const items = weatherBody.items as KmaForecastItem[];
          const resolved = currentWeatherFromForecast(items);
          if (resolved) weather = resolved;
          if (!cancelled) {
            setWeatherState(resolved);
            setTemperature(currentTemperatureFromForecast(items));
            setForecastSlot(currentForecastSlot(items));
          }
        }

        const ranked = rankPlaces(candidates, {
          cf8Code,
          mode,
          tripSetup,
          weather,
        });

        // 진단 전에는 CF8 점수가 없어 rankPlaces 가 상황 점수만으로 매긴다.
        // 그 순서를 동점 기준으로 두고 대표 명소 점수를 앞세운다.
        if (!cancelled) setPlaces(cf8Code ? ranked : byLandmark(ranked));
      } catch {
        if (!cancelled) setError("LOAD_FAILED");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return {
    places,
    loading,
    error,
    hasTaste,
    retry,
    weather: weatherState,
    temperature,
    forecastSlot,
  };
}
