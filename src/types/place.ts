/**
 * S10(추천 피드)/S20(장소 상세) 등 장소 관련 화면이 백엔드(/api/recommend)로부터 받는 타입.
 * 화면ID는 피그마 IA v4.0 기준 — docs/화면_IA.md 참고.
 *
 * Model B(9/10 회의, docs/decisions/2026-09-11_DB필드_확정.md) 적용 —
 * places(TourAPI 원본) + score_board(DB_01) + place_info(DB_02) + place_by_cf8(DB_03)를
 * 서버에서 조인한 응답 형태. placeTags 컬렉션은 더 안 씀.
 *
 * `whyKo`·`weatherType`·`petAllowed`는 필드명을 그대로 유지했다(화면 코드 안 건드리려고,
 * 9/14 PR#18 리뷰 코멘트) — 값의 출처만 옛 placeTags에서 DB_01/02로 바뀌었다.
 * 나머지 옛 필드(92번 시트 원시 태깅 — noiseLevel·crowdLevel·stayMinutes·placeType 등)는
 * DB_01/02/03에 대응 컬럼이 없어 그대로 유지하되 값은 계속 null이 된다 — 화면이 이미
 * null-safe하게 짜여 있어(`.filter(Boolean)`, `??`, 폴백) 카드에서 그 부분만 덜 보일 뿐
 * 깨지지 않는다.
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
  weatherType: "indoor" | "outdoor" | "mixed" | null; // mixed = 실내외 겸용(예: 자갈치시장). 정본 시트 실데이터 값 기준
  bestTime: string | null;
  placeType: "식음형" | "시장형" | "해양야경형" | "문화역사형" | null;
  fitSolo: number | null; // 1~5
  tipType: string | null;
  tipHeadline: string | null;
  pro: string | null;
  con: string | null;
  whyKo: string | null; // = DB_02.place_desc (S10 카드 한 줄, 장소 단위)
  whyEn: string | null; // 번역 전까지 null

  seatingType: "street" | "indoor" | "mixed" | null;
  fitCouple: number | null; // 1~5, 동반 적합도
  fitFriends: number | null;
  fitFamily: number | null;
  stayMinutes: number | null; // 평균 체류시간(분)
  budgetLevel: number | null; // 1~4
  proEn: string | null;
  conEn: string | null;
  infoKo: string | null; // 이용 방법·실용 정보
  infoEn: string | null;
  sourceUrl: string | null;
  taggedStatus: "review" | "done" | null; // 태깅 사람검수 상태

  // === place_id (DB_01/02/03 조인 키, content_id로 이 응답을 만들 때만 서버 내부에서 씀) ===
  placeId: string | null;

  // === CF8 6분할 점수(DB_01, Model B) — cf8Match.ts가 코드 3글자로 3개를 골라 합산 ===
  calmnessScore: number | null; // 0~3, 차분함(C)
  energyScore: number | null; // 0~3, 에너지(E)
  localScore: number | null; // 0~3, 로컬(L)
  landmarkScore: number | null; // 0~3, 대표명소(F)
  stayDeeplyScore: number | null; // 0~3, 깊게머무름(D)
  diverseExperienceScore: number | null; // 0~3, 다양하게경험(V)

  // === 동행별 점수(DB_01) — situationalScore.ts가 선택한 컬럼들을 합산 ===
  soloScore: number | null;
  coupleFriendScore: number | null;
  parentsScore: number | null;
  kidsScore: number | null;
  petScore: number | null;

  // === 날씨/계절/시간대별 점수(DB_01) — 접속 시점 기준 하나씩만 골라 씀 ===
  sunnyScore: number | null;
  rainyScore: number | null;
  cloudyScore: number | null;
  springScore: number | null;
  summerScore: number | null;
  autumnScore: number | null;
  winterScore: number | null;
  morningScore: number | null;
  afternoonScore: number | null;
  eveningScore: number | null;

  // === 하드필터 — 전부 "확인된 false"와 "미등록(null)"을 구분한다 ===
  /** TourAPI 콘텐츠타입 등으로 자동 파생. "식사 전" 미선택 시 식당 제외에 씀 */
  isRestaurant: boolean | null;
  /** 무장애 API 파생값(ingest-places.ts) — "이동약자 배려시설 있음" */
  barrierFree: boolean | null;
  /** DB_01 수작업 태깅(API 시드 + 유나 보완) */
  petAllowed: boolean | null;

  /** S20 상세용 — (CF8코드 → 문구) 8개, DB_03. 서버는 유저 코드를 모르니 다 내려주고 클라이언트가 고른다 */
  reasonByCf8: Record<string, string | null>;

  // === APP S20 전용 (목데이터 확장, 에린 API 확정 후 구조 조정 예정) ===
  titleEn?: string | null;
  howToUse?: string[] | null; // 이용 방법 3단계
  reviewGood?: string | null;
  reviewBad?: string | null;
  reviewTip?: string | null;
  parking?: string | null;
  alternativeIds?: string[]; // 대안 장소 contentId 목록 (정본 alt_id_1/alt_id_2)
};

/**
 * S10 피드용 — 클라이언트 추천엔진(recommendEngine.ts)이 Place에 얹는 필드.
 * 서버(/api/recommend)는 개인화 없이 원본만 주고, fitScore·reasons·rank는 브라우저에서
 * 계산해 붙인다(개인정보 서버 미전송 원칙). GPS 제거로 거리 표시는 없다.
 */
export type RecommendedPlace = Place & {
  fitScore: number; // 0~100
  reasons: string[]; // 문장형 근거(whyKo 우선, 없으면 최강축 문장)
  tags: string[]; // 짧은 라벨, S10 카드용. 예: ["활기", "바다"]
  /** GPS 제거(9/10 회의)로 항상 null — 옛 화면(PlaceCard.tsx 등) 호환용으로만 남김 */
  distanceMin: number | null;
};
