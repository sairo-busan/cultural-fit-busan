/**
 * S02 취향 결과 화면 데이터 — 구글 시트 `2_03A_CF8프로필`(gid=252207444) 사본.
 *
 * 유나 9/9 지정: S02 사용자 화면에는 `profile_name` 과 `ui_*` 컬럼만 쓴다.
 * `axis_*` 는 유형·계산 확인용, `engine_*` 은 추천 엔진 내부용이라 여기 넣지 않는다.
 *
 * 유형별 화면을 8개 만들지 않는다. 같은 레이아웃에서 이 데이터만 갈아끼운다.
 *
 * ─────────────────────────────────────────────────────────────
 * ⚠️ 시트가 자주 바뀐다. 9/7→9/9 이틀 사이 유형명 3개가 바뀌었다.
 *    시트가 갱신되면 **이 파일만** 고치면 된다. 화면 코드는 건드리지 않는다.
 *
 * ⚠️ CLV 의 rhythmTitle 은 시트에 "가볍게, 다양하게 (or 자유로운 이동)" 으로
 *    검토 흔적이 남아 있어 괄호를 뺐다. 유나 확인 필요.
 *
 * ⚠️ 영문은 전부 초안(DRAFT)이다. 시트에 영문 컬럼이 없어 코드에서 임시로 만들었다.
 *    유형명 8개는 `lib/cfp.ts` 의 `nameEn`(시트 `04_CF8_유형`)을 따랐는데,
 *    ELV · EFD · EFV 셋은 한글이 바뀐 뒤 갱신되지 않은 옛 이름이다.
 *    시트에 `*_en` 컬럼이 생기면 그쪽이 정본이고 여기는 사본이 된다.
 * ─────────────────────────────────────────────────────────────
 */

import type { Cf8Code } from "@/types/cfp";
import type { Locale } from "@/i18n/routing";

/** 축 카드 하나 — 슬라이더 위치 라벨 + 제목 + 설명 */
export type AxisCard = {
  /** 선택값 · 바 위치 (`ui_*_value`) */
  value: string;
  /** 카드 제목 (`ui_*_title`) */
  title: string;
  /** 카드 설명 (`ui_*_body`) */
  body: string;
};

export type Cf8ProfileCopy = {
  /** 내 여행 유형 제목 (`profile_name`) */
  profileName: string;
  /** 유형 소개 첫 문장 (`ui_result_intro`) */
  resultIntro: string;
  /** 추천 방향 두 번째 문장 (`ui_recommendation_promise`) */
  recommendationPromise: string;
  /** "부산에서 이렇게 여행해요" 카드 3종 */
  atmosphere: AxisCard;
  place: AxisCard;
  rhythm: AxisCard;
};

