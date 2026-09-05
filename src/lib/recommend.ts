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

export type RecommendParams = {
  contentTypeId?: string;
  limit?: number;
};

/**
 * BE-FEAT-006: 좌표는 서버로 전송받지 않는다(위치 정보 사용 리스크 검토 참고).
 * 거리 계산·정렬·CF8 매칭은 전부 클라이언트(FE-FEAT-005)에서 수행 — 이 함수는
 * places+placeTags를 조인한 목록만 제공한다.
 *
 * 후보는 placeTags가 있는 장소로 한정한다(태깅 안 된 곳은 추천하지 않는다는
 * 설계 원칙). PR#9 리뷰 지적 대응: 이전엔 places 2,231건 전체를 조회한 뒤
 * 정렬 없이 앞 N건만 잘라 반환해 "가까운 N곳"이 아니라 "적재 순서상 앞 N곳"이
 * 나가는 문제가 있었다 — 태깅된 곳(현재 49건)만 후보로 좁혀서 그 왜곡을 줄이고,
 * 조회량도 2,231건에서 태깅 건수로 줄인다. 실제 위치 기반 정렬은 CF8 엔진
 * 붙일 때(FE-FEAT-005) 클라이언트가 처리한다.
 */
export async function getRecommendations({
  contentTypeId,
  limit = 20,
}: RecommendParams): Promise<RecommendedPlace[]> {
  const db = await getDb();

  const tagDocs = await db.collection<PlaceTagsDoc>("placeTags").find({}).toArray();
  const tagsByContentId = new Map(tagDocs.map((t) => [t.contentId, t]));

  const query: Record<string, unknown> = {
    _id: { $in: tagDocs.map((t) => t.contentId) },
    mapX: { $type: "number" },
    mapY: { $type: "number" },
  };
  if (contentTypeId) query.contentTypeId = contentTypeId;

  const placeDocs = await db
    .collection<PlaceDoc>("places")
    .find(query)
    .limit(limit)
    .toArray();

  const results: RecommendedPlace[] = placeDocs.map((place) => {
    const tags = tagsByContentId.get(place._id)!;

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

      // Fit 점수·거리는 클라이언트(FE-FEAT-005)가 계산
      fitScore: 0,
      reasons: [],
      tags: [],
      distanceMin: null,
    };
  });

  return results;
}
