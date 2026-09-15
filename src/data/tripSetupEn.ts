/**
 * S03(조건 입력) 영문 텍스트 — `tripSetup.ts`(한국어 정본)의 번역본.
 *
 * `TRIP_QUESTIONS`/`TRIP_SETUP_COPY` 구조·엔진 값(`value`)은 그대로 두고, id·value로
 * 찾아 쓰는 조회용 상수만 따로 둔다 — 기존 구조를 안 건드려서 소피 쪽 컴포넌트
 * 수정 범위를 최소로 줄인다. 쓰는 쪽 예시:
 *
 *   const copy = locale === "en" ? TRIP_SETUP_COPY_EN : TRIP_SETUP_COPY;
 *   const qText = locale === "en" ? TRIP_QUESTION_TEXT_EN[question.id] : question;
 *
 * 9/15 — 시트에 영문 컬럼이 없어 여기서 직접 옮겼다(DRAFT 취급, quiz.ts/profile.ts와
 * 같은 원칙). 시트에 `*_en` 컬럼이 생기면 그쪽이 정본이 된다.
 */

export const TRIP_SETUP_COPY_EN = {
  title: "Tell us about your trip",
  description:
    "We'll factor in who's with you, how you're getting around, and your situation right now to find the best places.",
  emptySummary: "No conditions selected",
  clearAll: (n: number) => `Clear ${n}`,
  singleHint: "Choose one",
  primaryCta: "Get recommendations",
  skipCta: "Skip",
  fillNotice:
    "Please choose a condition in each section. If none applies, you can pick \"Nothing bothers me\" or \"No food restrictions\".",
  incompleteHint: "Please choose something in this section",
} as const;

type OptionText = { label: string; description: string };

export const TRIP_QUESTION_TEXT_EN: Record<
  string,
  {
    title: string;
    helperText?: string;
    options: Record<string, OptionText>;
    toggles?: Record<string, OptionText>;
  }
> = {
  CMP01: {
    title: "Who's with you",
    helperText: "Pick one, and add kids or pets if they're joining too.",
    options: {
      solo: { label: "Solo", description: "We'll find places that fit your own pace and plans." },
      friend_couple: {
        label: "Friends · partner",
        description: "We'll find places to talk and enjoy together.",
      },
      parents: {
        label: "Parents",
        description: "We'll find places you can both enjoy comfortably.",
      },
    },
    toggles: {
      childWith: {
        label: "With kids",
        description: "We'll factor in age-appropriate safety and interest.",
      },
      petWith: {
        label: "With a pet",
        description: "We'll check whether pets are allowed and how you're carrying them.",
      },
    },
  },
  CHILD01: {
    title: "How old is your child?",
    helperText: "If there's more than one, pick the youngest.",
    options: {
      infant: {
        label: "0–3",
        description: "We'll prioritize strollers, nursing, restrooms, and short distances.",
      },
      preschool: {
        label: "4–7",
        description: "We'll prioritize short, intuitive experiences in safe spaces.",
      },
      elementary: {
        label: "8–13",
        description: "We'll factor in hands-on activities and learning elements.",
      },
      teen: {
        label: "14–18",
        description: "We'll factor in photo spots, trends, and independent experiences.",
      },
    },
  },
  PET01: {
    title: "How are you carrying your pet?",
    helperText: "With a carrier, more indoor places become an option.",
    options: {
      leash: {
        label: "Leash · harness",
        description: "We'll check outdoor-accessible areas and entry restrictions.",
      },
      carrier: {
        label: "Carrier bag",
        description: "We'll check places that allow indoor entry with a carrier.",
      },
      both: {
        label: "Both",
        description: "We'll check conditions for both leash and carrier.",
      },
    },
  },
  MOB01: {
    title: "Walking difficulty",
    options: {
      none: { label: "Nothing bothers me", description: "No walking-related conditions applied." },
      long_walk: {
        label: "Long walks are hard",
        description: "We'll favor places with less walking and room to rest.",
      },
      stairs_slope: {
        label: "Stairs · slopes are hard",
        description: "We'll check for stairs, steep slopes, and alternate routes.",
      },
      stroller: {
        label: "Using a stroller",
        description: "We'll check for stroller-friendly paths and entrances.",
      },
      wheelchair: {
        label: "Wheelchair · mobility aid",
        description: "We'll check confirmed accessible entrances, restrooms, and routes.",
      },
    },
  },
  TRN01: {
    title: "Getting around",
    options: {
      walk: { label: "Mostly on foot", description: "We'll connect nearby places centered on walking." },
      transit: {
        label: "Public transit",
        description: "We'll factor in transit access and transfer burden.",
      },
      car: { label: "Car", description: "We'll factor in drive time and confirmed parking info." },
    },
  },
  FOOD01: {
    title: "Food restrictions",
    helperText: "Tell us what you'd like to avoid.",
    options: {
      none: { label: "No food restrictions", description: "No food-related conditions applied." },
      spicy: {
        label: "Spicy food",
        description: "We'll exclude candidates with a confirmed spicy-food conflict.",
      },
      vegan: {
        label: "Vegetarian · vegan",
        description: "We'll check for confirmed vegetarian/vegan options.",
      },
      raw_meat: {
        label: "Raw meat",
        description: "We'll exclude candidates confirmed to serve raw meat.",
      },
      raw_seafood: {
        label: "Raw seafood",
        description: "We'll exclude candidates confirmed to be raw-seafood-focused.",
      },
      pork: {
        label: "Pork",
        description:
          "We'll favor places with confirmed pork-free options and exclude confirmed conflicts.",
      },
    },
  },
  CTX01: {
    title: "Right now",
    options: {
      time_flexible: {
        label: "I have plenty of time",
        description: "We'll allow places with longer visits and a more relaxed pace.",
      },
      before_meal: {
        label: "Before a meal",
        description: "We'll place food spots earlier in the course.",
      },
      indoor_first: {
        label: "Indoor first",
        description: "We'll prioritize confirmed indoor or covered places.",
      },
      outdoor_preferred: {
        label: "Prefer outdoors",
        description: "We'll prioritize places centered on outdoor experiences.",
      },
      available_now: {
        label: "Somewhere I can go right now",
        description: "We'll check current operating status and how far it is.",
      },
      avoid_crowd: {
        label: "Avoid crowds",
        description: "We'll prioritize candidates with lower expected congestion (not live data).",
      },
      none: {
        label: "Nothing in particular",
        description:
          "No extra situational adjustment applied. Automatic weather/season/time adjustments still apply.",
      },
    },
  },
};
