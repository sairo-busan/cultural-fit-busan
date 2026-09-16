/**
 * 이미 적재된 accessibilityInfo 값에서 "_카테고리명" 잔재를 제거하는 1회성
 * 마이그레이션(9/16, 소피 리뷰 발견 — ingest-places.ts는 이미 고쳤지만 재수집은
 * 외부 API를 다시 부르는 비용이라, 저장된 값만 문자열 치환으로 정리한다).
 * 정리 규칙은 ingest-places.ts의 cleanAccessibilityInfo()와 동일.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/clean-accessibility-info.ts
 */

import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

const CATEGORY_SUFFIXES = [
  "무장애 편의시설",
  "시각장애인 편의시설",
  "청각장애인 편의시설",
  "영유아 동반가족 편의시설",
];
const pattern = new RegExp(`_?(${CATEGORY_SUFFIXES.join("|")})`, "g");

function clean(value: string): string {
  return value.replace(pattern, " ").replace(/\s+/g, " ").trim();
}

async function main() {
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const places = client
    .db("cultural_fit_busan")
    .collection<{ _id: string; accessibilityInfo?: Record<string, string> | null }>("places");

  const docs = await places
    .find({ accessibilityInfo: { $ne: null } })
    .toArray();

  let changed = 0;
  for (const doc of docs) {
    if (!doc.accessibilityInfo) continue;
    const cleaned: Record<string, string> = {};
    let touched = false;
    for (const [key, value] of Object.entries(doc.accessibilityInfo)) {
      const next = typeof value === "string" ? clean(value) : value;
      cleaned[key] = next;
      if (next !== value) touched = true;
    }
    if (touched) {
      await places.updateOne({ _id: doc._id }, { $set: { accessibilityInfo: cleaned } });
      changed++;
    }
  }

  console.log(`정리 완료: ${docs.length}건 중 ${changed}건 값 변경`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
