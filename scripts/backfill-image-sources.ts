/**
 * 이미 적재된 장소에 imageSources(사진별 공공누리 유형) 백필 (9/16).
 * detailImage2만 다시 부른다 — 전체 재수집(ingest-places.ts) 없이 사진 출처만 채운다.
 * 대상은 score_board(DB_01)에 있는 120곳 — S20 상세에서만 쓰는 데이터라 이걸로 충분.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/backfill-image-sources.ts
 */

import { MongoClient } from "mongodb";

const TOUR_API_BASE = "https://apis.data.go.kr/B551011/KorService2";
const serviceKey = process.env.TOUR_API_KEY;
const mongoUri = process.env.MONGODB_URI;
if (!serviceKey) throw new Error("TOUR_API_KEY가 설정되지 않았습니다");
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

type TourItem = Record<string, string>;

async function fetchImages(contentId: string): Promise<TourItem[]> {
  const search = new URLSearchParams({
    contentId,
    imageYN: "Y",
    serviceKey: serviceKey!,
    MobileOS: "ETC",
    MobileApp: "CulturalFitBusan",
    _type: "json",
  });
  const res = await fetch(`${TOUR_API_BASE}/detailImage2?${search.toString()}`);
  const body = await res.json();
  if (!res.ok || body.response?.header?.resultCode !== "0000") {
    throw new Error(`detailImage2 호출 실패: ${JSON.stringify(body.response?.header)}`);
  }
  const items = body.response.body.items;
  return items === "" ? [] : items.item;
}

async function main() {
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const db = client.db("cultural_fit_busan");
  const scoreBoards = await db.collection<{ contentId: string | null }>("score_board").find({}).toArray();
  const contentIds = scoreBoards.map((s) => s.contentId).filter((id): id is string => !!id);
  console.log(`대상 ${contentIds.length}곳`);

  const places = db.collection<{ _id: string }>("places");
  let ok = 0;
  let failed = 0;

  for (const contentId of contentIds) {
    try {
      const items = await fetchImages(contentId);
      const imageSources = items
        .filter((img) => img.originimgurl)
        .map((img) => ({ url: img.originimgurl, cpyrhtDivCd: img.cpyrhtDivCd || null }));
      await places.updateOne({ _id: contentId }, { $set: { imageSources } });
      ok++;
    } catch (err) {
      console.warn(`${contentId} 실패:`, (err as Error).message);
      failed++;
    }
  }

  console.log(`\n백필 완료: ${ok}건 성공, ${failed}건 실패`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
