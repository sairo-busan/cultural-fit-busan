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
/** 무장애여행 정보 — docs/decisions/2026-09-11_DB필드_확정.md 참고 */
const KOR_WITH_API_BASE = "https://apis.data.go.kr/B551011/KorWithService2";
/** 반려동물동반여행 정보 — 부산 목록 포함 여부만 씀(상세 오퍼레이션은 커버리지가 더 낮음) */
const KOR_PET_API_BASE = "https://apis.data.go.kr/B551011/KorPetTourService2";

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

/** undefined 값을 가진 키를 통째로 제거 — 드라이버가 undefined를 null로 직렬화해서
 * 그대로 $set하면 기존 값을 지운다(9/18 사고 원인, refresh-curated-places.ts와 동일 원칙). */
function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) (result as Record<string, unknown>)[key] = value;
  }
  return result;
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

/**
 * 무장애여행 API가 필드 값 뒤에 자기 카테고리명을 밑줄로 이어붙여서 준다
 * (예: `"장애인 전용 주차구역 있음_무장애 편의시설"`, 9/16 소피 리뷰 발견 —
 * S20 상세 43/260건). 필드명(parking·wheelchair 등)으로 이미 구분되는 값이라
 * 중복이라 지운다. 드물게 그 뒤에 다른 문장이 공백 없이 바로 붙기도 해서
 * (예: `"...있음_무장애 편의시설장애인은 1시간..."`) 공백으로 치환한다.
 */
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

async function fetchDetail(contentId: string, contentTypeId: string) {
  const [common, intro, images, info, withTour] = await Promise.all([
    callTourApi("detailCommon2", { contentId }).catch(() => null),
    callTourApi("detailIntro2", { contentId, contentTypeId }).catch(() => null),
    callTourApi("detailImage2", { contentId, imageYN: "Y" }).catch(() => null),
    callTourApi("detailInfo2", { contentId, contentTypeId }).catch(() => null),
    callApi(KOR_WITH_API_BASE, "detailWithTour2", { contentId }).catch(() => null),
  ]);

  const commonItem: TourItem | undefined = common?.items?.item?.[0];
  const introItem: TourItem | undefined = intro?.items?.item?.[0];
  const imageItems: TourItem[] = images?.items === "" || !images ? [] : images.items.item;
  const infoItems: TourItem[] = info?.items === "" || !info ? [] : info.items.item;

  // 무장애여행 API — 이 장소 자체가 서비스에 없으면(withTour null) UNKNOWN(null),
  // 있는데 필드가 전부 빈 문자열이어도 "명시적 불가"가 아니라 UNKNOWN(null).
  // 값이 하나라도 있으면 "이동약자 배려시설 있음"=true. false는 이 API 특성상 안 나온다
  // (docs/decisions/2026-09-11_DB필드_확정.md — "미등록을 false로 저장하면 안 되는 이유" 참고).
  const accessibilityInfo: TourItem | null = cleanAccessibilityInfo(withTour?.items?.item?.[0] ?? null);
  const barrierFree = accessibilityInfo
    ? Object.values(accessibilityInfo).some((v) => typeof v === "string" && v.trim() !== "")
    : null;

  return {
    homepage: commonItem?.homepage?.replace(/<[^>]*>/g, "") ?? null,
    overview: commonItem?.overview ?? null,
    operationInfo: introItem ?? {},
    images: imageItems.map((img) => img.originimgurl).filter(Boolean),
    // 9/16 — S20 사진별 출처 표기용(공공누리 유형 표시 검토, 소피 요청). images와
    // 별도 필드로 둔다 — images: string[]를 그대로 쓰는 화면(#31 Hero 등)을 안 건드리려고.
    imageSources: imageItems
      .filter((img) => img.originimgurl)
      .map((img) => ({ url: img.originimgurl, cpyrhtDivCd: img.cpyrhtDivCd || null })),
    info: infoItems
      .filter((i) => i.infotext)
      .map((i) => ({ name: i.infoname, text: i.infotext })),
    accessibilityInfo,
    barrierFree,
  };
}

/**
 * 반려동물동반여행 서비스에 등록된 부산 장소의 content_id 집합.
 * 목록 포함 여부만 쓴다 — 상세 오퍼레이션(detailPetTour2)은 커버리지가 더 낮다.
 * 이 목록에 없다고 "동반 불가"가 아니라 UNKNOWN — pet_allowed는 이 집합 포함 여부를
 * true/null로만 매핑한다(DB_01의 pet_allowed 수작업 태깅 시드값으로 별도 전달).
 */
async function fetchPetFriendlyContentIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  let pageNo = 1;
  const numOfRows = 100;
  while (true) {
    const body = await callApi(KOR_PET_API_BASE, "areaBasedList2", {
      lDongRegnCd: BUSAN_REGION_CODE,
      numOfRows: String(numOfRows),
      pageNo: String(pageNo),
    });
    const pageItems: TourItem[] = body.items === "" ? [] : body.items.item;
    for (const item of pageItems) ids.add(item.contentid);
    if (pageItems.length < numOfRows) break;
    pageNo += 1;
  }
  return ids;
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
  const petFriendlyIds = await fetchPetFriendlyContentIds();
  console.log(`반려동물동반여행 등록 장소(부산): ${petFriendlyIds.size}건`);

  const fullList = await fetchAreaList(filterType);
  const list = limit ? fullList.slice(0, limit) : fullList;
  console.log(`목록 ${fullList.length}건 수집${limit ? ` (테스트: ${list.length}건만 처리)` : ""}`);

  let total = 0;
  for (const item of list) {
    const contentTypeId = item.contenttypeid;
    const detail = await fetchDetail(item.contentid, contentTypeId);
    const dates = festivalDates?.get(item.contentid);
    const mapX = parseFloat(item.mapx);
    const mapY = parseFloat(item.mapy);

    // 재적재(이미 있는 장소)에서 TourAPI 응답이 부분 실패해도(9/18 사고 —
    // detailCommon2가 성공했는데 item 없이 옴) 기존 좋은 값을 undefined→null로
    // 덮어쓰지 않는다. omitUndefined로 undefined 키를 통째로 뺀다.
    await places.updateOne(
      // TourAPI contentId를 그대로 _id(PK)로 사용 — mongodb 타입 정의가 string _id를 기본으로 안 받아줘서 캐스팅
      { _id: item.contentid as unknown as never },
      {
        $set: omitUndefined({
          contentTypeId,
          title: item.title,
          addr1: item.addr1,
          addr2: item.addr2,
          areaCode: item.areacode,
          sigunguCode: item.sigungucode,
          mapX: Number.isFinite(mapX) ? mapX : undefined,
          mapY: Number.isFinite(mapY) ? mapY : undefined,
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
          // 반려동물동반여행 목록 포함 여부 원본 신호 — DB_01.pet_allowed 시드값 뽑을 때 참고용.
          // 목록에 없다고 "동반 불가"가 아니라 UNKNOWN이라, false로 안 두고 null로 둔다.
          petFriendlyApi: petFriendlyIds.has(item.contentid) ? true : null,
          ...(dates ?? {}),
          syncedAt: new Date(),
        }),
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
