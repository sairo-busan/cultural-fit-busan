import type { RecommendedPlace } from "@/types/place";

/**
 * ⚠️ 임시 초안. 태깅 시트의 `placeType` 이 채워지면 이 파일을 통째로 지운다.
 *
 * 시트에 컬럼은 있는데 값이 49건 전부 비어 있어(2026-09-14 실측) 분류 뱃지를
 * 그릴 수 없다. 화면 검토를 진행하려고 일부만 채운 것이다.
 *
 * 근거의 급이 두 가지로 다르다.
 *
 * 1. `BY_CONTENT_TYPE` — TourAPI 가 준 `contentTypeId` 다. 지어낸 값이 아니라
 *    관광공사 분류라 시트가 채워져도 크게 어긋나지 않을 것이다. 14 건.
 * 2. `OVERRIDE` — 내가 눈으로 찍었다. 근거가 없다. 나머지 두 유형(해양야경형·
 *    식음형)이 화면에 한 번도 안 나오면 뱃지 모양을 볼 수 없어서 넣었다.
 *
 * 34 건인 `contentTypeId=12`(관광지)는 시장·해변·전망대·산이 다 섞여 있어
 * 규칙으로 못 가른다. 그래서 대부분은 여전히 뱃지가 없다 — 실제로도 그게
 * 지금 데이터의 상태다.
 */

export type PlaceTypeDraft = "식음형" | "시장형" | "해양야경형" | "문화역사형";

/** TourAPI contentTypeId — 38 쇼핑 · 14 문화시설 */
const BY_CONTENT_TYPE: Record<string, PlaceTypeDraft> = {
  "38": "시장형",
  "14": "문화역사형",
};

/** 근거 없음. 뱃지 4종을 화면에서 확인하려고 손으로 찍은 값 */
const OVERRIDE: Record<string, PlaceTypeDraft> = {
  "126078": "해양야경형", // 광안리해수욕장
  "128164": "해양야경형", // 부산광안대교
  "126799": "해양야경형", // 민락수변공원
  "1277679": "해양야경형", // 부산타워
  "2721158": "해양야경형", // 천마산하늘전망대
  "252564": "해양야경형", // 75광장
  "126121": "해양야경형", // 용두산공원
  "1018702": "식음형", // 국제시장 먹자골목
  "127488": "식음형", // BIFF 광장
};

export function draftPlaceType(place: RecommendedPlace): PlaceTypeDraft | null {
  return (
    OVERRIDE[place.contentId] ??
    BY_CONTENT_TYPE[place.contentTypeId] ??
    null
  );
}
