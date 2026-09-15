/**
 * DB_02 장소정보(gid=586403335) 적재 스크립트.
 *
 * S10 카드 한 줄 설명(place_desc)용. whyKo를 대체한다 — DB_01/place_desc가 있으면
 * 그걸 쓰고, 이 시트에 값이 없으면 null(화면은 place_desc 없을 때 장소명만 보여줌).
 *
 * 이 시트는 물리명 행(영문)과 논리명 행(한글) 두 줄짜리 헤더다 — 데이터는 3행부터.
 * place_id가 "plc_"로 시작하지 않는 행은 헤더든 빈 줄이든 전부 걸러낸다.
 *
 * Node에서 구글시트 export URL을 직접 부르면 최근 수정분이 안 반영된 스냅샷이 오는 문제가
 * 있어(scripts/lib/csv.ts 참고) 미리 받아둔 로컬 CSV를 읽는다. 최신본이 필요하면 먼저:
 *   curl -sL "https://docs.google.com/spreadsheets/d/1-6usA2CWMCKvUWf53SJRWwzkuvRBmwpE_H958bWAGWE/export?format=csv&gid=586403335" -o docs/_internal/scratch/DB02.csv
 *
 * 실행: node --env-file=.env.local --import tsx scripts/import-db02-placeinfo.ts
 */

import path from "node:path";
import { MongoClient } from "mongodb";
import { readSheetCsvFile, makeColumnReader, toStr } from "./lib/csv";

const CSV_PATH = path.join(__dirname, "..", "docs/_internal/scratch/DB02.csv");

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

async function main() {
  console.log(`DB_02 장소정보 CSV 읽는 중... (${CSV_PATH})`);
  const rows = readSheetCsvFile(CSV_PATH);
  const header = rows[0]; // 물리명(영문) 행 — place_id,place_name,place_desc
  const col = makeColumnReader(header);

  // rows[1]은 논리명(한글) 행 — place_id 칼럼에 "plc_"가 없으니 아래 필터에서 자동으로 빠짐
  const dataRows = rows.slice(1).filter((r) => col(r, "place_id")?.trim().startsWith("plc_"));
  console.log(`전체 ${dataRows.length}행`);

  const client = new MongoClient(mongoUri!);
  await client.connect();
  const placeInfo = client.db("cultural_fit_busan").collection("place_info");

  const writes = dataRows.map((row) => {
    const placeId = col(row, "place_id")!.trim();
    return {
      updateOne: {
        filter: { placeId },
        update: {
          $set: {
            placeId,
            placeName: toStr(col(row, "place_name")),
            placeDesc: toStr(col(row, "place_desc")),
          },
        },
        upsert: true,
      },
    };
  });

  const result = await placeInfo.bulkWrite(writes);
  console.log(`\n적재 완료: ${result.upsertedCount}건 신규, ${result.matchedCount}건 갱신`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
