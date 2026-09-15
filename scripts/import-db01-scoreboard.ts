/**
 * DB_01 점수판(gid=730250102) 적재 스크립트.
 *
 * 엑셀 점수판 기준 Model B — CF8 6분할(차분함/에너지·로컬/대표명소·깊게머무름/다양하게경험) +
 * 동행 5(혼자·친구/연인·부모님·아이·반려동물) + 날씨 3 + 계절 4 + 시간 3, 그대로 저장한다.
 * 스코어링 로직(6개 중 3개를 코드로 골라 합산)은 여기서 계산하지 않는다 — 원본 컬럼을
 * 그대로 두고 cf8Match.ts가 매 요청마다 골라 쓴다.
 *
 * 9/15 — `place_type`·`pet_allowed`·`pet_condition`·`indoor_outdoor` 4컬럼 유나가
 * 전부 채움(120/120). `indoor_outdoor`·`pet_allowed`는 후보 헤더 이름을 여러 개 두고
 * 찾던 방어 코드를 그대로 남긴다(비용 없음, 헤더가 또 바뀌어도 안전).
 * `place_type`은 옛 92번 시트 4종("식음형" 등)이 아니라 유나가 새로 만든 10종
 * 체계(예: "역사·문화")다 — 값셋 자체가 바뀌었다.
 * `pet_condition`은 신규 — FALSE인 곳은 "동반 불가", TRUE인 곳은 실제 이용 조건 문구.
 *
 * pet_allowed는 API로 확인된 18곳을 별도 스크립트(seed-pet-allowed.ts)가 시드값으로
 * 먼저 넣어뒀었는데, 이제 시트가 120곳 다 채워졌으니 시트값이 항상 우선한다.
 *
 * Node에서 구글시트 export URL을 직접 부르면 최근 수정분이 안 반영된 스냅샷이 오는 문제가
 * 있어(scripts/lib/csv.ts 참고) 미리 받아둔 로컬 CSV를 읽는다. 최신본이 필요하면 먼저:
 *   curl -sL "https://docs.google.com/spreadsheets/d/1-6usA2CWMCKvUWf53SJRWwzkuvRBmwpE_H958bWAGWE/export?format=csv&gid=730250102" -o docs/_internal/scratch/DB01.csv
 *
 * 실행: node --env-file=.env.local --import tsx scripts/import-db01-scoreboard.ts
 */

import path from "node:path";
import { MongoClient } from "mongodb";
import { readSheetCsvFile, makeColumnReader, toNum, toStr, toTriState } from "./lib/csv";

const CSV_PATH = path.join(__dirname, "..", "docs/_internal/scratch/DB01.csv");

/**
 * 기대 헤더 — 시트에서 이름이 한 글자라도 바뀌면 col()이 undefined를 주고 그 축이
 * 조용히 120행 전부 null로 빠진다(#19 PR 리뷰 코멘트). 시작할 때 한 번 확인한다.
 */
const REQUIRED_HEADERS = [
  "관리ID (place_id)",
  "장소명",
  "대표컨텐츠ID",
  "차분함",
  "에너지",
  "로컬",
  "대표명소",
  "깊게머무름",
  "다양하게경험",
  "혼자",
  "친구/연인",
  "부모님",
  "아이",
  "반려동물",
  "맑음",
  "비",
  "흐림",
  "봄",
  "여름",
  "가을",
  "겨울",
  "오전",
  "오후",
  "저녁",
];

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

async function main() {
  console.log(`DB_01 점수판 CSV 읽는 중... (${CSV_PATH})`);
  const rows = readSheetCsvFile(CSV_PATH);
  const header = rows[0];
  const col = makeColumnReader(header);

  const missingHeaders = REQUIRED_HEADERS.filter((h) => !header.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(`DB_01 헤더 없음: ${missingHeaders.join(", ")} — 시트 헤더가 바뀌었는지 확인`);
  }

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

    // 후보 헤더 이름으로 찾고 없으면 null — 헤더 이름이 또 바뀌어도 방어됨.
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
      placeType: toStr(col(row, "place_type")),
      petCondition: toStr(col(row, "pet_condition")),
    };
    if (petAllowedRaw && petAllowedRaw.trim() !== "") {
      set.petAllowed = toTriState(petAllowedRaw);
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
