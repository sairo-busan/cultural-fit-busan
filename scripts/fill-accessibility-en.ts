/**
 * place_info.accessibilityInfoEn 채우기 (Phase 4, LLM 번역).
 *
 * TourAPI 무장애여행(KorWithService2)은 영문 서비스 자체가 없다(에린 확인,
 * BE-FEAT-013 Context) — 그래서 places.accessibilityInfo(한국어)를 LLM으로
 * 직접 번역해 place_info.accessibilityInfoEn(같은 키 구조)에 저장한다.
 * 260개 값이 174개 고유 문구로만 구성돼 있어 문구 단위로 매핑했다.
 *
 * 번역 당시의 원본(JSON 문자열)을 accessibilityInfoSourceKo에 저장 —
 * check-stale-en-fields.ts가 매주 재적재 후 이 스냅샷과 대조한다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/fill-accessibility-en.ts
 */

import path from "node:path";
import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

const DATA_PATH = path.join(__dirname, "data", "accessibility_en_2026-09-17.json");

type ScoreBoardRow = { placeId: string; contentId: string };
type PlaceWithAccess = { _id: string; accessibilityInfo: Record<string, string> | null };

async function main() {
  const dict = JSON.parse(readFileSync(DATA_PATH, "utf-8")) as Record<string, string>;

  const client = new MongoClient(mongoUri!);
  await client.connect();
  const db = client.db("cultural_fit_busan");

  const scoreBoardDocs = await db
    .collection<ScoreBoardRow>("score_board")
    .find({}, { projection: { _id: 0, placeId: 1, contentId: 1 } })
    .toArray();
  const placeIdByContentId = new Map(scoreBoardDocs.map((d) => [d.contentId, d.placeId]));

  const contentIds = Array.from(placeIdByContentId.keys());
  const withAccess = await db
    .collection<PlaceWithAccess>("places")
    .find(
      { _id: { $in: contentIds }, accessibilityInfo: { $exists: true, $ne: null } },
      { projection: { accessibilityInfo: 1 } }
    )
    .toArray();

  const placeInfo = db.collection("place_info");
  let ok = 0;
  const unmatched: string[] = [];

  for (const p of withAccess) {
    const placeId = placeIdByContentId.get(p._id);
    if (!placeId || !p.accessibilityInfo) continue;

    const entries = Object.entries(p.accessibilityInfo).filter(
      ([k, v]) => k !== "contentid" && typeof v === "string" && v.trim() !== ""
    );
    if (entries.length === 0) continue;

    const accessibilityInfoEn: Record<string, string> = {};
    let allMatched = true;
    for (const [k, v] of entries) {
      const en = dict[(v as string).trim()];
      if (!en) {
        unmatched.push(`${p._id} [${k}] ${JSON.stringify(v)}`);
        allMatched = false;
        continue;
      }
      accessibilityInfoEn[k] = en;
    }
    if (!allMatched) continue;

    await placeInfo.updateOne(
      { placeId },
      {
        $set: {
          accessibilityInfoEn,
          accessibilityInfoSourceKo: JSON.stringify(p.accessibilityInfo),
        },
      }
    );
    ok++;
  }

  console.log(`accessibilityInfoEn 적재: ${ok}곳`);
  if (unmatched.length > 0) console.log("매칭 실패:", unmatched);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
