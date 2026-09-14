"use client";

import { useEffect, useState } from "react";
import { readCf8Code, STORAGE_KEYS } from "@/lib/storage";
import { rankPlaces, type EnginePlaceInput, type RankedPlace } from "@/lib/recommendEngine";
import { currentWeatherFromForecast, type KmaForecastItem } from "@/lib/kma";
import type { TripSetupLike, TripSetupMode } from "@/lib/tripSetupMode";
import type { RecommendedPlace } from "@/types/place";

type EngineOutput = RankedPlace<RecommendedPlace & EnginePlaceInput>;

export type UseRecommendationsResult = {
  places: EngineOutput[];
  loading: boolean;
  error: string | null;
};

/**
 * 클라이언트 추천엔진 훅 — Model B.
 * localStorage(cf8_code·trip_setup·trip_setup_mode) + /api/recommend + /api/weather를
 * 모아서 rankPlaces(순수 로직)에 넘긴다.
 *
 * GPS는 안 쓴다(9/10 회의 — 앱 승인 지연 리스크). 날씨는 부산 고정 좌표로 서버가
 * 조회하므로 여기서 위치 파라미터를 안 보낸다.
 */
export function useRecommendations(): UseRecommendationsResult {
  const [places, setPlaces] = useState<EngineOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const cf8Code = readCf8Code();
        if (!cf8Code) {
          if (!cancelled) {
            setError("CF8 진단이 필요합니다");
            setLoading(false);
          }
          return;
        }

        const modeRaw = localStorage.getItem(STORAGE_KEYS.tripSetupMode);
        const mode: TripSetupMode = modeRaw === "CUSTOM" ? "CUSTOM" : "QUICK";
        const tripSetupRaw = localStorage.getItem(STORAGE_KEYS.tripSetup);
        let tripSetup: TripSetupLike | null = null;
        try {
          tripSetup = tripSetupRaw ? JSON.parse(tripSetupRaw) : null;
        } catch {
          tripSetup = null;
        }

        const [recommendRes, weatherRes] = await Promise.all([
          fetch("/api/recommend?limit=120"),
          fetch("/api/weather?op=forecast"),
        ]);

        if (!recommendRes.ok) throw new Error("추천 목록을 불러오지 못했습니다");
        const candidates = (await recommendRes.json()) as (RecommendedPlace & EnginePlaceInput)[];

        let weather: "sunny" | "rainy" | "cloudy" = "sunny";
        if (weatherRes.ok) {
          const weatherBody = await weatherRes.json();
          const resolved = currentWeatherFromForecast(weatherBody.items as KmaForecastItem[]);
          if (resolved) weather = resolved;
        }

        const ranked = rankPlaces(candidates, { cf8Code, mode, tripSetup, weather });
        if (!cancelled) setPlaces(ranked);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return { places, loading, error };
}
