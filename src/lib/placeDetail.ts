/**
 * 장소 상세(S20) 단건 조회 — BE-FEAT-013.
 *
 * places(TourAPI 원본) + score_board(DB_01, placeId 역참조용) + place_info(DB_02) +
 * place_by_cf8(DB_03)을 contentId 하나 기준으로 조인한다. 목록(getRecommendations)과
 * 달리 개인화·필터링이 없는 단순 조회다.
 *
 * operationInfo/engOperationInfo는 TourAPI 원본 객체를 그대로 저장해둔 거라 콘텐츠
 * 타입마다 키 이름이 다르다(BE-FEAT-013 티켓 Context 참고) — 여기서 우선순위 목록으로
 * 골라 화면이 바로 쓸 문자열 하나로 정리한다.
 */

import { getDb } from "@/lib/mongodb";

type OperationInfo = Record<string, string>;

type PlaceDoc = {
  _id: string;
  contentTypeId: string;
  title: string;
  addr1: string | null;
  /** TourAPI 영문판(EngService2 detailCommon2) 있는 71곳은 그대로, 나머지 49곳은
   * 개정 로마자 표기법으로 직접 옮김(9/16, ingest-eng-address.ts/fill-addr-en-llm.ts) */
  addrEn?: string | null;
  mapX: number | null;
  mapY: number | null;
  firstImage: string | null;
  /** TourAPI에 사진이 없는 곳 직접 소싱한 대체 사진(9/16, upload-place-photos.ts) */
  customImage?: string | null;
  /** 대표 이미지(firstImage)의 공공누리 유형 — areaBasedList2 item 단위 값이라
   * 갤러리 사진들(imageSources)과는 별도로 온다 */
  cpyrhtDivCd?: string | null;
  images?: string[];
  /** 사진별 출처 표기용(9/16, ingest-places.ts) — url은 images와 같은 값, 공공누리
   * 유형(cpyrhtDivCd)만 이미지 단위로 따로 온다(장소 전체 cpyrhtDivCd와 다를 수 있음) */
  imageSources?: { url: string; cpyrhtDivCd: string | null }[];
  operationInfo?: OperationInfo;
  accessibilityInfo?: Record<string, string> | null;
  engContentId?: string;
  engOperationInfo?: OperationInfo;
  /** Phase 4(9/17), engContentId 없는 49곳용 LLM 번역 — fill-hours-en-manual.ts.
   * *SourceKo는 번역 당시 한국어 원문 스냅샷(check-stale-en-fields.ts가 매주 재적재 후 대조) */
  hoursEnManual?: string | null;
  hoursEnManualSourceKo?: string | null;
  closedDaysEnManual?: string | null;
  closedDaysEnManualSourceKo?: string | null;
};

/** 9/16 — #25 PR 리뷰 후속 요청. 유나가 그 사이 DB_01에 채운 4개 칸(score_board) */
type ScoreBoardRow = {
  placeId: string;
  contentId: string | null;
  indoorOutdoor: "INDOOR" | "OUTDOOR" | "MIXED" | null;
  petAllowed: boolean | null;
  petCondition: string | null;
  /** 9/17 영문 필드 감사(docs/decisions/2026-09-16_영문필드_감사.md) 후속, LLM 번역 */
  petConditionEn: string | null;
  placeType: string | null;
};

const INDOOR_OUTDOOR_MAP: Record<string, "indoor" | "outdoor" | "mixed"> = {
  INDOOR: "indoor",
  OUTDOOR: "outdoor",
  MIXED: "mixed",
};

