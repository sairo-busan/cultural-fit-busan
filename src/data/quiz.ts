import type { QuizAnswers, HardFilter, AxisValue } from "@/types/cfp";
import type { Locale } from "@/i18n/routing";

/**
 * S01 취향 진단 3문항 — 구글 시트 `05_CFQ_취향문항`(gid=1808300501) 사본.
 * `1_03A-1_CF설문3문항`(gid=1069717930)과 문구가 동일하다.
 *
 * 전부 2지선다다. 왼쪽 `-1`, 오른쪽 `+1` (`4_03A-2_CF점수기준` `CALC_01`).
 * 부호가 곧 축 코드이고, 세 코드를 이어붙이면 cf8_code가 된다 (C+L+D → CLD).
 *
 * 피그마의 4/4/3지선다는 디자인 과정에서 만들어 본 임시안이며 최종안이 아니다
 * (유나 9/9 확정). 시트의 2지선다가 기준이다.
 *
 * ⚠️ 영문은 초안(DRAFT)이다. 시트에 영문 컬럼이 없어 코드에서 임시로 만들었다.
 *    시트에 `*_en` 컬럼이 생기면 그쪽이 정본이고 여기는 사본이 된다.
 */

/** 문항의 뼈대. 문구는 로케일별 표에서 온다 — 구조를 복사하면 한쪽만 고치는 사고가 난다 */
export const QUIZ_QUESTIONS = [
  { id: "CFQ01", answerKey: "atmosphere" },
  { id: "CFQ02", answerKey: "placeType" },
  { id: "CFQ03", answerKey: "experience" },
] as const satisfies readonly { id: string; answerKey: keyof QuizAnswers }[];

export type QuizId = (typeof QUIZ_QUESTIONS)[number]["id"];

export type QuizChoiceText = { label: string; description: string };

export type QuizQuestionText = {
  /** "1단계 · 분위기" */
  stepLabel: string;
  question: string;
  /** 시트 `helper_text` */
  helperText: string;
  /** 왼쪽(-1) · 오른쪽(+1) 순서 */
  choices: readonly [QuizChoiceText, QuizChoiceText];
};

/** 선택지의 축 값. 순서가 곧 부호다 */
export const CHOICE_VALUES: readonly [AxisValue, AxisValue] = [-1, 1];

export const QUIZ_TEXT: Record<Locale, Record<QuizId, QuizQuestionText>> = {
  ko: {
    CFQ01: {
      stepLabel: "1단계 · 분위기",
      question: "여행지에서 어떤 분위기에 더 끌리나요?",
      helperText: "지금 더 끌리는 쪽을 골라주세요.",
      choices: [
        {
          label: "차분하고 여유로운 공간",
          description:
            "조용하고 여유로운 공간에서 풍경과 분위기를 천천히 느끼고 싶어요.",
        },
        {
          label: "활기와 움직임이 느껴지는 공간",
          description:
            "사람과 볼거리로 생동감 있는 공간에서 현장의 활기를 느끼고 싶어요.",
        },
      ],
    },
    CFQ02: {
      stepLabel: "2단계 · 장소 발견",
      question: "부산에서 장소를 고를 때 어느 쪽에 더 끌리나요?",
      helperText: "장소를 고를 때 더 중요한 쪽을 골라주세요.",
      choices: [
        {
          label: "지역의 일상과 특성이 느껴지는 곳",
          description:
            "골목·시장·동네처럼 부산의 일상과 지역의 개성을 느끼고 싶어요.",
        },
        {
          label: "부산을 대표하는 잘 알려진 명소",
          description:
            "부산을 상징하고 처음 방문했다면 놓치고 싶지 않은 대표 장소를 보고 싶어요.",
        },
      ],
    },
    CFQ03: {
      stepLabel: "3단계 · 여행 방식",
      question: "시간이 충분할 때 여행 일정을 어떻게 구성하고 싶나요?",
      helperText: "시간 제약이 없다고 생각하고 더 끌리는 쪽을 골라주세요.",
      choices: [
        {
          label: "마음에 드는 한두 곳을 깊게 즐기기",
          description:
            "한두 곳에 충분히 머물며 장소의 분위기와 이야기를 깊게 즐기고 싶어요.",
        },
        {
          label: "서로 다른 여러 장소를 다양하게 경험하기",
          description:
            "여러 장소를 둘러보며 서로 다른 풍경과 경험을 다양하게 만나고 싶어요.",
        },
      ],
    },
  },

  // DRAFT — 아래 전부 초안
  en: {
    CFQ01: {
      stepLabel: "Step 1 · Atmosphere",
      question: "Which kind of place draws you in?",
      helperText: "Pick whichever appeals to you right now.",
      choices: [
        {
          label: "Calm and unhurried",
          description:
            "You want quiet space, taking in the scenery and the mood slowly.",
        },
        {
          label: "Lively and full of movement",
          description:
            "You want people and things to look at, and the energy of a busy place.",
        },
      ],
    },
    CFQ02: {
      stepLabel: "Step 2 · Finding places",
      question: "When choosing where to go in Busan, what matters more?",
      helperText: "Pick what matters more to you.",
      choices: [
        {
          label: "Where daily life happens",
          description:
            "Alleys, markets and neighbourhoods — the ordinary side of Busan.",
        },
        {
          label: "The landmarks Busan is known for",
          description:
            "The places that define the city and that a first visit shouldn't miss.",
        },
      ],
    },
    CFQ03: {
      stepLabel: "Step 3 · Itinerary",
      question: "With no time pressure, how would you plan your trip?",
      helperText: "Pick whichever draws you more.",
      choices: [
        {
          label: "One or two places, in depth",
          description:
            "You stay long enough to take in the mood and the story of a place.",
        },
        {
          label: "Several places, for variety",
          description:
            "You move between places to meet different scenes and experiences.",
        },
      ],
    },
  },
};

export const TOTAL_QUESTIONS = QUIZ_QUESTIONS.length;

// === 초기값 (onboarding + profile 공용) ===

export const DEFAULT_QUIZ_ANSWERS: QuizAnswers = {
  atmosphere: null,
  placeType: null,
  experience: null,
};

/**
 * S03 조건 입력에서 채울 값.
 * 지금은 빈 값으로 유지해 S10·S20 동작을 보존한다.
 */
export const DEFAULT_HARD_FILTER: HardFilter = {
  cannotEat: [],
  veganStatus: null,
  diningPreference: null,
};
