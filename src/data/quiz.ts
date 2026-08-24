import type { QuizStepData, QuizOptionData, QuizAnswers, HardFilter } from "@/types/cfp";

export const QUIZ_STEPS: QuizStepData[] = [
  {
    stepNumber: 1,
    categoryLabel: "여행 · COMPANION",
    title: "누구와 함께\n오셨나요?",
    description: "동행에 맞춰 장소를 추천해 드립니다.",
    options: [
      { value: "solo", label: "혼자", description: "나만의 속도로 자유롭게" },
      { value: "couple", label: "연인과", description: "둘이서 분위기 있게" },
      { value: "friends", label: "친구와", description: "함께 즐길 수 있는 곳" },
      { value: "family", label: "가족과", description: "편하고 안전한 곳 위주" },
    ],
  },
  {
    stepNumber: 2,
    categoryLabel: "이동 · WALKING",
    title: "오늘 얼마나\n걸으실 수 있나요?",
    description: "무리 없는 거리 안에서 안내해 드릴게요.",
    options: [
      { value: "short", label: "가까운 곳 위주로", description: "도보 10분 안쪽으로 안내" },
      { value: "medium", label: "적당히", description: "도보 15분 안쪽으로 안내" },
      { value: "long", label: "많이 걸어도 괜찮아요", description: "도보 20분까지 안내" },
    ],
  },
  {
    stepNumber: 3,
    categoryLabel: "분위기 · ATMOSPHERE",
    title: "어떤 분위기를\n좋아하세요?",
    description: "선호하는 분위기에 맞춰 안내해 드립니다.",
    options: [
      { value: "quiet", label: "조용한", description: "사람 적고 한적한 곳" },
      { value: "both", label: "둘 다", description: "상황에 따라 다른 편" },
      { value: "vivid", label: "활기찬", description: "사람 많고 북적이는 곳" },
    ],
  },
  {
    stepNumber: 4,
    categoryLabel: "장소 · PLACE TYPE",
    title: "어떤 장소에\n더 끌리세요?",
    description: "현지 분위기를 선호하는 정도를 알려주세요.",
    options: [
      { value: "familiar", label: "유명하고 익숙한 곳", description: "검증된 명소와 알려진 맛집" },
      { value: "both", label: "반반이요", description: "둘 다 섞여 있으면 좋겠어요" },
      { value: "local", label: "현지인이 다니는 낯선 곳 (local 위주)", description: "관광지보다 로컬 골목과 재래시장" },
    ],
  },
  {
    stepNumber: 5,
    categoryLabel: "동선 · PACE",
    title: "여행 동선은\n어떤 편이세요?",
    description: "한 곳에 머무는 시간에 맞춰 동선을 짜드립니다.",
    options: [
      { value: "slow", label: "한두 곳에서 오래 머물기", description: "여유롭게 한 곳을 깊이 경험" },
      { value: "both", label: "적당히요", description: "상황에 따라 다른 편" },
      { value: "walk", label: "최대한 많이 돌아보기", description: "짧게 여러 곳을 빠르게 경험" },
    ],
  },
  {
    stepNumber: 6,
    categoryLabel: "음식 · PALATE",
    title: "매운 음식은\n어디까지 괜찮으세요?",
    description: "부산 대표 음식 중에는 매운 것이 많습니다.",
    options: [
      { value: "mild", label: "순한 편이 좋아요", description: "맵지 않은 메뉴를 우선 안내" },
      { value: "both", label: "조금 매운 정도까지", description: "아주 매운 건 부담" },
      { value: "hot", label: "매운 것도 괜찮아요", description: "돼지국밥 부추무침, 밀면까지" },
    ],
  },
];

export const TOTAL_STEPS = QUIZ_STEPS.length;

// === S01-7 Hard Filter 데이터 ===

export const HARD_FILTER_CANNOT_EAT: QuizOptionData[] = [
  { value: "raw_fish", label: "날것 · 회", description: "활어회, 육회 등 익히지 않은 음식" },
  { value: "all_seafood", label: "해산물 전체", description: "조개·생선·갑각류 모두" },
  { value: "pork", label: "돼지고기", description: "" },
];

export const HARD_FILTER_VEGAN: QuizOptionData[] = [
  { value: "none", label: "해당 없음", description: "" },
  { value: "partial", label: "부분 채식", description: "고기는 피하지만 해산물·달걀은 괜찮아요" },
  { value: "full", label: "완전 채식", description: "동물성 재료가 없는 곳만" },
];

export const HARD_FILTER_DINING: QuizOptionData[] = [
  { value: "anywhere", label: "어디든 괜찮아요", description: "시장 좌판, 포장마차, 서서 먹는 곳도" },
  { value: "seated", label: "앉을 자리가 있는 곳", description: "테이블과 의자가 있는 식당 위주" },
];

// === 초기값 (onboarding + profile 공용) ===

export const DEFAULT_QUIZ_ANSWERS: QuizAnswers = {
  companion: null,
  walkingDistance: null,
  atmosphere: null,
  placeType: null,
  pace: null,
  palate: null,
};

export const DEFAULT_HARD_FILTER: HardFilter = {
  cannotEat: [],
  veganStatus: null,
  diningPreference: null,
};
