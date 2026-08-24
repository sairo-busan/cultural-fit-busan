/**
 * TourAPI 코드 상수. 부산(lDongRegnCd=26) 범위만 다루므로
 * ldongCode2 / lclsSystmCode2를 매 요청 호출하지 않고 정적으로 고정.
 * (docs/TourAPI_오퍼레이션_정리.md 참고, 8/24 실제 호출로 확인한 값)
 */

export const BUSAN_REGION_CODE = "26";

export const BUSAN_DISTRICTS: Record<string, string> = {
  "110": "중구",
  "140": "서구",
  "170": "동구",
  "200": "영도구",
  "230": "부산진구",
  "260": "동래구",
  "290": "남구",
  "320": "북구",
  "350": "해운대구",
  "380": "사하구",
  "410": "금정구",
  "440": "강서구",
  "470": "연제구",
  "500": "수영구",
  "530": "사상구",
  "710": "기장군",
};

export const CONTENT_TYPE_NAMES: Record<string, string> = {
  "12": "관광지",
  "14": "문화시설",
  "15": "축제공연행사",
  "25": "여행코스",
  "28": "레포츠",
  "32": "숙박",
  "38": "쇼핑",
  "39": "음식점",
};

/** 분류체계 대분류(lclsSystm1) 코드명 */
export const CATEGORY_L1_NAMES: Record<string, string> = {
  AC: "숙박",
  C01: "추천코스",
  EV: "축제/공연/행사",
  EX: "체험관광",
  FD: "음식",
  HS: "역사관광",
  LS: "레저스포츠",
  NA: "자연관광",
  SH: "쇼핑",
  VE: "문화관광",
};
