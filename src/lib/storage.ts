/**
 * localStorage 키 정의.
 *
 * `cf8_code` · `trip_setup` · `trip_setup_mode` 는 피그마 UXF2 온보딩 순서도에서
 * 확정된 이름이라 그대로 쓴다. 그 외 앱 내부 상태는 `cfb-` 접두사를 붙인다.
 */

export const STORAGE_KEYS = {
  /** CF8 진단 결과 코드 (예: "CLD"). 재방문 시 진단 건너뛰기 분기에 사용 */
  cf8Code: "cf8_code",
  /** S01 3문항 응답 */
  answers: "cfb-cf8-answers",
  /** S01 진행 중인 문항 번호 */
  step: "cfb-cf8-step",
  /** S03에서 저장하는 TripSetup 객체(JSON) — 피그마 UXF2 확정 키 */
  tripSetup: "trip_setup",
  /** "QUICK" | "CUSTOM" — S03 스킵 여부(04_추천로직 R024) */
  tripSetupMode: "trip_setup_mode",
  /** 구버전 진단의 음식 Hard Filter. S03로 대체됨 */
  hardFilter: "cfb-hard-filter",
} as const;

/**
 * `trip_setup_mode` 는 JSON이 아니라 원시 문자열로 저장한다.
 *
 * 추천 엔진(`useRecommendations`)이 `localStorage.getItem(...) === "CUSTOM"` 으로
 * 직접 비교하기 때문이다. `useLocalStorage` 훅은 `JSON.stringify` 를 거쳐
 * `"CUSTOM"`(따옴표 포함)으로 저장하므로, 그 훅을 쓰면 비교가 항상 실패해
 * QUICK으로 처리된다 — 에러 없이 S03 조건만 조용히 무시된다.
 */
export type TripSetupMode = "QUICK" | "CUSTOM";

export function setTripSetupMode(mode: TripSetupMode) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.tripSetupMode, mode);
}

/** CFP16 시절 키. 남아 있으면 진단 초기화 시 함께 지운다. */
const LEGACY_KEYS = ["cfb-quiz-answers", "cfb-quiz-step"] as const;

/** 진단 관련 저장값 전체 삭제 (다시 하기) */
export function clearDiagnosis() {
  if (typeof window === "undefined") return;

  [
    STORAGE_KEYS.cf8Code,
    STORAGE_KEYS.answers,
    STORAGE_KEYS.step,
    STORAGE_KEYS.tripSetup,
    STORAGE_KEYS.tripSetupMode,
    STORAGE_KEYS.hardFilter,
    ...LEGACY_KEYS,
  ].forEach((key) => localStorage.removeItem(key));
}
