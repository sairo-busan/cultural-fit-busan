/**
 * DB_01 점수판(gid=730250102) 적재 스크립트.
 *
 * 엑셀 점수판 기준 Model B — CF8 6분할(차분함/에너지·로컬/대표명소·깊게머무름/다양하게경험) +
 * 동행 5(혼자·친구/연인·부모님·아이·반려동물) + 날씨 3 + 계절 4 + 시간 3, 그대로 저장한다.
 * 스코어링 로직(6개 중 3개를 코드로 골라 합산)은 여기서 계산하지 않는다 — 원본 컬럼을
 * 그대로 두고 cf8Match.ts가 매 요청마다 골라 쓴다.
 *
 * `indoor_outdoor`·`pet_allowed`는 유나가 아직 추가하지 않은 컬럼이라 후보 헤더 이름을
 * 여러 개 두고 찾고, 없으면 null로 둔다(docs/decisions/2026-09-11_DB필드_확정.md 참고).
 * pet_allowed는 API로 확인된 18곳을 별도 스크립트가 시드값으로 먼저 넣어두고, 이 스크립트가
 * 시트값이 있을 때만 덮어쓴다(시트 값이 비어 있으면 기존 시드값을 지우지 않음).
 *
 * Node에서 구글시트 export URL을 직접 부르면 최근 수정분이 안 반영된 스냅샷이 오는 문제가
 * 있어(scripts/lib/csv.ts 참고) 미리 받아둔 로컬 CSV를 읽는다. 최신본이 필요하면 먼저:
 *   curl -sL "https://docs.google.com/spreadsheets/d/1-6usA2CWMCKvUWf53SJRWwzkuvRBmwpE_H958bWAGWE/export?format=csv&gid=730250102" -o docs/_internal/scratch/DB01.csv
 *
 * 실행: node --env-file=.env.local --import tsx scripts/import-db01-scoreboard.ts
 */

import path from "node:path";
import { MongoClient } from "mongodb";
import { readSheetCsvFile, makeColumnReader, toNum, toStr } from "./lib/csv";

const CSV_PATH = path.join(__dirname, "..", "docs/_internal/scratch/DB01.csv");

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

async function main() {
  console.log(`DB_01 점수판 CSV 읽는 중... (${CSV_PATH})`);
  const rows = readSheetCsvFile(CSV_PATH);
  const header = rows[0];
  const col = makeColumnReader(header);

  // place_id가 "plc_"로 시작하지 않는 행(빈 줄 등)은 걸러낸다
  const dataRows = rows.slice(1).filter((r) => col(r, "관리ID (place_id)")?.trim().startsWith("plc_"));
  console.log(`전체 ${dataRows.length}행, 컬럼 ${header.length}개`);

  const client = new MongoClient(mongoUri!);
  await client.connect();
  const scoreBoard = client.db("cultural_fit_busan").collection("score_board");

  let missingContentId = 0;

  const writes = dataRows.map((row) => {
    const placeId = col(row, "관리ID (place_id)")!.trim();
    const contentId = toStr(col(row, "대표컨텐츠ID"));
    if (!contentId) missingContentId++;

    // indoor_outdoor/pet_allowed는 유나가 아직 추가 전 — 후보 헤더 이름으로 찾고 없으면 null.
    // pet_allowed는 시트값이 비어 있으면 $set에서 빼서, 시드 스크립트가 넣은 값을 안 지운다.
    const indoorOutdoorRaw = col(row, "실내외", "indoor_outdoor", "INDOOR_OUTDOOR");
    const petAllowedRaw = col(row, "반려동물동반가능", "pet_allowed", "PET_ALLOWED");

    const set: Record<string, unknown> = {
      placeId,
      placeName: toStr(col(row, "장소명")),
      contentId,
      calmnessScore: toNum(col(row, "차분함")),
      energyScore: toNum(col(row, "에너지")),
      localScore: toNum(col(row, "로컬")),
      landmarkScore: toNum(col(row, "대표명소")),
      stayDeeplyScore: toNum(col(row, "깊게머무름")),
      diverseExperienceScore: toNum(col(row, "다양하게경험")),
      soloScore: toNum(col(row, "혼자")),
      coupleFriendScore: toNum(col(row, "친구/연인")),
      parentsScore: toNum(col(row, "부모님")),
      kidsScore: toNum(col(row, "아이")),
      petScore: toNum(col(row, "반려동물")),
      sunnyScore: toNum(col(row, "맑음")),
      rainyScore: toNum(col(row, "비")),
      cloudyScore: toNum(col(row, "흐림")),
      springScore: toNum(col(row, "봄")),
      summerScore: toNum(col(row, "여름")),
      autumnScore: toNum(col(row, "가을")),
      winterScore: toNum(col(row, "겨울")),
      morningScore: toNum(col(row, "오전")),
      afternoonScore: toNum(col(row, "오후")),
      eveningScore: toNum(col(row, "저녁")),
      indoorOutdoor: toStr(indoorOutdoorRaw)?.toUpperCase() ?? null,
    };
    if (petAllowedRaw && petAllowedRaw.trim() !== "") {
      const t = petAllowedRaw.trim().toUpperCase();
      set.petAllowed = t === "Y" || t === "TRUE" ? true : t === "N" || t === "FALSE" ? false : null;
    }

    return {
      updateOne: {
        filter: { placeId },
        update: { $set: set },
        upsert: true,
      },
    };
  });

  const result = await scoreBoard.bulkWrite(writes);
  console.log(
    `\n적재 완료: ${result.upsertedCount}건 신규, ${result.matchedCount}건 갱신` +
      `\n대표컨텐츠ID 없는 행: ${missingContentId}건`
  );

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