export const CF8_PROFILES: Record<Locale, Record<Cf8Code, Cf8ProfileCopy>> = {
  ko: {
    CLD: {
      profileName: "조용한 골목 산책자",
      resultIntro: "부산의 골목과 바다 곁 동네를 천천히 걸으며 지역의 분위기와 이야기를 오래 발견하는 여행자예요.",
      recommendationPromise: "한적한 골목과 로컬 장소를 중심으로, 이동을 줄이고 충분히 머무는 여행을 구성해드릴게요.",
      atmosphere: {
        value: "차분",
        title: "차분한 부산",
        body: "북적임을 피해 조용한 공간에서 부산을 천천히 느껴요.",
      },
      place: {
        value: "로컬",
        title: "골목 속 부산",
        body: "골목과 동네를 따라 부산의 일상과 이야기를 발견해요.",
      },
      rhythm: {
        value: "깊게",
        title: "천천히, 깊게",
        body: "장소 수를 줄이고 한 곳의 매력을 충분히 경험해요.",
      },
    },
    CLV: {
      profileName: "조용한 로컬 탐험가",
      resultIntro: "부산의 골목과 동네를 천천히 걸으며, 관광지 너머에 숨은 분위기와 이야기를 발견하는 여행자예요.",
      recommendationPromise: "유명한 곳보다 나만 알고 싶은 골목이 더 궁금하다면, 당신만의 속도로 부산의 사이사이를 찾아볼까요?",
      atmosphere: {
        value: "차분",
        title: "차분한 부산",
        body: "북적임을 피해 편안한 공간에서 부산을 천천히 느껴요.",
      },
      place: {
        value: "로컬",
        title: "골목 속 부산",
        body: "골목과 동네를 따라 걸으며 관광지에서는 지나치기 쉬운 부산의 일상과 이야기를 발견해요.",
      },
      rhythm: {
        value: "다양하게",
        title: "가볍게, 다양하게",
        body: "정해진 일정에 쫓기기보다, 마음이 가는 곳에 충분히 머물며 다음 장소로 천천히 이어가요.",
      },
    },
    CFD: {
      profileName: "느긋한 뷰 감상자",
      resultIntro: "부산을 대표하는 풍경과 명소를 서두르지 않고 오래 바라보며, 한곳의 매력을 깊이 느끼는 여행자예요.",
      recommendationPromise: "부산의 대표적인 풍경과 명소를 서두르지 않고 즐기고 싶다면, 당신의 속도에 맞는 여행을 시작해볼까요?",
      atmosphere: {
        value: "차분",
        title: "차분한 부산",
        body: "북적임을 피해 편안한 분위기 속에서 부산의 풍경을 천천히 즐겨요.",
      },
      place: {
        value: "명소",
        title: "부산의 대표 명소",
        body: "부산을 상징하는 명소에서 이 도시만의 대표적인 풍경과 매력을 만나요.",
      },
      rhythm: {
        value: "깊게",
        title: "천천히, 깊게",
        body: "장소를 많이 둘러보기보다 한곳에 충분히 머물며 여행의 순간을 깊게 경험해요.",
      },
    },
    CFV: {
      profileName: "조용한 명소 수집가",
      resultIntro: "부산의 대표적인 장면들을 차분한 흐름으로 하나씩 담아가는 여행자예요.",
      recommendationPromise: "유명한 명소도 서두르지 않고, 나만의 속도로 둘러보고 싶다면 당신의 취향에 맞는 부산의 대표적인 순간들을 만나볼까요?",
      atmosphere: {
        value: "차분",
        title: "차분한 부산",
        body: "북적임을 피해 편안한 공간에서 부산을 천천히 느껴요.",
      },
      place: {
        value: "명소",
        title: "부산의 대표 명소",
        body: "부산을 상징하는 명소에서 도시를 대표하는 풍경과 매력을 만나요.",
      },
      rhythm: {
        value: "다양하게",
        title: "가볍게, 다양하게",
        body: "한곳에만 머무르기보다 서로 다른 장소를 이어 부산의 다양한 모습을 경험해요.",
      },
    },
    ELD: {
      profileName: "시장 골목 정착자",
      resultIntro: "부산의 시장과 골목을 천천히 누비며, 사람들의 일상과 도시의 생동감을 가까이에서 느끼는 여행자예요.",
      recommendationPromise: "사람 냄새 나는 시장과 골목에서 부산의 진짜 분위기를 오래 느끼고 싶다면, 당신에게 맞는 부산의 사이사이를 찾아볼까요?",
      atmosphere: {
        value: "활기",
        title: "활기찬 부산",
        body: "사람들의 움직임과 이야기가 가득한 공간에서 부산만의 생동감과 에너지를 느껴요",
      },
      place: {
        value: "로컬",
        title: "골목 속 부산",
        body: "관광지의 풍경을 넘어 시장과 골목을 따라 부산 사람들의 일상과 이야기를 만나요.",
      },
      rhythm: {
        value: "깊게",
        title: "천천히, 깊게",
        body: "여러 곳을 서둘러 지나가기보다 마음에 드는 공간에 오래 머물며 부산을 더 깊이 경험해요.",
      },
    },
    ELV: {
      profileName: "활기찬 동네 탐험가",
      resultIntro: "부산의 시장과 동네 곳곳을 가볍게 누비며, 지역마다 다른 분위기와 활기를 즐기는 여행자예요.",
      recommendationPromise: "사람들의 일상과 에너지가 살아 있는 곳을 따라 부산을 더 다양하게 만나고 싶다면, 당신에게 맞는 부산의 사이사이를 찾아볼까요?",
      atmosphere: {
        value: "활기",
        title: "활기찬 부산",
        body: "사람들의 움직임과 이야기가 가득한 공간에서 부산만의 생동감과 에너지를 느껴요.",
      },
      place: {
        value: "로컬",
        title: "골목 속 부산",
        body: "골목과 동네를 따라 걸으며 관광지 너머에 있는 부산의 일상과 이야기를 발견해요.",
      },
      rhythm: {
        value: "다양하게",
        title: "가볍게, 다양하게",
        body: "한곳에 오래 머무르기보다 서로 다른 장소를 가볍게 오가며 부산의 다양한 매력을 경험해요",
      },
    },
    EFD: {
      profileName: "활기찬 명소 감상자",
      resultIntro: "부산의 대표 명소에서 느껴지는 활기와 풍경, 다양한 볼거리를 충분히 즐길 때 만족이 큰 여행자예요.",
      recommendationPromise: "사람들의 에너지와 볼거리가 가득한 부산의 대표 명소를, 서두르지 않고 충분히 즐기고 싶다면 지금 바로 여행을 시작해볼까요?",
      atmosphere: {
        value: "활기",
        title: "활기찬 부산",
        body: "사람들의 움직임과 다양한 즐길 거리가 가득한 공간에서 부산의 생동감과 에너지를 느껴요.",
      },
      place: {
        value: "명소",
        title: "부산의 대표 명소",
        body: "부산을 상징하는 대표 명소에서 도시를 대표하는 풍경과 다양한 매력을 만나요.",
      },
      rhythm: {
        value: "깊게",
        title: "천천히, 깊게",
        body: "여러 곳을 빠르게 둘러보기보다 한 곳에 충분히 머물며 그 장소의 매력을 깊이 경험해요.",
      },
    },
    EFV: {
      profileName: "인기 명소 탐방가",
      resultIntro: "부산의 대표 명소와 인기 있는 장면을 찾아다니며, 다양한 부산의 매력을 경험하는 여행자예요.",
      recommendationPromise: "부산을 대표하는 명소들을 하나씩 둘러보며, 놓치고 싶지 않은 부산의 다양한 장면을 만나고 싶다면 여행을 시작해볼까요?",
      atmosphere: {
        value: "활기",
        title: "활기찬 부산",
        body: "사람과 움직임이 가득한 공간에서 부산의 생동감과 에너지를 느껴요.",
      },
      place: {
        value: "명소",
        title: "부산의 대표 명소",
        body: "부산을 상징하는 대표 명소에서 도시를 대표하는 풍경과 매력을 만나요.",
      },
      rhythm: {
        value: "다양하게",
        title: "가볍게, 다양하게",
        body: "한곳에 오래 머무르기보다 서로 다른 장소를 이어가며 부산의 다양한 매력을 경험해요.",
      },
    },
  },

  // DRAFT — 아래 전부 초안
  en: {
    CLD: {
      profileName: "Quiet Alley Wanderer",
      resultIntro:
        "You walk Busan's alleys and seaside neighbourhoods slowly, uncovering the mood and the stories that sit there.",
      recommendationPromise:
        "We'll put quiet alleys and local spots first, with less walking between them and more time in each.",
      atmosphere: {
        value: "Calm",
        title: "A calmer Busan",
        body: "Away from the crowd, you take the city in slowly.",
      },
      place: {
        value: "Local",
        title: "Busan in its alleys",
        body: "You follow lanes and neighbourhoods to find everyday life and its stories.",
      },
      rhythm: {
        value: "In depth",
        title: "Slow and deep",
        body: "Fewer places, each one given enough time.",
      },
    },
    CLV: {
      profileName: "Quiet Local Explorer",
      resultIntro:
        "You wander Busan's alleys and neighbourhoods at your own pace, finding the mood and stories that sit beyond the sights.",
      recommendationPromise:
        "If a lane you'd keep to yourself interests you more than a famous view, let's look between the landmarks.",
      atmosphere: {
        value: "Calm",
        title: "A calmer Busan",
        body: "Away from the crowd, you take the city in at ease.",
      },
      place: {
        value: "Local",
        title: "Busan in its alleys",
        body: "Walking the lanes, you notice the daily life a tour would pass by.",
      },
      rhythm: {
        value: "Variety",
        title: "Light and varied",
        body: "Rather than a fixed schedule, you linger where it feels right and move on when it doesn't.",
      },
    },
    CFD: {
      profileName: "Slow View Watcher",
      resultIntro:
        "You look at Busan's defining views and landmarks without hurrying, letting one place hold you for a while.",
      recommendationPromise:
        "If you'd rather take in the famous views unhurried, let's build the day around your pace.",
      atmosphere: {
        value: "Calm",
        title: "A calmer Busan",
        body: "Away from the crowd, you enjoy the scenery at ease.",
      },
      place: {
        value: "Landmark",
        title: "Busan's landmarks",
        body: "At the places that symbolise the city, you meet its signature views.",
      },
      rhythm: {
        value: "In depth",
        title: "Slow and deep",
        body: "Rather than covering ground, you stay long enough for the moment to land.",
      },
    },
    CFV: {
      profileName: "Quiet Landmark Collector",
      resultIntro:
        "You gather Busan's defining scenes one by one, at a calm and steady pace.",
      recommendationPromise:
        "Famous places, none of them rushed — let's meet the city's signature moments on your terms.",
      atmosphere: {
        value: "Calm",
        title: "A calmer Busan",
        body: "Away from the crowd, you take the city in at ease.",
      },
      place: {
        value: "Landmark",
        title: "Busan's landmarks",
        body: "At the places that symbolise the city, you meet its defining views.",
      },
      rhythm: {
        value: "Variety",
        title: "Light and varied",
        body: "Rather than staying put, you link different places to see the city's many sides.",
      },
    },
    ELD: {
      profileName: "Market Alley Settler",
      resultIntro:
        "You move through Busan's markets and alleys slowly, feeling the daily life and the energy up close.",
      recommendationPromise:
        "If you want to sit inside the real texture of Busan for a while, let's find the lanes that hold it.",
      atmosphere: {
        value: "Lively",
        title: "A livelier Busan",
        body: "Where people and conversation fill the space, you feel the city's energy.",
      },
      place: {
        value: "Local",
        title: "Busan in its alleys",
        body: "Past the sights, markets and lanes carry the daily life of the people here.",
      },
      rhythm: {
        value: "In depth",
        title: "Slow and deep",
        body: "Rather than passing through, you stay where you like it and let the place open up.",
      },
    },
    ELV: {
      profileName: "Vivid Local Runner",
      resultIntro:
        "You move lightly through Busan's markets and neighbourhoods, enjoying how the energy changes street to street.",
      recommendationPromise:
        "If you want to meet Busan where daily life and energy are, let's move between its lanes.",
      atmosphere: {
        value: "Lively",
        title: "A livelier Busan",
        body: "Where people and conversation fill the space, you feel the city's energy.",
      },
      place: {
        value: "Local",
        title: "Busan in its alleys",
        body: "Walking the lanes, you find the daily life that sits beyond the sights.",
      },
      rhythm: {
        value: "Variety",
        title: "Light and varied",
        body: "Rather than staying put, you move lightly between places and collect their differences.",
      },
    },
    EFD: {
      profileName: "Hotspot Relaxer",
      resultIntro:
        "You are happiest taking in the energy, the views and the sheer amount to see at Busan's landmarks.",
      recommendationPromise:
        "If you want the busy landmarks but without hurrying, let's start the day right here.",
      atmosphere: {
        value: "Lively",
        title: "A livelier Busan",
        body: "Where movement and things to do fill the space, you feel the city's energy.",
      },
      place: {
        value: "Landmark",
        title: "Busan's landmarks",
        body: "At the places that define the city, you meet its views and its variety.",
      },
      rhythm: {
        value: "In depth",
        title: "Slow and deep",
        body: "Rather than moving quickly, you stay long enough to take a place in.",
      },
    },
    EFV: {
      profileName: "Landmark Hopper",
      resultIntro:
        "You seek out Busan's landmarks and the scenes everyone talks about, taking in as many sides of the city as you can.",
      recommendationPromise:
        "Landmark to landmark, none of them missed — let's meet the many faces of Busan.",
      atmosphere: {
        value: "Lively",
        title: "A livelier Busan",
        body: "Where people and movement fill the space, you feel the city's energy.",
      },
      place: {
        value: "Landmark",
        title: "Busan's landmarks",
        body: "At the places that define the city, you meet its signature views.",
      },
      rhythm: {
        value: "Variety",
        title: "Light and varied",
        body: "Rather than staying put, you link places to see the many sides of Busan.",
      },
    },
  },
};
