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
 *
 * 9/15 — 옛 92번 시트 원시 태깅 중 DB_01/02/03에 대응 컬럼이 없고 복귀 계획도 없는
 * 필드는 응답에서 뺐다(noiseLevel·crowdLevel·stayMinutes 등 30개). `placeType`만
 * 예외로 남긴다 — DB_01에 신규 컬럼으로 추가하기로 확정(9/15)됐고 유나 태깅 대기 중이라
 * "언젠가 값이 들어올 null"이지 "영구 죽은 필드"가 아니다.
 *
 * 이 필드들을 읽는 화면 쪽(main): `src/components/place/PlaceRow.tsx`(crowdLevel·
 * stayMinutes·budgetLevel), `src/app/[locale]/place/[id]/page.tsx`(나머지 대부분 —
 * 이 파일은 옛 S20이고 BE-FEAT-013 기반 새 S20으로 교체될 예정이라 필드별로 안 고치고
 * 새 S20이 교체할 때 같이 정리하는 쪽을 권장 — 소피에게 요청 필요).
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

  weatherType: "indoor" | "outdoor" | "mixed" | null; // mixed = 실내외 겸용(예: 자갈치시장). 정본 시트 실데이터 값 기준
  /** DB_01 신규 컬럼(9/15 확정, 유나 태깅 대기) — 채워지기 전까지 항상 null */
  placeType: "식음형" | "시장형" | "해양야경형" | "문화역사형" | null;
  whyKo: string | null; // = DB_02.place_desc (S10 카드 한 줄, 장소 단위)
  whyEn: string | null; // = DB_02.place_desc_en

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

  titleEn?: string | null; // = DB_02.place_name_en
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
