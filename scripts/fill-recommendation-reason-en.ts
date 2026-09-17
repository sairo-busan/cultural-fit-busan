/**
 * recommendationReasonEn 채우기 (BE-FEAT-015, LLM 번역).
 *
 * place_by_cf8.recommendationReason은 952건이지만 전부 템플릿 조합이다:
 *   "{placeDesc}입니다. {절A} {절B} {절C} {마무리(cf8Code별 고정)}"
 * 절A/B/C 각 4종(4×4×4=64 조합, 실제 63종 관측) + 마무리 8종(cf8Code 1:1)만
 * 번역하면 전체를 조립할 수 있다(사전 분석 스크립트로 검증 완료, prefix 불일치 0건).
 * descEn은 place_info.placeDescEn(120/120 기확보)을 그대로 재사용한다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/fill-recommendation-reason-en.ts
 */

import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

const CLAUSE_A: Record<string, string> = {
  "비교적 조용한 분위기라 천천히 둘러보기 좋고":
    "the calm atmosphere makes it easy to explore at a relaxed pace",
  "활동적인 요소가 있지만 원하는 구간을 골라 천천히 즐길 수 있고":
    "it has some lively elements, but you can pick a section and enjoy it slowly",
  "전반적으로 여유로운 편이지만 핵심 볼거리를 중심으로 가볍게 즐길 수 있고":
    "it's generally relaxed overall, and easy to enjoy lightly around the main highlights",
  "볼거리와 움직임이 있어 활기 있게 즐길 수 있고":
    "there's plenty to see and do, so you can enjoy it with energy",
};

const CLAUSE_B: Record<string, string> = {
  "부산의 생활감과 지역 이야기가 잘 드러나며":
    "it shows Busan's everyday life and local stories well",
  "지역색은 강하지 않지만 장소 자체의 분위기와 특징을 발견하는 재미가 있으며":
    "the local color isn't strong, but there's fun in discovering the place's own mood and character",
  "부산을 대표하는 풍경이나 명소성을 느낄 수 있으며":
    "you can feel the scenery and landmark quality that represent Busan",
  "대표 명소다운 상징성은 덜하지만 비교적 덜 알려진 장면을 발견할 수 있으며":
    "it's less iconic than a signature landmark, but you can discover a relatively lesser-known scene",
};

const CLAUSE_C: Record<string, string> = {
  "한 장소의 배경과 이야기를 천천히 이해하기 좋습니다.":
    "it's good for slowly taking in one place's background and story",
  "오래 머무는 곳은 아니지만 핵심 포인트를 짧게 살펴보기 좋습니다.":
    "it's not somewhere to linger long, but it's good for a quick look at the key points",
  "경험의 종류는 많지 않지만 한 가지 매력에 집중하기 좋습니다.":
    "there aren't many kinds of experiences, but it's good for focusing on one distinct appeal",
  "한곳에서 여러 볼거리와 경험을 이어가기 좋습니다.":
    "it's good for connecting several sights and experiences in one place",
};

const CLOSING_BY_CF8: Record<string, string> = {
  CLD: "For these reasons, it's a good pick for travelers who want to explore Busan's local stories slowly, at a quiet pace.",
  CLV: "For these reasons, it's a good pick for travelers who want to move around quietly and discover a variety of local Busan scenes.",
  CFD: "For these reasons, it's a good pick for travelers who want to fully enjoy Busan's iconic places without rushing.",
  CFV: "For these reasons, it's a good pick for travelers who want to comfortably take in a variety of sights and scenes at Busan's iconic spots.",
  ELD: "For these reasons, it's a good pick for travelers who want to deeply experience Busan's everyday life and stories in a lively atmosphere.",
  ELV: "For these reasons, it's a good pick for travelers who want to wander lively neighborhoods and experience a variety of local Busan scenes.",
  EFD: "For these reasons, it's a good pick for travelers who want to enjoy Busan's iconic spots with energy, focused on the key experience.",
  EFV: "For these reasons, it's a good pick for travelers who want to enjoy a wide range of sights and activities at Busan's iconic spots.",
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function splitMiddle(middle: string): { a: string; b: string; c: string } | null {
  const aKey = Object.keys(CLAUSE_A).find((k) => middle.startsWith(k));
  if (!aKey) return null;
  let rest = middle.slice(aKey.length).trim();

  const bKey = Object.keys(CLAUSE_B).find((k) => rest.startsWith(k));
  if (!bKey) return null;
  rest = rest.slice(bKey.length).trim();

  const cKey = Object.keys(CLAUSE_C).find((k) => rest === k);
  if (!cKey) return null;

  return { a: CLAUSE_A[aKey], b: CLAUSE_B[bKey], c: CLAUSE_C[cKey] };
}

async function main() {
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const db = client.db("cultural_fit_busan");

  const reasons = await db
    .collection("place_by_cf8")
    .find(
      { recommendationReason: { $ne: null } },
      { projection: { _id: 0, placeId: 1, cf8Code: 1, recommendationReason: 1 } }
    )
    .toArray();

  const placeInfos = await db
    .collection("place_info")
    .find({}, { projection: { _id: 0, placeId: 1, placeDesc: 1, placeDescEn: 1 } })
    .toArray();
  const infoByPlaceId = new Map(placeInfos.map((p: any) => [p.placeId, p]));

  const writes: { updateOne: { filter: object; update: object } }[] = [];
  const failed: { placeId: string; cf8Code: string; reason: string }[] = [];

  for (const r of reasons as any[]) {
    const info = infoByPlaceId.get(r.placeId);
    const desc: string | undefined = info?.placeDesc;
    const descEn: string | undefined = info?.placeDescEn;
    if (!desc || !descEn) {
      failed.push({ placeId: r.placeId, cf8Code: r.cf8Code, reason: "descEn 없음" });
      continue;
    }

    const prefix = `${desc}입니다.`;
    if (!r.recommendationReason.startsWith(prefix)) {
      failed.push({ placeId: r.placeId, cf8Code: r.cf8Code, reason: "prefix 불일치" });
      continue;
    }
    const rest = r.recommendationReason.slice(prefix.length).trim();
    const closingIdx = rest.indexOf("이런 점 때문에");
    if (closingIdx === -1) {
      failed.push({ placeId: r.placeId, cf8Code: r.cf8Code, reason: "마무리 문장 없음" });
      continue;
    }
    const middle = rest.slice(0, closingIdx).trim();

    const split = splitMiddle(middle);
    const closing = CLOSING_BY_CF8[r.cf8Code];
    if (!split || !closing) {
      failed.push({ placeId: r.placeId, cf8Code: r.cf8Code, reason: "템플릿 매칭 실패" });
      continue;
    }

    const descEnClean = descEn.replace(/\.$/, "");
    const recommendationReasonEn = `${descEnClean}. ${capitalize(split.a)}, ${split.b}, and ${split.c}. ${closing}`;

    writes.push({
      updateOne: {
        filter: { placeId: r.placeId, cf8Code: r.cf8Code },
        update: { $set: { recommendationReasonEn } },
      },
    });
  }

  console.log(`매칭 성공: ${writes.length}건 / 전체 ${reasons.length}건`);
  if (failed.length > 0) {
    console.log(`매칭 실패: ${failed.length}건`);
    console.log(failed.slice(0, 10));
  }

  if (writes.length > 0) {
    const result = await db.collection("place_by_cf8").bulkWrite(writes);
    console.log(`적재 완료: ${result.modifiedCount}건 갱신`);
  }

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
