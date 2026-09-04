import type { ChipOption, TripSection, TripSetup } from "@/types/trip";

/**
 * S03 조건 입력 화면 데이터.
 * 문구는 피그마 Page 2_최종 `S03 · 조건 입력`(1007:1857) 그대로.
 */

export const TRIP_SETUP_COPY = {
  title: "조건을 알려주세요",
  description: "선택한 조건을 바탕으로 더 잘 맞는 장소를 추천해 드려요.",
  footnote: "선택하지 않아도 추천 피드에 진입할 수 있어요",
  primaryCta: "추천 받기",
  secondaryCta: "건너뛰기",
  summaryCount: (n: number) => `${n}개 선택`,
} as const;

/** 섹션 5개 — 피그마 순서 그대로 */
export const TRIP_SECTIONS: TripSection[] = [
  {
    key: "travelWith",
    title: "함께하는 분",
    helperText: "복수로 고르실 수 있어요",
    multiple: true,
    options: [
      { value: "solo", label: "혼자" },
      { value: "friends_couple", label: "친구·연인" },
      { value: "parents", label: "부모님" },
      { value: "kid", label: "아이 동반" },
      { value: "pet", label: "반려동물 동반" },
    ],
  },
  {
    key: "walkingDifficulty",
    title: "보행 부담",
    multiple: true,
    options: [
      { value: "none", label: "무관" },
      { value: "long_walk", label: "오래 걷기 어려움" },
      { value: "stairs_slope", label: "계단·경사로 어려움" },
      { value: "stroller", label: "유모차 사용" },
      { value: "wheelchair", label: "휠체어·보조기구" },
    ],
  },
  {
    key: "transport",
    title: "이동 수단",
    multiple: false,
    options: [
      { value: "walk", label: "도보 우선" },
      { value: "transit", label: "대중교통" },
      { value: "car", label: "자동차" },
    ],
  },
  {
    key: "foodRestriction",
    title: "음식 제약",
    helperText: "고르신 항목은 추천에서 아예 제외합니다",
    multiple: true,
    options: [
      { value: "none", label: "특별히 없어요" },
      { value: "spicy", label: "매운 음식" },
      { value: "vegan", label: "채식·비건" },
      { value: "raw_meat", label: "날고기" },
      { value: "raw_seafood", label: "회·생해산물" },
    ],
  },
  {
    key: "currentSituation",
    title: "현재 상황",
    multiple: true,
    options: [
      { value: "rain", label: "비가 와요" },
      { value: "time_rich", label: "시간이 넉넉해요" },
      { value: "before_meal", label: "식사 전" },
      { value: "indoor", label: "실내 우선" },
      { value: "outdoor", label: "야외 선호" },
      { value: "right_now", label: "지금 바로 갈 수 있는 곳" },
      { value: "avoid_crowd", label: "혼잡 피하기" },
    ],
  },
];

// === 조건부 확장 ===
// "함께하는 분"에서 특정 칩을 고르면 펼쳐지는 하위 질문

export const CHILD_AGE_EXPANSION = {
  /** travelWith 에 이 값이 있을 때 노출 */
  trigger: "kid",
  title: "아이는 몇 살인가요?",
  helperText: "여러 명이면 가장 어린 아이를 기준으로 골라주세요",
  options: [
    { value: "age_0_3", label: "0~3세" },
    { value: "age_4_7", label: "4~7세" },
    { value: "age_8_13", label: "8~13세" },
    { value: "age_14_18", label: "14~18세" },
  ] satisfies ChipOption[],
} as const;

export const PET_EXPANSION = {
  trigger: "pet",
  title: "반려동물과 어떻게 이동하시나요?",
  helperText: "캐리어를 쓰시면 실내도 가능한 곳이 늘어납니다",
  options: [
    { value: "leash", label: "목줄·하네스" },
    { value: "carrier", label: "이동가방·캐리어" },
    { value: "both", label: "둘 다 사용" },
  ] satisfies ChipOption[],
} as const;

// === 초기값 ===

export const DEFAULT_TRIP_SETUP: TripSetup = {
  travelWith: [],
  childAgeGroup: null,
  petTravelMode: null,
  walkingDifficulty: [],
  transport: null,
  foodRestriction: [],
  currentSituation: [],
};

/** 선택 요약 고정 바에 쓸 라벨 목록 (선택 순서대로) */
export function summaryLabels(setup: TripSetup): string[] {
  const labels: string[] = [];
  const find = (options: readonly ChipOption[], value: string) =>
    options.find((o) => o.value === value)?.label;

  for (const section of TRIP_SECTIONS) {
    const value = setup[section.key];

    if (Array.isArray(value)) {
      value.forEach((v) => {
        const label = find(section.options, v);
        if (label) labels.push(label);
      });
    } else if (typeof value === "string") {
      const label = find(section.options, value);
      if (label) labels.push(label);
    }

    // 조건부 확장은 트리거 섹션 바로 뒤에 붙인다
    if (section.key === "travelWith") {
      if (setup.childAgeGroup) {
        const label = find(CHILD_AGE_EXPANSION.options, setup.childAgeGroup);
        if (label) labels.push(label);
      }
      if (setup.petTravelMode) {
        const label = find(PET_EXPANSION.options, setup.petTravelMode);
        if (label) labels.push(label);
      }
    }
  }

  return labels;
}
