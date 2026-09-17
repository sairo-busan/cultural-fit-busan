/**
 * guideSimpleEn·guideDetailEn·guideTipsRawEn 재번역 적재 (9/17 유나 최종본 기준).
 *
 * 9/17 유나가 시트 간단히/자세히/팁 원고를 전면 교체(import-db02-placeinfo.ts
 * 재실행으로 guideSimpleKo/guideDetailKo/guideTipsRawKo는 이미 갱신됨). 시트의
 * cultureGuideText_en은 옛 원고 기준이라 신뢰하지 않고(1건만 새로 반영, 나머지
 * 118건은 stale), 새 한글 원고를 LLM으로 다시 번역해 기존 영문 값을 덮어쓴다.
 *
 * 번역 데이터(scripts/data/guide_en_2026-09-17.json)는 재현 가능하게 레포에
 * 커밋해둔다 — 이 스크립트를 다시 돌릴 일이 생겨도(예: 다른 환경 재구축)
 * LLM을 다시 부를 필요 없이 그대로 재생시킬 수 있다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/refill-guide-en-new-draft.ts
 */

import path from "node:path";
import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

const DATA_PATH = path.join(__dirname, "data", "guide_en_2026-09-17.json");

type Entry = { placeId: string; simpleEn: string; detailEn: string; tipsEn: string };

async function main() {
  const entries: Entry[] = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  console.log(`적재 대상 ${entries.length}건`);

  const client = new MongoClient(mongoUri!);
  await client.connect();
  const placeInfo = client.db("cultural_fit_busan").collection("place_info");

  const writes = entries.map((e) => ({
    updateOne: {
      filter: { placeId: e.placeId },
      update: {
        $set: {
          guideSimpleEn: e.simpleEn,
          guideDetailEn: e.detailEn,
          guideTipsRawEn: e.tipsEn,
        },
      },
    },
  }));

  const result = await placeInfo.bulkWrite(writes);
  console.log(`적재 완료: ${result.matchedCount}건 갱신 (${writes.length}건 중)`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
