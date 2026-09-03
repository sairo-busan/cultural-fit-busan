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
  /** S03 조건 입력 (FE-FEAT-004에서 사용) */
  hardFilter: "cfb-hard-filter",
} as const;

/** CFP16 시절 키. 남아 있으면 진단 초기화 시 함께 지운다. */
const LEGACY_KEYS = ["cfb-quiz-answers", "cfb-quiz-step"] as const;

/** 진단 관련 저장값 전체 삭제 (다시 하기) */
export function clearDiagnosis() {
  if (typeof window === "undefined") return;

  [
    STORAGE_KEYS.cf8Code,
    STORAGE_KEYS.answers,
    STORAGE_KEYS.step,
    STORAGE_KEYS.hardFilter,
    ...LEGACY_KEYS,
  ].forEach((key) => localStorage.removeItem(key));
}
