/**
 * guideEn → guideDetailEn 필드명 이전 (도슨트 구조 변경).
 *
 * 값은 그대로 복사만 한다. 기존 guideEn 필드는 소피가 PlaceContent.tsx에서
 * place.guideEn 참조를 guideDetailEn으로 바꾸기 전까지 삭제하지 않는다(화면
 * 깨짐 방지) — 소피 PR 머지 후 별도 정리 커밋에서 제거.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/migrate-guide-en-to-detail-en.ts
 */

import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

async function main() {
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const placeInfo = client.db("cultural_fit_busan").collection("place_info");

  const docs = await placeInfo
    .find({ guideEn: { $ne: null } }, { projection: { _id: 0, placeId: 1, guideEn: 1 } })
    .toArray();

  const writes = docs.map((d: any) => ({
    updateOne: { filter: { placeId: d.placeId }, update: { $set: { guideDetailEn: d.guideEn } } },
  }));

  const result = await placeInfo.bulkWrite(writes);
  console.log(`적재 완료: ${result.modifiedCount}건 갱신 (${writes.length}건 중)`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
