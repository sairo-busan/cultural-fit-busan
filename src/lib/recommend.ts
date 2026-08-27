import { getDb } from "@/lib/mongodb";
import type { RecommendedPlace, PlaceInfoItem } from "@/types/place";

type PlaceDoc = {
  _id: string;
  contentTypeId: string;
  title: string;
  addr1: string;
  addr2: string;
  mapX: number;
  mapY: number;
  firstImage: string | null;
  images?: string[];
  homepage: string | null;
  overview: string | null;
  tel: string | null;
  cpyrhtDivCd: string | null;
  info?: PlaceInfoItem[];
  eventStartDate?: string;
  eventEndDate?: string;
};

type PlaceTagsDoc = {
  contentId: string;
  noiseLevel: number | null;
  crowdLevel: number | null;
  crowdPeak: string | null;
  crowdCalm: string | null;
  localDepth: number | null;
  englishSupport: number | null;
  spiceLevel: number | null;
  weatherType: "indoor" | "outdoor" | "both" | null;
  bestTime: string | null;
  placeType: "식음형" | "시장형" | "해양야경형" | "문화역사형" | null;
  fitSolo: number | null;
  tipType: string | null;
  tipHeadline: string | null;
  pro: string | null;
  con: string | null;
  whyKo: string | null;
  whyEn: string | null;
  coverage: number;
};

const EMPTY_TAGS: Omit<PlaceTagsDoc, "contentId"> = {
  noiseLevel: null,
  crowdLevel: null,
  crowdPeak: null,
  crowdCalm: null,
  localDepth: null,
  englishSupport: null,
  spiceLevel: null,
  weatherType: null,
  bestTime: null,
  placeType: null,
  fitSolo: null,
  tipType: null,
  tipHeadline: null,
  pro: null,
  con: null,
  whyKo: null,
  whyEn: null,
  coverage: 0,
};

/** 추천_알고리즘_명세서_v2.md 5번 섹션: haversine → 80m/분 */
function distanceMinutes(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // 지구 반지름(m)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const meters = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return meters / 80; // 80m/분
}

export type RecommendParams = {
  lat: number;
  lng: number;
  contentTypeId?: string;
  limit?: number;
};

/**
 * Phase 1: Hard Filter(좌표 유효성) + 거리순 정렬.
 * Coverage 게이트는 의도적으로 비활성 — placeTags가 아직 비어있어서 켜면 0건이 됨.
 * placeTags 데이터가 들어오면 BE-FEAT-004에서 CFP 축 점수·Coverage 필터를 얹는다.
 */
export async function getRecommendations({
  lat,
  lng,
  contentTypeId,
  limit = 20,
}: RecommendParams): Promise<RecommendedPlace[]> {
  const db = await getDb();

  const query: Record<string, unknown> = {
    mapX: { $type: "number" },
    mapY: { $type: "number" },
  };
  if (contentTypeId) query.contentTypeId = contentTypeId;

  const placeDocs = await db.collection<PlaceDoc>("places").find(query).toArray();

  const contentIds = placeDocs.map((p) => p._id);
  const tagDocs = await db
    .collection<PlaceTagsDoc>("placeTags")
    .find({ contentId: { $in: contentIds } })
    .toArray();
  const tagsByContentId = new Map(tagDocs.map((t) => [t.contentId, t]));

  const results: RecommendedPlace[] = placeDocs.map((place) => {
    const tags = tagsByContentId.get(place._id) ?? EMPTY_TAGS;

    return {
      contentId: place._id,
      contentTypeId: place.contentTypeId,
      title: place.title,
      addr1: place.addr1,
      addr2: place.addr2,
      mapX: place.mapX,
      mapY: place.mapY,
      firstImage: place.firstImage,
      images: place.images ?? [],
      homepage: place.homepage,
      overview: place.overview,
      tel: place.tel,
      cpyrhtDivCd: place.cpyrhtDivCd,
      info: place.info ?? [],
      eventStartDate: place.eventStartDate ?? null,
      eventEndDate: place.eventEndDate ?? null,

      noiseLevel: tags.noiseLevel,
      crowdLevel: tags.crowdLevel,
      crowdPeak: tags.crowdPeak,
      crowdCalm: tags.crowdCalm,
      localDepth: tags.localDepth,
      englishSupport: tags.englishSupport,
      spiceLevel: tags.spiceLevel,
      weatherType: tags.weatherType,
      bestTime: tags.bestTime,
      placeType: tags.placeType,
      fitSolo: tags.fitSolo,
      tipType: tags.tipType,
      tipHeadline: tags.tipHeadline,
      pro: tags.pro,
      con: tags.con,
      whyKo: tags.whyKo,
      whyEn: tags.whyEn,
      coverage: tags.coverage,

      // Fit 점수 계산은 BE-FEAT-004(placeTags 데이터 들어온 후)
      fitScore: 0,
      reasons: [],
      tags: [],
      distanceMin: Math.round(distanceMinutes(lat, lng, place.mapY, place.mapX)),
    };
  });

  results.sort((a, b) => (a.distanceMin ?? Infinity) - (b.distanceMin ?? Infinity));
  return results.slice(0, limit);
}
