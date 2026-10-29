"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useStoredSnapshot } from "@/hooks/useStoredSnapshot";
import { apiUrl } from "@/lib/apiBase";
import { cf8FitScoreFromCode } from "@/lib/cf8Match";
import { distanceMinutes } from "@/lib/distance";
import { fitBand } from "@/lib/placeDisplay";
import { readCf8Code } from "@/lib/storage";
import type { RecommendedPlace } from "@/types/place";

const squash = (s: string) => s.replace(/[\s()·]/g, "");

/**
 * 사이로 카탈로그(태깅된 120곳)와 잇는다. 카카오에서 찾은 곳 대부분은 카탈로그 밖이라
 * 이어지지 않고, 그런 곳은 적합도 라벨도 없다.
 */
export function useCatalog() {
  const tPlace = useTranslations("place");
  const cf8Code = useStoredSnapshot(readCf8Code, null);
  const [catalog, setCatalog] = useState<RecommendedPlace[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl("/api/recommend?limit=120"))
      .then((res) => (res.ok ? (res.json() as Promise<RecommendedPlace[]>) : []))
      .then((all) => {
        if (!cancelled) setCatalog(all);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * 이름이 맞고 걸어서 5분(약 400m) 안이면 같은 곳으로 본다.
   * 카카오 이름이 카탈로그 이름으로 **시작**해야 한다 — "러브이즈기빙하트베어 청사포점" 은 청사포가 아니다.
   */
  function matchCatalog(name: string, x: number, y: number): string | null {
    const n = squash(name);
    const hit = catalog.find(
      (p) =>
        p.mapX !== null && p.mapY !== null &&
        (squash(p.title).includes(n) || n.startsWith(squash(p.title))) &&
        distanceMinutes(y, x, p.mapY, p.mapX) <= 5,
    );
    return hit?.contentId ?? null;
  }

  const find = (contentId: string | null) =>
    contentId ? catalog.find((p) => p.contentId === contentId) : undefined;

  /** "아주 잘 맞음" · "잘 맞음" 만. "무난함" 은 달지 않는다 — 후보를 고르는 화면에서 낮은 등급은 이유 없이 깎아내린다 */
  function fitLabel(contentId: string | null): string | null {
    const place = find(contentId);
    if (!place || !cf8Code) return null;
    const band = fitBand(cf8FitScoreFromCode(cf8Code, place));
    return band && band !== "fair" ? tPlace(`fit.${band}`) : null;
  }

  return { matchCatalog, fitLabel };
}
