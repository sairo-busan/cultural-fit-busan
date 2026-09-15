/**
 * DB_03 CF8별 장소추천사유(gid=669135285) 적재 스크립트.
 *
 * S20 상세 화면의 유형별 추천 이유. PK = (CF8_CD, place_id) — 120곳 × 8유형 = 960행.
 * 이 시트도 물리명(영문)/논리명(한글) 이중 헤더라 place_id 컬럼이 "plc_"로 시작하는
 * 행만 데이터로 취급한다.
 *
 * _id를 `${cf8Code}:${placeId}`로 직접 지정해서 복합키 인덱스 없이도 upsert 멱등성을
 * 보장한다.
 *
 * Node에서 구글시트 export URL을 직접 부르면 최근 수정분이 안 반영된 스냅샷이 오는 문제가
 * 있어(scripts/lib/csv.ts 참고) 미리 받아둔 로컬 CSV를 읽는다. 최신본이 필요하면 먼저:
 *   curl -sL "https://docs.google.com/spreadsheets/d/1-6usA2CWMCKvUWf53SJRWwzkuvRBmwpE_H958bWAGWE/export?format=csv&gid=669135285" -o docs/_internal/scratch/DB03.csv
 *
 * 실행: node --env-file=.env.local --import tsx scripts/import-db03-reasons.ts
 */

import path from "node:path";
import { MongoClient } from "mongodb";
import { readSheetCsvFile, makeColumnReader, toStr } from "./lib/csv";

const CSV_PATH = path.join(__dirname, "..", "docs/_internal/scratch/DB03.csv");

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

const VALID_CF8_CODES = new Set(["CLD", "CLV", "CFD", "CFV", "ELD", "ELV", "EFD", "EFV"]);

async function main() {
  console.log(`DB_03 CF8별 추천사유 CSV 읽는 중... (${CSV_PATH})`);
  const rows = readSheetCsvFile(CSV_PATH);
  const header = rows[0]; // CF8_CD,place_id,recommendation_reason
  const col = makeColumnReader(header);

  const dataRows = rows
    .slice(1)
    .filter((r) => col(r, "place_id")?.trim().startsWith("plc_") && VALID_CF8_CODES.has(col(r, "CF8_CD")?.trim() ?? ""));
  console.log(`전체 ${dataRows.length}행 (기대값 960 = 120곳 × 8유형)`);

  const client = new MongoClient(mongoUri!);
  await client.connect();
  const placeByCf8 = client.db("cultural_fit_busan").collection("place_by_cf8");

  const writes = dataRows.map((row) => {
    const cf8Code = col(row, "CF8_CD")!.trim();
    const placeId = col(row, "place_id")!.trim();
    return {
      updateOne: {
        filter: { _id: `${cf8Code}:${placeId}` as unknown as never },
        update: {
          $set: {
            cf8Code,
            placeId,
            recommendationReason: toStr(col(row, "recommendation_reason")),
          },
        },
        upsert: true,
      },
    };
  });

  const result = await placeByCf8.bulkWrite(writes);
  console.log(`\n적재 완료: ${result.upsertedCount}건 신규, ${result.matchedCount}건 갱신`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
