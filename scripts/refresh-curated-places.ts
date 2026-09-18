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

/** TourAPI 원문이 틀렸다고 확인되어 사람이 직접 고친 값 — 재적재해도 되돌아가면 안 된다.
 * 2385666(국립부산과학관): 전화가 TourAPI 원문 "1422-23"인데 걸리지 않아, 비짓부산
 * 공식 번호로 교체(소피, PR #59). 원문이 실제로 틀린 건지는 API 측 문의 필요 —
 * 맞는 걸로 확인되면 이 항목을 지운다. */
const MANUAL_OPERATION_OVERRIDES: Record<string, TourItem> = {
  "2385666": { infocenterculture: "051-750-2300" },
};

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
 * images/withTour는 장소에 따라 정상적으로 없을 수도 있고(성공+빈 응답), 호출
 * 자체가 실패할 수도 있다(9/18, 소피 리뷰) — 이 둘을 구분해야 한다. 실패를
 * "없음"으로 다루면 일시 오류 한 번에 사진·무장애가 빈 값으로 덮이고, 그 뒤
 * check-stale-en-fields.ts가 영문 무장애까지 지운다. 호출 실패면 해당 필드를
 * $set에서 아예 빼서(undefined → omitUndefined) 기존 DB 값을 보존한다.
 */
async function fetchDetail(contentId: string, contentTypeId: string) {
  const [common, intro, info] = await Promise.all([
    callTourApi("detailCommon2", { contentId }),
    callTourApi("detailIntro2", { contentId, contentTypeId }),
    callTourApi("detailInfo2", { contentId, contentTypeId }),
  ]);
  const [imagesResult, withTourResult] = await Promise.allSettled([
    callTourApi("detailImage2", { contentId, imageYN: "Y" }),
    callApi(KOR_WITH_API_BASE, "detailWithTour2", { contentId }),
  ]);
  const images = imagesResult.status === "fulfilled" ? imagesResult.value : null;
  const imagesFailed = imagesResult.status === "rejected";
  const withTour = withTourResult.status === "fulfilled" ? withTourResult.value : null;
  const withTourFailed = withTourResult.status === "rejected";

  const commonItem: TourItem | undefined = common?.items?.item?.[0];
  // detailCommon2가 resultCode 0000(성공)이면서 item이 없는 경우가 있다(9/18, 소피
  // 발견 — 2721157 영주하늘눈전망대). callTourApi는 resultCode 실패만 throw하고
  // "성공했지만 빈 응답"은 그대로 통과시켜서, title/addr1/mapX/mapY가 undefined로
  // $set 돼 기존 좋은 값을 null로 덮어썼다. title은 장소의 정체성 자체라 없으면
  // 이 장소를 통째로 건너뛴다(기존 DB 값 보존).
  if (!commonItem?.title) {
    throw new Error("detailCommon2 응답에 item 없음(빈 성공 응답) — 이 장소 스킵");
  }
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
    operationInfo: { ...(introItem ?? {}), ...MANUAL_OPERATION_OVERRIDES[contentId] },
    images: imagesFailed ? undefined : imageItems.map((img) => img.originimgurl).filter(Boolean),
    imageSources: imagesFailed
      ? undefined
      : imageItems.filter((img) => img.originimgurl).map((img) => ({ url: img.originimgurl, cpyrhtDivCd: img.cpyrhtDivCd || null })),
    info: infoItems
      .filter((i) => i.infotext)
      .map((i) => ({ name: i.infoname, text: i.infotext })),
    accessibilityInfo: withTourFailed ? undefined : accessibilityInfo,
    barrierFree: withTourFailed ? undefined : barrierFree,
    syncedAt: new Date(),
  };
}

/** undefined 값을 가진 키를 통째로 제거한다 — MongoDB 드라이버가 undefined를
 * null로 직렬화해서 $set에 그대로 넘기면 기존 값을 지워버린다(9/18 사고 원인).
 * TourAPI가 일부 필드만 빠뜨려 응답하는 경우에도 그 필드는 건드리지 않고
 * 기존 DB 값을 보존하기 위한 범용 안전장치. */
function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) (result as Record<string, unknown>)[key] = value;
  }
  return result;
}

type ScoreBoardRow = { contentId: string };
type PlaceTarget = { _id: string; contentTypeId?: string };

async function main() {
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const db = client.db("cultural_fit_busan");
  const places = db.collection<PlaceTarget>("places");

  const contentIds = (
    await db
      .collection<ScoreBoardRow>("score_board")
      .find({}, { projection: { _id: 0, contentId: 1 } })
      .toArray()
  )
    .map((d) => d.contentId)
    .filter(Boolean);
  console.log(`대상 ${contentIds.length}곳`);

  const targets = await places
    .find({ _id: { $in: contentIds } }, { projection: { contentTypeId: 1 } })
    .toArray();

  let ok = 0;
  let skipped = 0;
  const skippedIds: string[] = [];

  for (const t of targets) {
    if (!t.contentTypeId) {
      skipped++;
      skippedIds.push(`${t._id} (contentTypeId 없음)`);
      continue;
    }
    try {
      const detail = await fetchDetail(t._id, t.contentTypeId);
      await places.updateOne({ _id: t._id }, { $set: omitUndefined(detail) });
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
