/**
 * S10(추천 피드)/S20(장소 상세) 등 장소 관련 화면이 백엔드(/api/places)로부터 받는 타입.
 * 화면ID는 피그마 IA v4.0 기준 — docs/화면_IA.md 참고.
 * places(raw) + placeTags(큐레이션)를 서버에서 조인한 응답 형태.
 * (docs/데이터_마트_정의서.md 참고)
 */

export type PlaceInfoItem = {
  name: string;
  text: string;
};

export type Place = {
  contentId: string;
  contentTypeId: string;
  title: string;
  addr1: string;
  addr2: string;
  mapX: number;
  mapY: number;
  firstImage: string | null;
  images: string[];
  homepage: string | null;
  overview: string | null;
  tel: string | null;
  cpyrhtDivCd: string | null;
  info: PlaceInfoItem[];

  // 축제(contentTypeId=15)만 해당, 그 외는 null
  eventStartDate: string | null;
  eventEndDate: string | null;

  // === placeTags (유나 태깅). 아직 태깅 안 된 장소는 전부 null, coverage=0 ===
  noiseLevel: number | null; // 1~5
  crowdLevel: number | null; // 1~5
  crowdPeak: string | null;
  crowdCalm: string | null;
  localDepth: number | null; // 1~5
  englishSupport: number | null; // 0~2 (0=불가, 1=메뉴판·표지판만, 2=대화 가능)
  spiceLevel: number | null; // 0~5, 0 = 음식점 아님
  weatherType: "indoor" | "outdoor" | "both" | null; // both = 실내외 겸용(예: 자갈치시장)
  bestTime: string | null;
  placeType: "식음형" | "시장형" | "해양야경형" | "문화역사형" | null;
  fitSolo: number | null; // 1~5
  tipType: string | null;
  tipHeadline: string | null;
  pro: string | null;
  con: string | null;
  whyKo: string | null;
  whyEn: string | null;
  coverage: number; // 0~100. 70+ 정상노출 / 40~69 하향노출 / 40미만 Hard Filter 제외

  // === APP S20 전용 (목데이터 확장, 에린 API 확정 후 구조 조정 예정) ===
  titleEn?: string | null;
  howToUse?: string[] | null; // 이용 방법 3단계
  reviewGood?: string | null;
  reviewBad?: string | null;
  reviewTip?: string | null;
  parking?: string | null;
  alternativeIds?: string[]; // 대안 장소 contentId 목록
};

/**
 * S10 피드용 — 추천엔진(에린 작업 중, 아직 미완성)이 Place에 얹어서 내려줄 필드.
 * 지금은 목업이라도 이 형태(fitScore, reasons)로 맞춰두면 나중에 엔진 붙을 때 교체만 하면 됨.
 */
export type RecommendedPlace = Place & {
  fitScore: number; // 0~100
  reasons: string[]; // 문장형 근거, S20 등 상세 설명용. 예: ["조용한 곳을 찾으신다면", "현지인이 가는 곳"]
  tags: string[]; // 짧은 라벨, S10 카드용. 예: ["활기", "바다"]
  distanceMin: number | null; // 도보 분, 위치 권한 없으면 null
};
