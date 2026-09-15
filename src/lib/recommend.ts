import { getDb } from "@/lib/mongodb";
import type { RecommendedPlace, PlaceInfoItem } from "@/types/place";

/** places(TourAPI 정본) — contentId가 PK(_id) */
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
  /** ingest-places.ts가 무장애 API로 파생(9/11) */
  barrierFree?: boolean | null;
};

/** score_board(DB_01, Model B) — placeId가 PK */
type ScoreBoardDoc = {
  placeId: string;
  placeName: string | null;
  contentId: string | null;
  calmnessScore: number | null;
  energyScore: number | null;
  localScore: number | null;
  landmarkScore: number | null;
  stayDeeplyScore: number | null;
  diverseExperienceScore: number | null;
  soloScore: number | null;
  coupleFriendScore: number | null;
  parentsScore: number | null;
  kidsScore: number | null;
  petScore: number | null;
  sunnyScore: number | null;
  rainyScore: number | null;
  cloudyScore: number | null;
  springScore: number | null;
  summerScore: number | null;
  autumnScore: number | null;
  winterScore: number | null;
  morningScore: number | null;
  afternoonScore: number | null;
  eveningScore: number | null;
  indoorOutdoor: "INDOOR" | "OUTDOOR" | "MIXED" | null;
  petAllowed?: boolean | null;
};

/** place_info(DB_02) — placeId가 PK, S10 카드 한 줄용 */
type PlaceInfoDoc = {
  placeId: string;
  placeName: string | null;
  placeDesc: string | null;
  /** 9/15 시트 확장 — BE-FEAT-014에서 재적재해야 값이 채워짐, 그전엔 undefined */
  placeNameEn?: string | null;
  placeDescEn?: string | null;
};

/** place_by_cf8(DB_03) — (cf8Code, placeId)가 PK, S20 상세 유형별 이유 */
type PlaceByCf8Doc = {
  cf8Code: string;
  placeId: string;
  recommendationReason: string | null;
};

const INDOOR_OUTDOOR_MAP: Record<string, "indoor" | "outdoor" | "mixed"> = {
  INDOOR: "indoor",
  OUTDOOR: "outdoor",
  MIXED: "mixed",
};

export type RecommendParams = {
  contentTypeId?: string;
  limit?: number;
};

/**
 * Model B(9/10 회의) — 좌표는 서버로 전송받지 않는다. CF8 매칭·상황보정·정렬은
 * 전부 클라이언트(recommendEngine.ts)에서 수행 — 이 함수는 개인화 없이
 * score_board(DB_01) + place_info(DB_02) + place_by_cf8(DB_03) + places(TourAPI)를
 * 조인한 원본 후보 목록만 만든다.
 *
 * content_id가 없는 place_id는 이미지·좌표를 못 구해서 응답에서 뺀다(에린 확인 대기,
 * docs/decisions/2026-09-11_DB필드_확정.md — 9/14 기준 유나에게 채우기 요청함).
 */
export async function getRecommendations({
  contentTypeId,
  limit = 120,
}: RecommendParams): Promise<RecommendedPlace[]> {
  const db = await getDb();

  const [scoreBoards, placeInfos, reasonDocs] = await Promise.all([
    db.collection<ScoreBoardDoc>("score_board").find({}).toArray(),
    db.collection<PlaceInfoDoc>("place_info").find({}).toArray(),
    db.collection<PlaceByCf8Doc>("place_by_cf8").find({}).toArray(),
  ]);

  const infoByPlaceId = new Map(placeInfos.map((i) => [i.placeId, i]));

  const reasonByPlaceId = new Map<string, Record<string, string | null>>();
  for (const r of reasonDocs) {
    const bucket = reasonByPlaceId.get(r.placeId) ?? {};
    bucket[r.cf8Code] = r.recommendationReason;
    reasonByPlaceId.set(r.placeId, bucket);
  }

  const contentIds = scoreBoards.map((s) => s.contentId).filter((id): id is string => !!id);
  const placeDocs = await db
    .collection<PlaceDoc>("places")
    .find({ _id: { $in: contentIds } })
    .toArray();
  const placesByContentId = new Map(placeDocs.map((p) => [p._id, p]));

  const results: RecommendedPlace[] = [];

  for (const score of scoreBoards) {
    if (!score.contentId) continue; // content_id 없으면 이미지·좌표를 못 구함 — 스킵
    const place = placesByContentId.get(score.contentId);
    if (!place) continue; // places에 아직 적재 안 된 content_id

    if (contentTypeId && place.contentTypeId !== contentTypeId) continue;

    const info = infoByPlaceId.get(score.placeId);
    const weatherType = score.indoorOutdoor ? INDOOR_OUTDOOR_MAP[score.indoorOutdoor] : null;

    results.push({
      contentId: place._id,
      contentTypeId: place.contentTypeId,
      // 결정문서(2026-09-11_DB필드_확정.md) — 카드 제목은 DB_02 place_name이 정본.
      // TourAPI title("봉래산(부산)" 식)은 place_name이 아직 없을 때만 임시 대체(#19 리뷰).
      title: info?.placeName ?? place.title,
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

      weatherType,
      // DB_01 신규 컬럼(9/15 확정, 유나 태깅 대기) — 채워지기 전까지 null
      placeType: null,
      whyKo: info?.placeDesc ?? null,
      // 다국어(영/한) 확정, DB_02 place_desc_en도 120곳 채워짐(9/15) — BE-FEAT-014 재적재 전까지는 undefined→null
      whyEn: info?.placeDescEn ?? null,

      placeId: score.placeId,

      calmnessScore: score.calmnessScore,
      energyScore: score.energyScore,
      localScore: score.localScore,
      landmarkScore: score.landmarkScore,
      stayDeeplyScore: score.stayDeeplyScore,
      diverseExperienceScore: score.diverseExperienceScore,

      soloScore: score.soloScore,
      coupleFriendScore: score.coupleFriendScore,
      parentsScore: score.parentsScore,
      kidsScore: score.kidsScore,
      petScore: score.petScore,

      sunnyScore: score.sunnyScore,
      rainyScore: score.rainyScore,
      cloudyScore: score.cloudyScore,
      springScore: score.springScore,
      summerScore: score.summerScore,
      autumnScore: score.autumnScore,
      winterScore: score.winterScore,
      morningScore: score.morningScore,
      afternoonScore: score.afternoonScore,
      eveningScore: score.eveningScore,

      // TourAPI contenttypeid=39(음식점)로 자동 파생 — 유나 예외 오버라이드는 추후
      isRestaurant: place.contentTypeId === "39",
      barrierFree: place.barrierFree ?? null,
      petAllowed: score.petAllowed ?? null,

      reasonByCf8: reasonByPlaceId.get(score.placeId) ?? {},

      titleEn: info?.placeNameEn ?? null,

      // Fit 점수·근거는 클라이언트(recommendEngine.ts)가 계산
      fitScore: 0,
      reasons: [],
      tags: [],
      distanceMin: null,
    });

    if (results.length >= limit) break;
  }

  return results;
}
