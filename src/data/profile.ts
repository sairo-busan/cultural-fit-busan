/**
 * S02 취향 결과 화면의 구조 상수.
 *
 * 화면 정본: 피그마 Page 2_최종 `S02 · 취향 결과`(1007:1769)
 *
 * 유형별 문구는 여기 없다 — `src/data/cf8Profiles.ts`(시트 사본)에서 온다.
 * 여기에는 축 슬라이더의 양극 라벨과 화면 고정 문구만 둔다.
 */

// === 축 슬라이더 양극 라벨 ===

export const AXIS_CONFIG = [
  { key: "atmosphere", card: "atmosphere", left: "차분", right: "활기" },
  { key: "placeType", card: "place", left: "현지", right: "명소" },
  { key: "experience", card: "rhythm", left: "한 곳", right: "여러 곳" },
] as const;

// === 화면 문구 (피그마 S02) ===

export const PROFILE_COPY = {
  sectionLabel: "여행 스타일 진단 결과",
  typeLabel: "내 여행 유형",
  styleHeading: "부산에서 이렇게 여행해요",
  actionHint: "다음 단계를 선택하세요",
  primaryCta: "바로 추천받기",
  secondaryCta: "조건 더 알려주기",
  retry: "다시 하기",
} as const;