type PlaceInfoDoc = {
  placeId: string;
  placeName: string | null;
  placeNameEn?: string | null;
  placeDesc: string | null;
  placeDescEn?: string | null;
  guideDetailKo?: string | null;
  /** 9/17 guideEn에서 이전 — 도슨트 구조 변경(간단히/자세히/팁 3종 영문 완성) */
  guideDetailEn?: string | null;
  guideSimpleKo?: string | null;
  /** 9/17 LLM 번역 */
  guideSimpleEn?: string | null;
  /** "관람 순서: …\n사진 포인트: …\n유의사항: …" 원문 그대로 (BE-FEAT-014) */
  guideTipsRawKo?: string | null;
  /** 9/17 LLM 번역, "Route: …\nPhoto spot: …\nCaution: …" 구조로 guideTipsRawKo와 대칭 */
  guideTipsRawEn?: string | null;
  /** 9/17 BE-FEAT-017, edge-tts 생성 후 Vercel Blob 업로드(upload-docent-audio-ko.ts) */
  audioUrlSimpleKo?: string | null;
  audioUrlDetailKo?: string | null;
  /** 9/17 BE-FEAT-018, en-US-JennyNeural(upload-docent-audio-en.ts) */
  audioUrlSimpleEn?: string | null;
  audioUrlDetailEn?: string | null;
  /** Phase 4(9/17), TourAPI 무장애여행에 영문 서비스가 없어 LLM 직접 번역
   * (fill-accessibility-en.ts). accessibilityInfoSourceKo는 번역 당시 원본 JSON 스냅샷 */
  accessibilityInfoEn?: Record<string, string> | null;
  accessibilityInfoSourceKo?: string | null;
};

type PlaceByCf8Doc = {
  cf8Code: string;
  placeId: string;
  recommendationReason: string | null;
  /** 9/17 LLM 번역 */
  recommendationReasonEn: string | null;
};

export type PlaceDetail = {
  contentId: string;
  addr1: string | null;
  addr1En: string | null;
  mapX: number | null;
  mapY: number | null;
  images: string[];
  /** 9/16 — 사진별 출처(공공누리 유형) 표기용. 표기 위치는 아직 미정(소피 확인 중) —
   * 위치 정해지기 전에 데이터만 먼저 내려준다. url은 images 배열과 같은 값이 겹친다 */
  imageSources: { url: string; cpyrhtDivCd: string | null }[];
  nameKo: string;
  nameEn: string | null;
  descKo: string | null;
  descEn: string | null;
  reasonByCf8: Record<string, string | null>;
  /** 9/17 영문 필드 감사 후속, LLM 번역 */
  reasonByCf8En: Record<string, string | null>;
  guideDetailKo: string | null;
  guideSimpleKo: string | null;
  guideDetailEn: string | null;
  guideSimpleEn: string | null;
  tipsKo: { route: string | null; photo: string | null; caution: string | null };
  /** 9/17 LLM 번역, guideTipsRawEn을 영문 라벨(Route:/Photo spot:/Caution:)로 분리 */
  tipsEn: { route: string | null; photo: string | null; caution: string | null };
  /** 9/17 BE-FEAT-017, 도슨트 한글 음성(간단히·자세히) */
  audioUrlSimpleKo: string | null;
  audioUrlDetailKo: string | null;
  /** 9/17 BE-FEAT-018, 도슨트 영문 음성(간단히·자세히) */
  audioUrlSimpleEn: string | null;
  audioUrlDetailEn: string | null;
  hours: string | null;
  closedDays: string | null;
  hoursEn: string | null;
  closedDaysEn: string | null;
  phone: string | null;
  accessibility: { key: string; text: string }[];
  /** Phase 4(9/17), LLM 번역(소스가 없는 경우가 대부분이라 부분 커버리지) */
  accessibilityEn: { key: string; text: string }[];
  /** DB_01(score_board) 신규 4칸(9/15 유나 추가, 9/16 상세 응답에 추가) */
  weatherType: "indoor" | "outdoor" | "mixed" | null;
  placeType: string | null;
  petAllowed: boolean | null;
  petCondition: string | null;
  /** 9/17 영문 필드 감사 후속, LLM 번역 */
  petConditionEn: string | null;
};

