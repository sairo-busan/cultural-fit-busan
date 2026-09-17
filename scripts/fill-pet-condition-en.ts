/**
 * petConditionEn 채우기 (BE-FEAT-015, LLM 번역).
 *
 * score_board.petCondition 값은 119건이지만 실제로는 9개 문구만 반복돼서,
 * 문구 단위로 번역 후 updateMany로 일괄 적재한다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/fill-pet-condition-en.ts
 */

import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

const PET_CONDITION_EN: Record<string, string> = {
  "목줄 착용·배변봉투 지참, 현장별 제한구역·안전수칙 확인":
    "Leash and waste bags required; check restricted areas and safety rules on site",
  "동반 불가": "Pets not allowed",
  "야외·공용구역 중심 동반 가능, 실내 시설·매장별 출입 제한 확인":
    "Pets allowed mainly in outdoor and common areas; entry to indoor facilities and shops may be restricted",
  "펫 케이지·캐리어 사용 등 탑승 규정 준수, 현장 운영규정 확인":
    "Follow boarding rules such as using a pet cage or carrier; check on-site operating rules",
  "야외 공간 중심 동반 가능, 실내 매장별 출입 제한 확인":
    "Pets allowed mainly in outdoor spaces; entry to indoor shops may be restricted",
  "야외 광장 중심 동반 가능, 상영관·공연장 등 실내 출입 제한 확인":
    "Pets allowed mainly in the outdoor plaza; entry to indoor areas such as theaters and performance halls is restricted",
  "전용 캐리어·케이지 등 시설 기준 준수, 탑승 전 최신 반려동물 규정 확인":
    "Follow facility rules such as using a dedicated carrier or cage; check the latest pet policy before boarding",
  "이동가방·유모차 등 이용 조건 확인, 개별 매장·행사별 출입 제한 확인":
    "Check conditions for carrier bags or strollers; entry restrictions vary by shop and event",
  "공용 통로 동반 가능, 개별 매장·식음 공간별 출입 제한 확인":
    "Pets allowed in shared walkways; entry to individual shops and dining areas may be restricted",
};

async function main() {
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const scoreBoard = client.db("cultural_fit_busan").collection("score_board");

  let total = 0;
  for (const [ko, en] of Object.entries(PET_CONDITION_EN)) {
    const result = await scoreBoard.updateMany(
      { petCondition: ko },
      { $set: { petConditionEn: en } }
    );
    console.log(`"${ko.slice(0, 20)}…" → ${result.modifiedCount}건`);
    total += result.modifiedCount;
  }
  console.log(`\n적재 완료: 총 ${total}건`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
