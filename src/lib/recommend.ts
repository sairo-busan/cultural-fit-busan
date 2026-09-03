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

export type RecommendParams = {
  contentTypeId?: string;
  limit?: number;
};

/**
 * BE-FEAT-006: 좌표는 서버로 전송받지 않는다(위치 정보 사용 리스크 검토 참고).
 * 거리 계산·정렬·CF8 매칭은 전부 클라이언트(FE-FEAT-003)에서 수행 — 이 함수는
 * places+placeTags를 조인한 목록만 제공한다.
 */
export async function getRecommendations({
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

      // Fit 점수·거리는 클라이언트(FE-FEAT-003)가 계산
      fitScore: 0,
      reasons: [],
      tags: [],
      distanceMin: null,
    };
  });

  return results.slice(0, limit);
}
