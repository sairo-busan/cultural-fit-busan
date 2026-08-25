/**
 * 부산 장소 초기 구축 스크립트.
 * areaBasedList2(lDongRegnCd=법정동 시도코드 기준, contentTypeId 미지정 = 전체 타입)로 목록 수집
 * → 장소별 detailCommon2/detailIntro2/detailImage2/detailInfo2 병합 → places 컬렉션에 upsert.
 * 타입 목록을 하드코딩하지 않아 TourAPI에 새 콘텐츠타입이 추가돼도 코드 변경 없이 자동 반영됨.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/ingest-places.ts [contentTypeId]
 * (contentTypeId 생략 시 부산 전체 타입 한 번에. 특정 타입만 테스트하려면 예: `... ts 12`.
 *  INGEST_LIMIT=n 환경변수로 소량 테스트 가능)
 *
 * 주의: areaBasedList2/searchFestival2의 공식 지역 필터는 `lDongRegnCd`(법정동 시도코드)이지,
 * 구버전 `areaCode`가 아님(8/24 팀원 제보로 발견 — areaCode=6은 문서에도 없는 파라미터인데
 * 조용히 더 좁은 결과를 반환해서 부산 데이터가 최대 19배까지 누락되고 있었음).
 */

import { MongoClient } from "mongodb";
import { BUSAN_REGION_CODE } from "../src/lib/tourApiCodes";

const TOUR_API_BASE = "https://apis.data.go.kr/B551011/KorService2";

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

/**
 * contentTypeId를 생략하면 부산 전체 타입을 한 번에 가져온다.
 * 타입 목록을 하드코딩하지 않으므로 TourAPI에 새 타입이 추가돼도 코드 변경 없이 자동 반영됨.
 */
async function fetchAreaList(contentTypeId?: string): Promise<TourItem[]> {
  const items: TourItem[] = [];
  let pageNo = 1;
  const numOfRows = 100;
  while (true) {
    const body = await callTourApi("areaBasedList2", {
      lDongRegnCd: BUSAN_REGION_CODE,
      ...(contentTypeId ? { contentTypeId } : {}),
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
      lDongRegnCd: BUSAN_REGION_CODE,
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
  // CLI 인자로 특정 타입만 테스트 가능(예: `... ts 12`), 생략 시 부산 전체 타입 한 번에
  const filterType = process.argv[2];
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const places = client.db("cultural_fit_busan").collection("places");

  const limit = process.env.INGEST_LIMIT ? parseInt(process.env.INGEST_LIMIT, 10) : undefined;
  const festivalDates = !filterType || filterType === "15" ? await fetchFestivalDates() : null;

  const fullList = await fetchAreaList(filterType);
  const list = limit ? fullList.slice(0, limit) : fullList;
  console.log(`목록 ${fullList.length}건 수집${limit ? ` (테스트: ${list.length}건만 처리)` : ""}`);

  let total = 0;
  for (const item of list) {
    const contentTypeId = item.contenttypeid;
    const detail = await fetchDetail(item.contentid, contentTypeId);
    const dates = festivalDates?.get(item.contentid);

    await places.updateOne(
      // TourAPI contentId를 그대로 _id(PK)로 사용 — mongodb 타입 정의가 string _id를 기본으로 안 받아줘서 캐스팅
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

  console.log(`\n완료: 총 ${total}건 upsert`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