const HOURS_KEYS = ["usetime", "usetimeculture", "opentime", "usetimeleports"];
const CLOSED_KEYS = ["restdate", "restdateculture", "restdateshopping", "restdateleports"];
const PHONE_KEYS = ["infocenter", "infocenterculture", "infocentershopping", "infocenterleports"];

/** <br> → 줄바꿈, 앞뒤 공백 제거. 후보 키 중 값이 있는 첫 번째를 쓴다. */
function pickOperationValue(info: OperationInfo | undefined, keys: string[]): string | null {
  if (!info) return null;
  for (const key of keys) {
    const raw = info[key];
    if (raw && raw.trim() !== "") {
      return raw.replace(/<br\s*\/?>/gi, "\n").trim();
    }
  }
  return null;
}

/** 영문 값 중 `N/A (Open all year round)` 식으로 오는 걸 괄호 안만 남긴다. */
function cleanEnglishValue(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/^N\/A\s*\(([^)]*)\)$/i);
  return match ? match[1].trim() : value;
}

/** "라벨: 값" 줄 3개짜리 원문을 {route, photo, caution}으로 분리한다. */
function parseTips(raw: string | null | undefined): PlaceDetail["tipsKo"] {
  const empty = { route: null, photo: null, caution: null };
  if (!raw) return empty;

  const lines = raw.split("\n");
  const pick = (label: string) => {
    const line = lines.find((l) => l.trim().startsWith(label));
    return line ? line.trim().slice(label.length).trim() : null;
  };
  return {
    route: pick("관람 순서:"),
    photo: pick("사진 포인트:"),
    caution: pick("유의사항:"),
  };
}

/** guideTipsRawEn("Route: …\nPhoto spot: …\nCaution: …")을 같은 방식으로 분리한다. */
function parseTipsEn(raw: string | null | undefined): PlaceDetail["tipsEn"] {
  const empty = { route: null, photo: null, caution: null };
  if (!raw) return empty;

  const lines = raw.split("\n");
  const pick = (label: string) => {
    const line = lines.find((l) => l.trim().startsWith(label));
    return line ? line.trim().slice(label.length).trim() : null;
  };
  return {
    route: pick("Route:"),
    photo: pick("Photo spot:"),
    caution: pick("Caution:"),
  };
}

