/**
 * 영문 주소 배치 적재 (BE-FEAT-013, 9/16 — #25 PR 리뷰 후속 요청).
 *
 * engOperationInfo(detailIntro2)에는 addr1이 없다 — 운영정보(영업시간·전화 등)만
 * 온다. 주소는 같은 EngService2의 detailCommon2로 따로 받아야 한다.
 * import-eng-content-id.ts로 `places.engContentId`가 세팅된 곳(71곳)만 대상.
 * 나머지 49곳은 영문판 자체가 없어서 API 응답 계약에서 addrEn이 null로 나가고
 * 화면이 한국어 주소로 대신한다(hoursEn/closedDaysEn과 같은 원칙).
 *
 * 실행: node --env-file=.env.local --import tsx scripts/ingest-eng-address.ts
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

type PlaceDoc = { _id: string; engContentId?: string };

async function main() {
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const places = client.db("cultural_fit_busan").collection<PlaceDoc>("places");

  const targets = await places
    .find({ engContentId: { $exists: true, $ne: undefined } })
    .toArray();
  console.log(`영문 콘텐츠ID 있는 곳 ${targets.length}곳 처리 시작`);

  let ok = 0;
  let empty = 0;
  let failed = 0;

  for (const place of targets) {
    try {
      // contentTypeId/defaultYN/addrinfoYN을 넣으면 "INVALID_REQUEST_PARAMETER_ERROR"가
      // 남 — 이 오퍼레이션은 그 파라미터들을 안 받는다(실제 호출로 확인, 문서와 다름).
      // numOfRows/pageNo만 필요.
      const body = await callEngApi("detailCommon2", {
        contentId: place.engContentId!,
        numOfRows: "1",
        pageNo: "1",
      });
      const item = body.items === "" ? null : body.items.item?.[0] ?? null;
      const addrEn = item?.addr1?.trim() || null;
      await places.updateOne({ _id: place._id }, { $set: { addrEn } });
      if (addrEn) ok++;
      else empty++;
    } catch (err) {
      console.warn(`${place._id}(eng ${place.engContentId}) 실패:`, (err as Error).message);
      failed++;
    }
  }

  console.log(`\n적재 완료: ${ok}곳 성공, ${empty}곳 주소 없음, ${failed}곳 실패`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
