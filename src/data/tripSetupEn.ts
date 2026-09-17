/**
 * S03(조건 입력) 영문 텍스트 — `tripSetup.ts`(한국어 정본)의 번역본.
 *
 * `TRIP_QUESTIONS` 구조·엔진 값(`value`)은 그대로 두고, id·value로 찾아 쓰는
 * 조회용 상수만 따로 둔다. 화면 고정 문구는 messages `tripSetup` 에 있다.
 *
 * 9/15 — 시트에 영문 컬럼이 없어 여기서 직접 옮겼다(DRAFT 취급, quiz.ts/profile.ts와
 * 같은 원칙). 시트에 `*_en` 컬럼이 생기면 그쪽이 정본이 된다.
 */

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
    title: "Who's joining you?",
    helperText: "Choose one main option. Add kids or pets if they're coming along.",
    options: {
      solo: { label: "Solo", description: "We'll find places that fit your own pace and plans." },
      friend_couple: {
        label: "Friends or partner",
        description: "We'll find places to chat and spend time together.",
      },
      parents: {
        label: "Parents",
        description: "We'll find places everyone can enjoy comfortably.",
      },
    },
    toggles: {
      childWith: {
        label: "With kids",
        description: "We'll consider your child's age to find suitable, engaging places.",
      },
      petWith: {
        label: "With a pet",
        description: "We'll check pet policies and leash or carrier requirements.",
      },
    },
  },
  CHILD01: {
    title: "How old is your child?",
    helperText: "If you're bringing more than one child, choose the youngest child's age.",
    options: {
      infant: {
        label: "0–3",
        description: "We'll look for stroller access, nursing facilities, restrooms, and shorter trips.",
      },
      preschool: {
        label: "4–7",
        description: "We'll look for short, easy-to-follow activities and suitable spaces for young children.",
      },
      elementary: {
        label: "8–13",
        description: "We'll look for hands-on activities and chances to learn.",
      },
      teen: {
        label: "14–18",
        description: "We'll look for photo spots, trending places, and room to explore independently.",
      },
    },
  },
  PET01: {
    title: "Will your pet be on a leash or in a carrier?",
    helperText: "Some indoor places allow pets in carriers.",
    options: {
      leash: {
        label: "Leash or harness",
        description: "We'll check which outdoor areas allow pets and any entry restrictions.",
      },
      carrier: {
        label: "Pet carrier",
        description: "We'll check which indoor places allow pets in carriers.",
      },
      both: {
        label: "Both",
        description: "We'll check both leash and carrier requirements.",
      },
    },
  },
  MOB01: {
    title: "Walking & mobility",
    options: {
      none: { label: "No walking limitations", description: "We won't filter places by walking or mobility needs." },
      long_walk: {
        label: "Long walks are hard",
        description: "We'll prioritize places with less walking and spots to rest.",
      },
      stairs_slope: {
        label: "Stairs or slopes are difficult",
        description: "We'll check for stairs, steep slopes, and alternate routes.",
      },
      stroller: {
        label: "Using a stroller",
        description: "We'll check for stroller-friendly paths and entrances.",
      },
      wheelchair: {
        label: "Wheelchair or mobility aid",
        description: "We'll use verified information on accessible entrances, restrooms, and routes.",
      },
    },
  },
  TRN01: {
    title: "Getting around",
    options: {
      walk: { label: "Mostly on foot", description: "We'll link nearby places you can reach on foot." },
      transit: {
        label: "Public transit",
        description: "We'll consider transit access and how many transfers you'll need.",
      },
      car: { label: "Car", description: "We'll consider driving time and verified parking information." },
    },
  },
  FOOD01: {
    title: "Dietary needs",
    helperText: "Tell us about your diet and any foods you avoid.",
    options: {
      none: { label: "No food restrictions", description: "We won't filter places by dietary needs." },
      spicy: {
        label: "Spicy food",
        description: "We'll leave out places confirmed to be unsuitable if you avoid spicy food.",
      },
      vegan: {
        label: "Vegetarian or vegan",
        description: "We'll check for verified vegetarian or vegan options.",
      },
      raw_meat: {
        label: "Raw meat",
        description: "We'll leave out places confirmed to serve raw meat.",
      },
      raw_seafood: {
        label: "Raw seafood",
        description: "We'll leave out places known to specialize in raw seafood.",
      },
      pork: {
        label: "Pork",
        description:
          "We'll prioritize places with verified pork-free options and leave out places confirmed to be unsuitable.",
      },
    },
  },
  CTX01: {
    title: "Your plans right now",
    options: {
      time_flexible: {
        label: "I have plenty of time",
        description: "We'll include places where you can spend more time and explore at a relaxed pace.",
      },
      before_meal: {
        label: "Before a meal",
        description: "We'll put places to eat earlier in your itinerary.",
      },
      indoor_first: {
        label: "Prefer indoors",
        description: "We'll prioritize places confirmed to be indoors or covered.",
      },
      outdoor_preferred: {
        label: "Prefer outdoors",
        description: "We'll prioritize places to explore outdoors.",
      },
      available_now: {
        label: "Ready to go now",
        description: "We'll check opening hours and how far you can travel right now.",
      },
      avoid_crowd: {
        label: "Avoid crowds",
        description: "We'll prioritize places expected to be less busy, based on estimates rather than live crowd data.",
      },
      none: {
        label: "Nothing in particular",
        description:
          "We won't add any extra preferences. We'll still consider the weather, season, and time of day.",
      },
    },
  },
};
