/**
 * 영문 영업정보 배치 적재 (BE-FEAT-013).
 *
 * import-eng-content-id.ts로 `places.engContentId`가 세팅된 곳(71곳)만 골라
 * TourAPI 영문 서비스(EngService2)의 detailIntro2를 호출해서 `places.engOperationInfo`에
 * 저장한다. 나머지 49곳은 영문판 자체에 없어서 이 스크립트가 손댈 게 없다 —
 * API 응답 계약에서 hoursEn/closedDaysEn이 null로 나가고 화면이 한국어로 대신한다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/ingest-eng-operation-info.ts
 */

import { MongoClient } from "mongodb";

const ENG_API_BASE = "https://apis.data.go.kr/B551011/EngService2";
const serviceKey = process.env.TOUR_API_KEY;
const mongoUri = process.env.MONGODB_URI;

if (!serviceKey) throw new Error("TOUR_API_KEY가 설정되지 않았습니다");
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

async function callEngApi(op: string, params: Record<string, string>) {
  const search = new URLSearchParams({
    ...params,
    serviceKey: serviceKey!,
    MobileOS: "ETC",
    MobileApp: "CulturalFitBusan",
    _type: "json",
  });
  const res = await fetch(`${ENG_API_BASE}/${op}?${search.toString()}`);
  const body = await res.json();
  if (!res.ok || body.response?.header?.resultCode !== "0000") {
    throw new Error(`${op} 호출 실패: ${JSON.stringify(body.response?.header)}`);
  }
  return body.response.body;
}

type PlaceDoc = { _id: string; engContentId?: string; engContentTypeId?: string };

async function main() {
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const places = client.db("cultural_fit_busan").collection<PlaceDoc>("places");

  const targets = await places
    .find({ engContentId: { $exists: true, $ne: undefined } })
    .toArray();
  console.log(`영문 콘텐츠ID 있는 곳 ${targets.length}곳 처리 시작`);

  let ok = 0;
  let failed = 0;

  for (const place of targets) {
    try {
      const body = await callEngApi("detailIntro2", {
        contentId: place.engContentId!,
        contentTypeId: place.engContentTypeId!,
      });
      const item = body.items === "" ? null : body.items.item?.[0] ?? null;
      await places.updateOne({ _id: place._id }, { $set: { engOperationInfo: item ?? {} } });
      ok++;
    } catch (err) {
      console.warn(`${place._id}(eng ${place.engContentId}) 실패:`, (err as Error).message);
      failed++;
    }
  }

  console.log(`\n적재 완료: ${ok}곳 성공, ${failed}곳 실패`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
