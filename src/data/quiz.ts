import type { QuizQuestionData, QuizAnswers, HardFilter } from "@/types/cfp";

/**
 * S01 취향 진단 3문항.
 * 문구는 피그마 Page 2_최종 `S01 · 취향 진단`(1007:1661) 그대로.
 *
 * 축 값 매핑 — 4지선다는 -2/-1/+1/+2, 3지선다는 -2/0/+2.
 * 부호가 곧 축 코드이고, 세 코드를 이어붙이면 cf8_code가 된다 (C+L+D → CLD).
 * ⚠️ 이 매핑은 정본 시트(2지선다 -1/+1)에 없어 화면 단계 수에 맞춰 정한 것이다. 유나 확인 필요.
 */
export const QUIZ_QUESTIONS: QuizQuestionData[] = [
  {
    id: "CFQ01",
    answerKey: "atmosphere",
    stepLabel: "1단계 · 분위기",
    question: "지금 어떤 분위기의 여행을 원하시나요?",
    choices: [
      { label: "차분하고 여유로운 곳", value: -2 },
      { label: "조용하지만 볼거리는 있는 곳", value: -1 },
      { label: "적당히 사람이 있는 곳", value: 1 },
      { label: "활기차고 북적이는 곳", value: 2 },
    ],
  },
  {
    id: "CFQ02",
    answerKey: "placeType",
    stepLabel: "2단계 · 장소 발견",
    question: "장소는 어떻게 발견하고 싶으신가요?",
    choices: [
      { label: "숨은 골목과 로컬 분위기", value: -2 },
      { label: "현지인이 자주 가는 곳", value: -1 },
      { label: "알려졌지만 붐비지 않는 곳", value: 1 },
      { label: "부산의 대표 명소", value: 2 },
    ],
  },
  {
    id: "CFQ03",
    answerKey: "experience",
    stepLabel: "3단계 · 여행 방식",
    question: "여행 방식은 어떤 편인가요?",
    choices: [
      { label: "한 곳을 오래 즐기기", value: -2 },
      { label: "적당히 머물며 이동하기", value: 0 },
      { label: "여러 곳을 돌아보기", value: 2 },
    ],
  },
];

export const TOTAL_QUESTIONS = QUIZ_QUESTIONS.length;

// === 화면 문구 (피그마 S01) ===

export const QUIZ_INTRO = {
  eyebrow: "FIND YOUR STYLE",
  title: "여행 스타일 찾기",
  description: "세 가지만 고르면 나에게 맞는 부산이 보입니다.",
  footnote: "고른 답으로 나에게 맞는 부산 여행 유형을 찾아드려요.",
  submitHint: "세 문항을 모두 고르시면 결과가 나옵니다",
  submitLabel: "내 여행 스타일 확인하기",
} as const;

// === 초기값 (onboarding + profile 공용) ===

export const DEFAULT_QUIZ_ANSWERS: QuizAnswers = {
  atmosphere: null,
  placeType: null,
  experience: null,
};

/**
 * S03 조건 입력(FE-FEAT-004)에서 채울 값.
 * 지금은 빈 값으로 유지해 S10·S20 동작을 보존한다.
 */
export const DEFAULT_HARD_FILTER: HardFilter = {
  cannotEat: [],
  veganStatus: null,
  diningPreference: null,
};
