/**
 * S02 취향 결과 화면용 표시 데이터 (CF8 3축)
 *
 * 화면 정본: 피그마 Page 2_최종 `S02 · 취향 결과`(1007:1769)
 *
 * ⚠️ 피그마 목업에는 C·L·D 방향 문구 3종만 있다. 나머지 E·F·V 3종은
 *    같은 톤으로 작성한 초안이며 유나 확인이 필요하다. (아래 `origin` 표기 참고)
 */

// === 축 슬라이더 양극 라벨 ===

export const AXIS_CONFIG = [
  { key: "atmosphere", left: "차분", right: "활기" },
  { key: "placeType", left: "현지", right: "명소" },
  { key: "experience", left: "한 곳", right: "여러 곳" },
] as const;

// === "이런 스타일이에요" — 축 방향별 카드 문구 ===

type AxisCopy = {
  title: string;
  description: string;
  /** figma = 목업에서 그대로 · draft = 같은 톤으로 작성한 초안 */
  origin: "figma" | "draft";
};

export const AXIS_STYLE: Record<string, AxisCopy> = {
  C: {
    title: "분위기 우선",
    description: "공간의 감성과 분위기를 가장 먼저 살펴요",
    origin: "figma",
  },
  E: {
    title: "생동감 우선",
    description: "사람과 볼거리가 만드는 활기를 먼저 즐겨요",
    origin: "draft",
  },
  L: {
    title: "우연한 발견",
    description: "검색보다 발길 닿는 곳에서 새로운 장소를 찾아요",
    origin: "figma",
  },
  F: {
    title: "확실한 선택",
    description: "부산이라면 꼭 봐야 할 곳부터 챙겨요",
    origin: "draft",
  },
  D: {
    title: "자유로운 이동",
    description: "정해진 동선 없이 느긋하게 둘러보는 걸 좋아해요",
    origin: "figma",
  },
  V: {
    title: "부지런한 발걸음",
    description: "짧게 머물더라도 여러 곳을 담고 싶어해요",
    origin: "draft",
  },
};

// === "이렇게 안내하겠습니다" — 축 방향별 안내 방식 ===

export const AXIS_GUIDE: Record<string, AxisCopy> = {
  C: {
    title: "분위기 좋은 곳 먼저",
    description: "사람이 몰리는 시간을 피해 안내합니다",
    origin: "figma",
  },
  E: {
    title: "활기 있는 곳 먼저",
    description: "사람과 볼거리가 모이는 시간대를 안내합니다",
    origin: "draft",
  },
  L: {
    title: "골목과 로컬 중심",
    description: "관광객이 많은 구간을 줄입니다",
    origin: "figma",
  },
  F: {
    title: "대표 명소 중심",
    description: "처음이라면 놓치기 쉬운 곳부터 안내합니다",
    origin: "draft",
  },
  D: {
    title: "여유로운 동선",
    description: "이동을 재촉하지 않는 순서로 짭니다",
    origin: "figma",
  },
  V: {
    title: "촘촘한 동선",
    description: "가까운 곳끼리 묶어 더 많이 담습니다",
    origin: "draft",
  },
};

// === 화면 문구 (피그마 S02) ===

export const PROFILE_COPY = {
  sectionLabel: "여행 스타일 진단 결과",
  typeLabel: "내 여행 유형",
  styleHeading: "이런 스타일이에요",
  guideHeading: "이렇게 안내하겠습니다",
  actionHint: "다음 단계를 선택하세요",
  primaryCta: "바로 추천받기",
  secondaryCta: "조건 더 알려주기",
  retry: "다시 하기",
} as const;
