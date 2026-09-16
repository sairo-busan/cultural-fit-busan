/**
 * 근처 장소 추천 (9/10 회의 — "이곳 대신 갈만한 곳" 대체, 코스 기능 스코프 아웃 후
 * 상세 화면에 한 줄로만). content_id → places 테이블 XY → haversine 거리 → 가까운 N곳.
 *
 * 사용자 GPS가 아니라 큐레이션된 120곳 사이의 고정 좌표 거리라 위치정보 원칙(서버로
 * 유저 좌표 전송 금지)과 무관하다 — 서버가 계산해도 되는 값이라 여기 둔다.
 */

import { getDb } from "@/lib/mongodb";
import { distanceMinutes } from "@/lib/distance";

type ScoreBoardRow = { placeId: string; contentId: string | null };
type PlaceRow = { _id: string; title: string; mapX: number; mapY: number; firstImage: string | null };
type PlaceInfoRow = {
  placeId: string;
  placeName: string | null;
  placeNameEn?: string | null;
  placeDesc: string | null;
  placeDescEn?: string | null;
};

/**
 * 이 분을 넘으면 "가까운 곳"이 아니라 그냥 "덜 먼 곳"이다 — 상위 N개를 무조건
 * 채우면 가덕도등대처럼 외곽에 있는 장소는 200분 넘게 떨어진 곳까지 나온다
 * (9/16, #31 S20 붙이며 발견 — BE-FEAT-012 티켓 QA 때도 272분 사례가 있었는데
 * 그때는 "정렬 자체는 맞다"로만 보고 넘어갔었다). 이 안에 아무것도 없으면
 * 빈 배열을 주고, 화면(PlaceContent.tsx Nearby)은 비면 섹션째 안 그린다.
 */
const MAX_NEARBY_DISTANCE_MIN = 60;

export type NearbyPlace = {
  contentId: string;
  placeId: string;
  title: string;
  firstImage: string | null;
  placeDesc: string | null;
  /** BE-FEAT-013 — S20 상세 화면이 언어별로 바로 쓴다 */
  nameKo: string;
  nameEn: string | null;
  descEn: string | null;
  /** 두 장소 고정 좌표 사이 도보 분 — 유저 위치 아님 */
  distanceMin: number;
};

/** contentId 기준 장소 하나에 대해, 큐레이션 120곳 중 가까운 N곳을 거리순으로. */
export async function getNearbyPlaces(contentId: string, limit = 3): Promise<NearbyPlace[]> {
  const db = await getDb();

  const scoreBoards = await db
    .collection<ScoreBoardRow>("score_board")
    .find({ contentId: { $ne: null } })
    .toArray();

  const contentIds = scoreBoards
    .map((s) => s.contentId)
    .filter((id): id is string => !!id);

  const [placeDocs, infoDocs] = await Promise.all([
    db.collection<PlaceRow>("places").find({ _id: { $in: contentIds } }).toArray(),
    db.collection<PlaceInfoRow>("place_info").find({}).toArray(),
  ]);

  const placesByContentId = new Map(placeDocs.map((p) => [p._id, p]));
  const infoByPlaceId = new Map(infoDocs.map((i) => [i.placeId, i]));

  const origin = placesByContentId.get(contentId);
  if (!origin) return [];

  const candidates: NearbyPlace[] = [];
  for (const score of scoreBoards) {
    if (!score.contentId || score.contentId === contentId) continue;
    const place = placesByContentId.get(score.contentId);
    if (!place) continue;

    const info = infoByPlaceId.get(score.placeId);
    candidates.push({
      contentId: place._id,
      placeId: score.placeId,
      title: place.title,
      firstImage: place.firstImage,
      placeDesc: info?.placeDesc ?? null,
      nameKo: info?.placeName ?? place.title,
      nameEn: info?.placeNameEn ?? null,
      descEn: info?.placeDescEn ?? null,
      distanceMin: distanceMinutes(origin.mapY, origin.mapX, place.mapY, place.mapX),
    });
  }

  const nearby = candidates.filter((c) => c.distanceMin <= MAX_NEARBY_DISTANCE_MIN);
  nearby.sort((a, b) => a.distanceMin - b.distanceMin);
  return nearby.slice(0, limit);
}
