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
  /** 저장한 장소 */
  saved: "cfb_saved",
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

/**
 * `cf8_code` 는 S02가 `useLocalStorage` 로 저장해 `"CLD"` 처럼 따옴표가 붙는다.
 * 엔진(`cf8FitScoreFromCode`)과 화면은 3글자 코드를 그대로 쓰므로 읽을 때 벗겨낸다.
 * 따옴표 없이 저장된 값도 그대로 통과시킨다.
 */
export function readCf8Code(): string | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(STORAGE_KEYS.cf8Code);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : null;
  } catch {
    return raw;
  }
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

// === 저장한 장소 ===

/**
 * 저장 시각을 함께 둔다.
 *
 * 예전에는 `string[]` 에 뒤로 붙이는 방식이라 배열 순서가 곧 저장순이었는데,
 * 그건 계약이 아니라 우연이다 — 중복 제거나 마이그레이션을 한 번이라도 하면
 * 순서가 조용히 뒤섞인다. 정렬 기준을 값 안에 둔다.
 *
 * 배포 전이라 마이그레이션은 넣지 않는다. 옛 값이 남은 브라우저는 저장 목록이
 * 비고, `Application` 탭에서 `cfb_saved` 를 지우면 된다.
 */
export type SavedPlace = { id: string; savedAt: string };

function isSavedPlace(v: unknown): v is SavedPlace {
  return (
    typeof v === "object" && v !== null &&
    typeof (v as SavedPlace).id === "string" &&
    typeof (v as SavedPlace).savedAt === "string"
  );
}

/** 최근 저장순. 옛 스키마(string[])가 남아 있으면 빈 배열로 떨어진다 */
export function readSavedPlaces(): SavedPlace[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEYS.saved) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isSavedPlace)
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  } catch {
    return [];
  }
}

/** 저장 목록을 화면이 비교할 수 있게 문자열로. `useStoredSnapshot` 은 원시값만 받는다 */
export function readSavedIdsKey(): string {
  return readSavedPlaces().map((p) => p.id).join(",");
}

export function isSaved(id: string): boolean {
  return readSavedPlaces().some((p) => p.id === id);
}

/** 저장/해제를 뒤집고 바뀐 목록을 돌려준다 */
export function toggleSaved(id: string, now = new Date()): SavedPlace[] {
  const current = readSavedPlaces();
  const next = current.some((p) => p.id === id)
    ? current.filter((p) => p.id !== id)
    : [...current, { id, savedAt: now.toISOString() }];

  localStorage.setItem(STORAGE_KEYS.saved, JSON.stringify(next));
  return next;
}