/** http:// → https:// (secureImageUrl 동등 로직 — main의 PR#18 병합 전이라 직접 둔다) */
function toHttps(url: string): string {
  return url.replace(/^http:\/\//, "https://");
}

export async function getPlaceDetail(contentId: string): Promise<PlaceDetail | null> {
  const db = await getDb();

  const place = await db.collection<PlaceDoc>("places").findOne({ _id: contentId });
  if (!place) return null;
  // 문서는 있어도 핵심 필드가 null이면(TourAPI 원본 소실·재적재 실패 등) "찾을 수 없음" —
  // 9/18 사고(addr1 null로 FE 크래시) 재발 방지, recommend.ts와 동일 가드
  if (!place.title || !place.addr1 || place.mapX == null || place.mapY == null) return null;

  const score = await db.collection<ScoreBoardRow>("score_board").findOne({ contentId });
  // score_board(큐레이션 118곳) 밖이면 TourAPI엔 있어도 "찾을 수 없음" —
  // 큐레이션이 곧 서비스 대상의 정의(9/18, TourAPI 원본 없는 곳 제외 확정)
  if (!score) return null;
  const placeId = score.placeId;

  const [info, reasonDocs] = await Promise.all([
    placeId ? db.collection<PlaceInfoDoc>("place_info").findOne({ placeId }) : Promise.resolve(null),
    placeId
      ? db.collection<PlaceByCf8Doc>("place_by_cf8").find({ placeId }).toArray()
      : Promise.resolve([]),
  ]);

  const reasonByCf8: Record<string, string | null> = {};
  const reasonByCf8En: Record<string, string | null> = {};
  for (const r of reasonDocs) {
    reasonByCf8[r.cf8Code] = r.recommendationReason;
    reasonByCf8En[r.cf8Code] = r.recommendationReasonEn;
  }

  // customImage(9/16 직접 소싱, 11곳)는 항상 갤러리에 합친다 — 영주하늘눈전망대처럼
  // images는 있는데 firstImage만 없는 곳도 있어서, "없을 때만" 조건으로는 안 걸린다.
  const images = Array.from(
    new Set(
      [place.firstImage, place.customImage, ...(place.images ?? [])].filter(
        (u): u is string => !!u
      )
    )
  ).map(toHttps);

  // 이미지별 출처 — imageSources(갤러리)에서 못 찾은 URL(대개 firstImage)은
  // 장소 단위 cpyrhtDivCd로 보충한다. 매칭은 URL로 하는데 대표 이미지가
  // http/https만 다르게 올 때가 있어 toHttps로 맞춘 뒤 비교한다.
  const sourceByUrl = new Map(
    (place.imageSources ?? []).map((s) => [toHttps(s.url), s.cpyrhtDivCd])
  );
  const imageSources = images.map((url) => ({
    url,
    cpyrhtDivCd: sourceByUrl.get(url) ?? place.cpyrhtDivCd ?? null,
  }));

  const accessibility = Object.entries(place.accessibilityInfo ?? {})
    .filter(([key, text]) => key !== "contentid" && typeof text === "string" && text.trim() !== "")
    .map(([key, text]) => ({ key, text }));
  const accessibilityEn = Object.entries(info?.accessibilityInfoEn ?? {}).map(([key, text]) => ({
    key,
    text,
  }));

  const weatherType = score?.indoorOutdoor ? INDOOR_OUTDOOR_MAP[score.indoorOutdoor] : null;

  return {
    contentId: place._id,
    addr1: place.addr1,
    addr1En: place.addrEn ?? null,
    mapX: place.mapX,
    mapY: place.mapY,
    images,
    imageSources,

    nameKo: info?.placeName ?? place.title,
    nameEn: info?.placeNameEn ?? null,
    descKo: info?.placeDesc ?? null,
    descEn: info?.placeDescEn ?? null,

    reasonByCf8,
    reasonByCf8En,

    guideDetailKo: info?.guideDetailKo ?? null,
    guideSimpleKo: info?.guideSimpleKo ?? null,
    guideDetailEn: info?.guideDetailEn ?? null,
    guideSimpleEn: info?.guideSimpleEn ?? null,
    tipsKo: parseTips(info?.guideTipsRawKo),
    tipsEn: parseTipsEn(info?.guideTipsRawEn),
    audioUrlSimpleKo: info?.audioUrlSimpleKo ?? null,
    audioUrlDetailKo: info?.audioUrlDetailKo ?? null,
    audioUrlSimpleEn: info?.audioUrlSimpleEn ?? null,
    audioUrlDetailEn: info?.audioUrlDetailEn ?? null,

    hours: pickOperationValue(place.operationInfo, HOURS_KEYS),
    closedDays: pickOperationValue(place.operationInfo, CLOSED_KEYS),
    // engOperationInfo(TourAPI 실제 영문, 71곳)가 우선, 없으면 hoursEnManual(LLM 번역,
    // 나머지 49곳 중 22곳 커버) 폴백. 둘 다 없으면 null — 화면이 한국어로 대신한다.
    hoursEn: cleanEnglishValue(pickOperationValue(place.engOperationInfo, HOURS_KEYS)) ?? place.hoursEnManual ?? null,
    closedDaysEn:
      cleanEnglishValue(pickOperationValue(place.engOperationInfo, CLOSED_KEYS)) ?? place.closedDaysEnManual ?? null,
    phone: pickOperationValue(place.operationInfo, PHONE_KEYS),

    accessibility,
    accessibilityEn,

    weatherType,
    placeType: score?.placeType ?? null,
    petAllowed: score?.petAllowed ?? null,
    petCondition: score?.petCondition ?? null,
    petConditionEn: score?.petConditionEn ?? null,
  };
}
