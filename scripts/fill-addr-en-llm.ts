/**
 * 영문 주소 나머지 49곳(+API 응답이 비어있던 1곳) 보완 (9/16, #25 PR 후속 요청).
 *
 * TourAPI 영문판이 없는 곳들 — ingest-eng-address.ts가 못 채운 나머지를 국토교통부
 * 로마자 표기법(개정 로마자 표기법) 기준으로 직접 옮겼다. hoursEn/closedDaysEn과
 * 달리 주소는 화면에 늘 노출되는 필드라 null 폴백보다 채우는 쪽을 선택 — DRAFT
 * 취급(guideTipsRawKo 영문 번역과 같은 원칙, TourAPI 실제 영문 데이터가 아니다).
 *
 * 실행: node --env-file=.env.local --import tsx scripts/fill-addr-en-llm.ts
 */

import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

const ADDR_EN: Record<string, string> = {
  // 9/16 소피 리뷰로 4곳 교정 — 실제 TourAPI 영문판·기존 공식 로마자 표기 대조
  "1046349": "61 Sincheon-daero 62beon-gil, Busanjin-gu, Busan",
  "1250885": "7 Gupo Sijang 2-gil, Buk-gu, Busan",
  "126028": "Geumseong-dong, Geumjeong-gu, Busan",
  "126098": "Samseong-ri, Ilgwang-eup, Gijang-gun, Busan",
  "126119": "295 Saessak-ro, Busanjin-gu, Busan",
  "126194": "347 Chungnyeol-daero, Dongnae-gu, Busan",
  "126195": "93 UN Pyeonghwa-ro, Nam-gu, Busan",
  "126857": "72-1 Gwangbok-ro, Jung-gu, Busan",
  "127149": "19 Minjugongwon-gil, Jung-gu, Busan",
  "127771": "43 Suyeongseong-ro, Suyeong-gu, Busan",
  "128053": "138 Baegyangsan-ro, Busanjin-gu, Busan",
  "128108": "324 Cheyukgongwon-ro 399beon-gil, Geumjeong-gu, Busan",
  "129140": "Gwangan-dong, Suyeong-gu, Busan",
  "129156": "10 Oeyangpo-ro, Gangseo-gu, Busan",
  "130145": "66 Bokcheon-ro, Dongnae-gu, Busan",
  "130252": "175 Ujangchun-ro, Dongnae-gu, Busan",
  "132576": "42 Jagalchi-ro, Jung-gu, Busan",
  "1607655": "202 Chungmu-daero, Seo-gu, Busan",
  "1608530": "45 Imsisudoginyeom-ro, Seo-gu, Busan",
  "1608633": "67-1 Daecheong-ro, Jung-gu, Busan",
  "1940193": "San 170, Yongdang-dong, Nam-gu, Busan",
  "1945300": "2 Mangyang-ro 580beon-gil, Dong-gu, Busan",
  "1945309": "68 Igidaegongwon-ro, Nam-gu, Busan",
  "2487927": "Daejeo 2-dong, Gangseo-gu, Busan",
  "2487931": "125 Saengtaegongwon-gil, Buk-gu, Busan",
  "252563": "Cheonghak-dong, Yeongdo-gu, Busan",
  "252564": "Dongsam-dong, Yeongdo-gu, Busan",
  "2551424": "100 Honggok-ro 320beon-gil, Nam-gu, Busan",
  "2554111": "250 Beomeosa-ro, Geumjeong-gu, Busan",
  "2605916": "865-48, Choryang-dong, Dong-gu, Busan",
  "2656194": "Choryang-dong, Dong-gu, Busan",
  "2661446": "55 Haeyang-ro 301beon-gil, Yeongdo-gu, Busan",
  "2721157": "91-7, Yeongju-dong, Jung-gu, Busan",
  "2721158": "17-4 Haedoji-ro 183beon-gil, Seo-gu, Busan",
  "2733472": "391-39 Hwangnyeongsan-ro, Nam-gu, Busan",
  "2744582": "68 Haeansaebyeoksijang-gil, Seo-gu, Busan",
  "2748838": "Daejeo 1-dong, Gangseo-gu, Busan",
  "2756696": "299 Sanseong-ro, Buk-gu, Busan",
  "2760699": "49 Ami-ro, Seo-gu, Busan",
  "2763832": "229 Oryundae-ro, Geumjeong-gu, Busan",
  "2782682": "85 Suyeonggangbyeon-daero, Haeundae-gu, Busan",
  "2784356": "San 123-18, Amnam-dong, Seo-gu, Busan",
  "2785762": "35 Gaya-daero, Sasang-gu, Busan",
  "2789340": "95 Myeongji Ocean City 10-ro, Gangseo-gu, Busan",
  "2822240": "66-40 Bunpo-ro, Nam-gu, Busan",
  "3017282": "2-36 Jungninam-ro, Yeongdo-gu, Busan",
  "346661": "173 Mora-ro 219beon-gil, Sasang-gu, Busan",
  "630874": "1240 Nakdongnam-ro, Saha-gu, Busan",
  "702551": "35 Centum Nam-daero, Haeundae-gu, Busan",
  "986063": "4-1 Yongmi-gil 8beon-gil, Jung-gu, Busan",
};

async function main() {
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const places = client.db("cultural_fit_busan").collection<{ _id: string }>("places");

  const writes = Object.entries(ADDR_EN).map(([contentId, addrEn]) => ({
    updateOne: { filter: { _id: contentId }, update: { $set: { addrEn } } },
  }));

  const result = await places.bulkWrite(writes);
  console.log(`적재 완료: ${result.matchedCount}건 갱신 (${writes.length}건 중)`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
