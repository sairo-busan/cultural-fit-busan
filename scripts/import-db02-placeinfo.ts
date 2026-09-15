/**
 * DB_02 장소정보(gid=586403335) 적재 스크립트.
 *
 * S10 카드 한 줄 설명(place_desc)용. whyKo를 대체한다 — DB_01/place_desc가 있으면
 * 그걸 쓰고, 이 시트에 값이 없으면 null(화면은 place_desc 없을 때 장소명만 보여줌).
 *
 * 9/15 시트에 6칸 추가됨(BE-FEAT-014) — 영문 이름·설명 + 문화가이드 4종. "놓치기 쉬운
 * 것"은 "관람 순서/사진 포인트/유의사항" 3줄이 한 칸에 들어있는데, 라벨별로 나누지
 * 않고 원문 그대로 저장한다(시트 원본 표기 그대로 저장 원칙, #20 PR 리뷰) — 나누는 건
 * BE-FEAT-013(장소 상세 API) 계약에서 한다.
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

const REQUIRED_HEADERS = [
  "place_id",
  "place_name",
  "place_name_en",
  "place_desc",
  "place_desc_en",
  "cultureGuideText_ko (도슨트_간단히)",
  "cultureGuideText_ko (도슨트_자세히)",
  "cultureGuideText_ko(놓치기 쉬운 것)",
  "cultureGuideText_en",
];

const CSV_PATH = path.join(__dirname, "..", "docs/_internal/scratch/DB02.csv");

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

async function main() {
  console.log(`DB_02 장소정보 CSV 읽는 중... (${CSV_PATH})`);
  const rows = readSheetCsvFile(CSV_PATH);
  const header = rows[0]; // 물리명(영문) 행
  const col = makeColumnReader(header);

  const missingHeaders = REQUIRED_HEADERS.filter((h) => !header.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(`DB_02 헤더 없음: ${missingHeaders.join(", ")} — 시트 헤더가 바뀌었는지 확인`);
  }

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
            placeNameEn: toStr(col(row, "place_name_en")),
            placeDescEn: toStr(col(row, "place_desc_en")),
            guideSimpleKo: toStr(col(row, "cultureGuideText_ko (도슨트_간단히)")),
            guideDetailKo: toStr(col(row, "cultureGuideText_ko (도슨트_자세히)")),
            // "관람 순서: …\n사진 포인트: …\n유의사항: …" 3줄 원문 그대로 — 라벨별 분리는 BE-FEAT-013 소관
            guideTipsRawKo: toStr(col(row, "cultureGuideText_ko(놓치기 쉬운 것)")),
            guideEn: toStr(col(row, "cultureGuideText_en")),
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
