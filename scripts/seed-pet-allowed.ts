/**
 * pet_allowed 시드 스크립트 (BE-FEAT-014).
 *
 * DB_01 시트에 `pet_allowed` 컬럼이 아직 없어서(유나 작업 전) score_board.petAllowed는
 * 전부 null이다. ingest-places.ts가 이미 반려동물동반여행 API(KorPetTourService2)로
 * `places.petFriendlyApi`를 파생해뒀으니(9/11), content_id로 조인해서 API로 확인된
 * 곳만 먼저 true로 채운다 — 이미 값이 있는 문서는 안 덮어쓴다(유나가 나중에 시트로
 * 직접 넣은 값을 이 스크립트가 지우면 안 됨).
 *
 * 실행: node --env-file=.env.local --import tsx scripts/seed-pet-allowed.ts
 */

import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

async function main() {
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const db = client.db("cultural_fit_busan");

  const scoreBoards = await db
    .collection("score_board")
    .find({ contentId: { $exists: true, $ne: null } })
    .toArray();

  const contentIds = scoreBoards.map((s) => s.contentId as string);
  const places = await db
    .collection<{ _id: string; petFriendlyApi?: boolean | null }>("places")
    .find({ _id: { $in: contentIds } })
    .project({ petFriendlyApi: 1 })
    .toArray();
  const petFriendlyByContentId = new Map(places.map((p) => [p._id, p.petFriendlyApi]));

  const writes = [];
  let alreadySet = 0;
  let stillUnknown = 0;

  for (const score of scoreBoards) {
    if (score.petAllowed !== undefined && score.petAllowed !== null) {
      alreadySet++;
      continue;
    }
    const petFriendlyApi = petFriendlyByContentId.get(score.contentId as string);
    if (petFriendlyApi === true) {
      writes.push({
        updateOne: {
          filter: { placeId: score.placeId },
          update: { $set: { petAllowed: true } },
        },
      });
    } else {
      stillUnknown++;
    }
  }

  if (writes.length > 0) {
    await db.collection("score_board").bulkWrite(writes);
  }

  console.log(
    `시드 완료: ${writes.length}곳 petAllowed=true로 신규 세팅` +
      `\n이미 값 있던 곳: ${alreadySet}곳(안 건드림)` +
      `\n여전히 UNKNOWN(유나 조사 필요): ${stillUnknown}곳`
  );

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
