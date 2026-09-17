/**
 * 추천 119곳(score_board.contentId) TourAPI 재적재 — 주간 자동 배치 전용.
 *
 * ingest-places.ts(부산 전체 2,239곳·타입 미지정 전체 조회, 1회 11,000+콜)와
 * 달리 큐레이션된 119곳만 상세 API를 부른다 — 1회 480+콜로 좁혀 일일 한도
 * (1,000건, 일반 계정)를 넘지 않는다(BE-FEAT-019 PR 리뷰, 소피 발견).
 *
 * **상세 호출(detailCommon2/detailIntro2/detailInfo2) 중 하나라도 실패하면 그
 * 장소는 건드리지 않고 건너뛴다.** ingest-places.ts는 `.catch(() => null)`로
 * 실패를 삼켜서 overview: null · operationInfo: {} 같은 빈 값을 그대로
 * `$set`으로 덮어썼다 — 9/14 TourAPI 일일 한도 초과 때 그 뒤 처리된 장소
 * 59곳이 전부 이렇게 빈 값으로 손상됐다(소피 발견). 실패를 "값 없음"이 아니라
 * "이번엔 못 받음"으로 다루는 게 이 스크립트의 핵심 차이.
 *
 * detailImage2·KorWithService2(무장애)는 원래도 장소에 따라 정상적으로 없을
 * 수 있어(coverage 문제, ingest-places.ts 주석 참고) 그대로 null 허용.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/refresh-curated-places.ts
 */

import { MongoClient } from "mongodb";

const TOUR_API_BASE = "https://apis.data.go.kr/B551011/KorService2";
const KOR_WITH_API_BASE = "https://apis.data.go.kr/B551011/KorWithService2";

const serviceKey = process.env.TOUR_API_KEY;
const mongoUri = process.env.MONGODB_URI;

if (!serviceKey) throw new Error("TOUR_API_KEY가 설정되지 않았습니다");
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

async function callApi(base: string, op: string, params: Record<string, string>) {
  const search = new URLSearchParams({
    ...params,
    serviceKey: serviceKey!,
    MobileOS: "ETC",
    MobileApp: "CulturalFitBusan",
    _type: "json",
  });
  const res = await fetch(`${base}/${op}?${search.toString()}`);
  const body = await res.json();
  if (!res.ok || body.response?.header?.resultCode !== "0000") {
    throw new Error(`${op} 호출 실패: ${JSON.stringify(body.response?.header)}`);
  }
  return body.response.body;
}

const callTourApi = (op: string, params: Record<string, string>) => callApi(TOUR_API_BASE, op, params);

type TourItem = Record<string, string>;

/** ingest-places.ts와 동일 — 무장애 API 응답에 카테고리명이 밑줄로 붙는 문제 정리 */
const ACCESSIBILITY_CATEGORY_SUFFIXES = [
  "무장애 편의시설",
  "시각장애인 편의시설",
  "청각장애인 편의시설",
  "영유아 동반가족 편의시설",
];

function cleanAccessibilityInfo(info: TourItem | null): TourItem | null {
  if (!info) return null;
  const pattern = new RegExp(`_?(${ACCESSIBILITY_CATEGORY_SUFFIXES.join("|")})`, "g");
  const cleaned: TourItem = {};
  for (const [key, value] of Object.entries(info)) {
    cleaned[key] =
      typeof value === "string" ? value.replace(pattern, " ").replace(/\s+/g, " ").trim() : value;
  }
  return cleaned;
}

/**
 * common/intro/info는 실패하면 그대로 throw해서 이 장소 전체를 건너뛰게 한다.
 * images/withTour는 장소에 따라 정상적으로 없을 수 있어 null 허용(기존 원칙 유지).
 */
async function fetchDetail(contentId: string, contentTypeId: string) {
  const [common, intro, info] = await Promise.all([
    callTourApi("detailCommon2", { contentId }),
    callTourApi("detailIntro2", { contentId, contentTypeId }),
    callTourApi("detailInfo2", { contentId, contentTypeId }),
  ]);
  const [images, withTour] = await Promise.all([
    callTourApi("detailImage2", { contentId, imageYN: "Y" }).catch(() => null),
    callApi(KOR_WITH_API_BASE, "detailWithTour2", { contentId }).catch(() => null),
  ]);

  const commonItem: TourItem | undefined = common?.items?.item?.[0];
  const introItem: TourItem | undefined = intro?.items?.item?.[0];
  const imageItems: TourItem[] = images?.items === "" || !images ? [] : images.items.item;
  const infoItems: TourItem[] = info?.items === "" || !info ? [] : info.items.item;

  const accessibilityInfo: TourItem | null = cleanAccessibilityInfo(withTour?.items?.item?.[0] ?? null);
  const barrierFree = accessibilityInfo
    ? Object.values(accessibilityInfo).some((v) => typeof v === "string" && v.trim() !== "")
    : null;

  return {
    title: commonItem?.title,
    addr1: commonItem?.addr1,
    mapX: commonItem?.mapx ? parseFloat(commonItem.mapx) : undefined,
    mapY: commonItem?.mapy ? parseFloat(commonItem.mapy) : undefined,
    firstImage: commonItem?.firstimage || null,
    cpyrhtDivCd: commonItem?.cpyrhtDivCd1 || null,
    homepage: commonItem?.homepage?.replace(/<[^>]*>/g, "") ?? null,
    overview: commonItem?.overview ?? null,
    operationInfo: introItem ?? {},
    images: imageItems.map((img) => img.originimgurl).filter(Boolean),
    imageSources: imageItems
      .filter((img) => img.originimgurl)
      .map((img) => ({ url: img.originimgurl, cpyrhtDivCd: img.cpyrhtDivCd || null })),
    info: infoItems
      .filter((i) => i.infotext)
      .map((i) => ({ name: i.infoname, text: i.infotext })),
    accessibilityInfo,
    barrierFree,
    syncedAt: new Date(),
  };
}

async function main() {
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const db = client.db("cultural_fit_busan");
  const places = db.collection("places");

  const contentIds = (
    await db.collection("score_board").find({}, { projection: { _id: 0, contentId: 1 } }).toArray()
  )
    .map((d: any) => d.contentId)
    .filter(Boolean);
  console.log(`대상 ${contentIds.length}곳`);

  const targets = await places
    .find({ _id: { $in: contentIds } }, { projection: { contentTypeId: 1 } })
    .toArray();

  let ok = 0;
  let skipped = 0;
  const skippedIds: string[] = [];

  for (const t of targets as any[]) {
    if (!t.contentTypeId) {
      skipped++;
      skippedIds.push(`${t._id} (contentTypeId 없음)`);
      continue;
    }
    try {
      const detail = await fetchDetail(t._id, t.contentTypeId);
      await places.updateOne({ _id: t._id }, { $set: detail });
      ok++;
    } catch (err) {
      skipped++;
      skippedIds.push(`${t._id}: ${(err as Error).message}`);
    }
    process.stdout.write(`\r  진행 ${ok + skipped}/${targets.length} (성공 ${ok}, 건너뜀 ${skipped})`);
  }

  console.log(`\n완료: ${ok}곳 갱신, ${skipped}곳 건너뜀`);
  if (skippedIds.length > 0) console.log("건너뛴 목록:", skippedIds);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
