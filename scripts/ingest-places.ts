/**
 * 부산 장소 초기 구축 스크립트.
 * areaBasedList2로 목록 수집 → 장소별 detailCommon2/detailIntro2/detailImage2/detailInfo2 병합 → places 컬렉션에 upsert.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/ingest-places.ts [contentTypeId]
 * (contentTypeId 생략 시 12,14,15,39 전부 순회. INGEST_LIMIT=n 환경변수로 소량 테스트 가능)
 */

import { MongoClient } from "mongodb";

const TOUR_API_BASE = "https://apis.data.go.kr/B551011/KorService2";
const BUSAN_AREA_CODE = "6"; // areaBasedList2 요청용 지역코드(구 체계). 실제 호출로 부산 확인됨
const DEFAULT_CONTENT_TYPE_IDS = ["12", "14", "15", "39"]; // 관광지/문화시설/축제행사/음식점

const serviceKey = process.env.TOUR_API_KEY;
const mongoUri = process.env.MONGODB_URI;

if (!serviceKey) throw new Error("TOUR_API_KEY가 설정되지 않았습니다");
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

async function callTourApi(op: string, params: Record<string, string>) {
  const search = new URLSearchParams({
    ...params,
    serviceKey: serviceKey!,
    MobileOS: "ETC",
    MobileApp: "CulturalFitBusan",
    _type: "json",
  });
  const res = await fetch(`${TOUR_API_BASE}/${op}?${search.toString()}`);
  const body = await res.json();
  if (!res.ok || body.response?.header?.resultCode !== "0000") {
    throw new Error(`${op} 호출 실패: ${JSON.stringify(body.response?.header)}`);
  }
  return body.response.body;
}

type TourItem = Record<string, string>;

async function fetchAreaList(contentTypeId: string): Promise<TourItem[]> {
  const items: TourItem[] = [];
  let pageNo = 1;
  const numOfRows = 100;
  while (true) {
    const body = await callTourApi("areaBasedList2", {
      areaCode: BUSAN_AREA_CODE,
      contentTypeId,
      numOfRows: String(numOfRows),
      pageNo: String(pageNo),
    });
    const pageItems: TourItem[] = body.items === "" ? [] : body.items.item;
    items.push(...pageItems);
    if (pageItems.length < numOfRows) break;
    pageNo += 1;
  }
  return items;
}

async function fetchDetail(contentId: string, contentTypeId: string) {
  const [common, intro, images, info] = await Promise.all([
    callTourApi("detailCommon2", { contentId }).catch(() => null),
    callTourApi("detailIntro2", { contentId, contentTypeId }).catch(() => null),
    callTourApi("detailImage2", { contentId, imageYN: "Y" }).catch(() => null),
    callTourApi("detailInfo2", { contentId, contentTypeId }).catch(() => null),
  ]);

  const commonItem: TourItem | undefined = common?.items?.item?.[0];
  const introItem: TourItem | undefined = intro?.items?.item?.[0];
  const imageItems: TourItem[] = images?.items === "" || !images ? [] : images.items.item;
  const infoItems: TourItem[] = info?.items === "" || !info ? [] : info.items.item;

  return {
    homepage: commonItem?.homepage?.replace(/<[^>]*>/g, "") ?? null,
    overview: commonItem?.overview ?? null,
    operationInfo: introItem ?? {},
    images: imageItems.map((img) => img.originimgurl).filter(Boolean),
    info: infoItems
      .filter((i) => i.infotext)
      .map((i) => ({ name: i.infoname, text: i.infotext })),
  };
}

/** 축제(contentTypeId=15) 전용: searchFestival2로 eventStartDate/eventEndDate 보강 */
async function fetchFestivalDates(): Promise<Map<string, { eventStartDate: string; eventEndDate: string }>> {
  const map = new Map<string, { eventStartDate: string; eventEndDate: string }>();
  let pageNo = 1;
  const numOfRows = 100;
  while (true) {
    const body = await callTourApi("searchFestival2", {
      areaCode: BUSAN_AREA_CODE,
      eventStartDate: "20250101", // 과거~미래 전체 범위를 잡기 위한 넉넉한 시작일
      numOfRows: String(numOfRows),
      pageNo: String(pageNo),
    });
    const pageItems: TourItem[] = body.items === "" ? [] : body.items.item;
    for (const item of pageItems) {
      map.set(item.contentid, {
        eventStartDate: item.eventstartdate,
        eventEndDate: item.eventenddate,
      });
    }
    if (pageItems.length < numOfRows) break;
    pageNo += 1;
  }
  return map;
}

async function main() {
  const targetTypes = process.argv[2] ? [process.argv[2]] : DEFAULT_CONTENT_TYPE_IDS;
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const places = client.db("cultural_fit_busan").collection("places");

  const limit = process.env.INGEST_LIMIT ? parseInt(process.env.INGEST_LIMIT, 10) : undefined;
  const festivalDates = targetTypes.includes("15") ? await fetchFestivalDates() : null;

  let total = 0;
  for (const contentTypeId of targetTypes) {
    const fullList = await fetchAreaList(contentTypeId);
    const list = limit ? fullList.slice(0, limit) : fullList;
    console.log(`[${contentTypeId}] 목록 ${fullList.length}건 수집${limit ? ` (테스트: ${list.length}건만 처리)` : ""}`);

    for (const item of list) {
      const detail = await fetchDetail(item.contentid, contentTypeId);
      const dates = festivalDates?.get(item.contentid);

      await places.updateOne(
        { _id: item.contentid as unknown as never },
        {
          $set: {
            contentTypeId,
            title: item.title,
            addr1: item.addr1,
            addr2: item.addr2,
            areaCode: item.areacode,
            sigunguCode: item.sigungucode,
            mapX: parseFloat(item.mapx),
            mapY: parseFloat(item.mapy),
            firstImage: item.firstimage || null,
            firstImage2: item.firstimage2 || null,
            cpyrhtDivCd: item.cpyrhtDivCd || null,
            tel: item.tel || null,
            lDongRegnCd: item.lDongRegnCd,
            lDongSignguCd: item.lDongSignguCd,
            lclsSystm1: item.lclsSystm1,
            lclsSystm2: item.lclsSystm2,
            lclsSystm3: item.lclsSystm3,
            modifiedTime: item.modifiedtime,
            ...detail,
            ...(dates ?? {}),
            syncedAt: new Date(),
          },
        },
        { upsert: true }
      );
      total += 1;
      process.stdout.write(`\r  적재 중... ${total}건`);
    }
  }

  console.log(`\n완료: 총 ${total}건 upsert`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
