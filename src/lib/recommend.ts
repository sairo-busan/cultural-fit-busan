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
  weatherType: "indoor" | "outdoor" | "mixed" | null;
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

  cf8Match: string | null;
  hasRaw: boolean | null;
  hasMeatOnly: boolean | null;
  hasSeafoodOnly: boolean | null;
  seatingType: "street" | "indoor" | "mixed" | null;
  fitCouple: number | null;
  fitFriends: number | null;
  fitFamily: number | null;
  stayMinutes: number | null;
  budgetLevel: number | null;
  proEn: string | null;
  conEn: string | null;
  infoKo: string | null;
  infoEn: string | null;
  sourceUrl: string | null;
  taggedStatus: "review" | "done" | null;
  alternativeIds: string[];

  placeId: string | null;

  cfAtmosphereScore: number | null;
  cfLocalFamousScore: number | null;
  cfDeepVarietyScore: number | null;

  photoMemoryValue: number | null;
  culturalValue: number | null;
  natureValue: number | null;
  foodValue: number | null;
  walkingRequired: number | null;
  restAvailability: number | null;
  indoorShelter: number | null;

  companionScoreSolo: number | null;
  companionScoreCouple: number | null;
  companionScoreFriends: number | null;
  companionScoreParents: number | null;
  companionScoreKid: number | null;
  companionScorePet: number | null;

  weatherScoreSunny: number | null;
  weatherScoreRainy: number | null;
  weatherScoreCloudy: number | null;
  seasonScoreSpring: number | null;
  seasonScoreSummer: number | null;
  seasonScoreFall: number | null;
  seasonScoreWinter: number | null;
  timeScoreMorning: number | null;
  timeScoreAfternoon: number | null;
  timeScoreEvening: number | null;

  petAllowed: boolean | null;
  wheelchairAccessible: boolean | null;
  strollerAccessible: boolean | null;
  stairsAlternative: boolean | null;
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

      cf8Match: tags.cf8Match,
      hasRaw: tags.hasRaw,
      hasMeatOnly: tags.hasMeatOnly,
      hasSeafoodOnly: tags.hasSeafoodOnly,
      seatingType: tags.seatingType,
      fitCouple: tags.fitCouple,
      fitFriends: tags.fitFriends,
      fitFamily: tags.fitFamily,
      stayMinutes: tags.stayMinutes,
      budgetLevel: tags.budgetLevel,
      proEn: tags.proEn,
      conEn: tags.conEn,
      infoKo: tags.infoKo,
      infoEn: tags.infoEn,
      sourceUrl: tags.sourceUrl,
      taggedStatus: tags.taggedStatus,
      alternativeIds: tags.alternativeIds,

      // 92번/CF8추천구조 미반영분 — 아래는 유나 확인 대기 중이라 DB에 키 자체가
      // 없을 수 있음. undefined면 JSON.stringify가 키를 통째로 지워버려 타입
      // 계약(T | null, 필수 필드)이 깨지므로 명시적으로 null 폴백
      placeId: tags.placeId ?? null,

      cfAtmosphereScore: tags.cfAtmosphereScore ?? null,
      cfLocalFamousScore: tags.cfLocalFamousScore ?? null,
      cfDeepVarietyScore: tags.cfDeepVarietyScore ?? null,

      photoMemoryValue: tags.photoMemoryValue ?? null,
      culturalValue: tags.culturalValue ?? null,
      natureValue: tags.natureValue ?? null,
      foodValue: tags.foodValue ?? null,
      walkingRequired: tags.walkingRequired ?? null,
      restAvailability: tags.restAvailability ?? null,
      indoorShelter: tags.indoorShelter ?? null,

      companionScoreSolo: tags.companionScoreSolo ?? null,
      companionScoreCouple: tags.companionScoreCouple ?? null,
      companionScoreFriends: tags.companionScoreFriends ?? null,
      companionScoreParents: tags.companionScoreParents ?? null,
      companionScoreKid: tags.companionScoreKid ?? null,
      companionScorePet: tags.companionScorePet ?? null,

      weatherScoreSunny: tags.weatherScoreSunny ?? null,
      weatherScoreRainy: tags.weatherScoreRainy ?? null,
      weatherScoreCloudy: tags.weatherScoreCloudy ?? null,
      seasonScoreSpring: tags.seasonScoreSpring ?? null,
      seasonScoreSummer: tags.seasonScoreSummer ?? null,
      seasonScoreFall: tags.seasonScoreFall ?? null,
      seasonScoreWinter: tags.seasonScoreWinter ?? null,
      timeScoreMorning: tags.timeScoreMorning ?? null,
      timeScoreAfternoon: tags.timeScoreAfternoon ?? null,
      timeScoreEvening: tags.timeScoreEvening ?? null,

      petAllowed: tags.petAllowed ?? null,
      wheelchairAccessible: tags.wheelchairAccessible ?? null,
      strollerAccessible: tags.strollerAccessible ?? null,
      stairsAlternative: tags.stairsAlternative ?? null,

      // Fit 점수·거리는 클라이언트(FE-FEAT-005)가 계산
      fitScore: 0,
      reasons: [],
      tags: [],
      distanceMin: null,
    };
  });

  return results;
}
