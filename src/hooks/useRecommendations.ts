"use client";

import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/lib/storage";
import { rankPlaces, type EnginePlaceInput, type RankedPlace } from "@/lib/recommendEngine";
import { currentWeatherFromForecast, type KmaForecastItem } from "@/lib/kma";
import type { TripSetupLike, TripSetupMode } from "@/lib/tripSetupMode";
import type { RecommendedPlace } from "@/types/place";

/** 부산시청 좌표 — geolocation 실패 시 폴백(날씨 조회용, 거리 표시는 안 함) */
const BUSAN_CITY_HALL = { lat: 35.1796, lng: 129.0756 };

type EngineOutput = RankedPlace<RecommendedPlace & EnginePlaceInput>;

export type UseRecommendationsResult = {
  places: EngineOutput[];
  loading: boolean;
  error: string | null;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const cf8Code = localStorage.getItem(STORAGE_KEYS.cf8Code);
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

        // 실제 GPS 확보 여부를 구분한다 — 거리 표시는 폴백 좌표로 계산하면
        // 실제와 다른 값을 사실처럼 보여주게 되므로, 진짜 위치를 얻었을 때만 계산한다.
        const position = await getCurrentPosition().catch(() => null);
        const { lat, lng } = position ?? BUSAN_CITY_HALL;

        const [recommendRes, weatherRes] = await Promise.all([
          fetch("/api/recommend?limit=100"),
          fetch(`/api/weather?lat=${lat}&lng=${lng}&op=forecast`),
        ]);

        if (!recommendRes.ok) throw new Error("추천 목록을 불러오지 못했습니다");
        const candidates = (await recommendRes.json()) as (RecommendedPlace & EnginePlaceInput)[];

        let weather: "sunny" | "rainy" | "cloudy" = "sunny";
        if (weatherRes.ok) {
          const weatherBody = await weatherRes.json();
          const resolved = currentWeatherFromForecast(weatherBody.items as KmaForecastItem[]);
          if (resolved) weather = resolved;
        }

        const ranked = rankPlaces(candidates, {
          cf8Code,
          mode,
          tripSetup,
          weather,
          userLocation: position ?? undefined,
        });
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

function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation 미지원"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("위치 권한 거부")),
      { timeout: 5000 }
    );
  });
}
