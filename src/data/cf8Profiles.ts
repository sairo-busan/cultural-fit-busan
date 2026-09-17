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
      profileName: "Quiet Alley Stroller",
      resultIntro:
        "You like to slow down in Busan's alleys and seaside neighborhoods, taking time to notice the mood, texture, and small stories around you.",
      recommendationPromise:
        "We'll prioritize quiet alleys and local spots, with shorter hops and more time to settle in.",
      atmosphere: {
        value: "Calm",
        title: "Busan at an easier pace",
        body: "Step away from the crowds and take Busan in slowly.",
      },
      place: {
        value: "Local",
        title: "Busan between the streets",
        body: "Follow small streets and neighborhoods into Busan's everyday stories.",
      },
      rhythm: {
        value: "Slow",
        title: "Stay longer",
        body: "Choose fewer stops and give each place time to unfold.",
      },
    },
    CLV: {
      profileName: "Quiet Local Explorer",
      resultIntro:
        "You like wandering Busan's alleys and neighborhoods at your own pace, finding local mood and stories beyond the main sights.",
      recommendationPromise:
        "If hidden lanes call to you more than famous views, we'll help you find Busan at your own pace.",
      atmosphere: {
        value: "Calm",
        title: "Busan at an easier pace",
        body: "Step away from the crowds and experience Busan at ease.",
      },
      place: {
        value: "Local",
        title: "Busan between the streets",
        body: "Walk the lanes and notice everyday moments most tours pass by.",
      },
      rhythm: {
        value: "Varied",
        title: "Keep it varied",
        body: "Skip the rigid schedule. Stay where it feels right, then move on when you're ready.",
      },
    },
    CFD: {
      profileName: "Slow View Seeker",
      resultIntro:
        "You like to linger with Busan's iconic views and landmarks, giving one place enough time to leave an impression.",
      recommendationPromise:
        "If you want Busan's best-known views without rushing, we'll shape the day around your pace.",
      atmosphere: {
        value: "Calm",
        title: "Busan at an easier pace",
        body: "Take in Busan's scenery at an easier, quieter pace.",
      },
      place: {
        value: "Iconic",
        title: "Busan's iconic sights",
        body: "Find the views and places that make Busan instantly recognizable.",
      },
      rhythm: {
        value: "Slow",
        title: "Stay longer",
        body: "Spend enough time in one place for the moment to settle in.",
      },
    },
    CFV: {
      profileName: "Calm Landmark Collector",
      resultIntro:
        "You like gathering Busan's signature scenes one by one, keeping the day calm, steady, and unhurried.",
      recommendationPromise:
        "If you want iconic Busan moments without a packed schedule, we'll guide you through them at an easy pace.",
      atmosphere: {
        value: "Calm",
        title: "Busan at an easier pace",
        body: "Step away from the crowds and experience Busan at ease.",
      },
      place: {
        value: "Iconic",
        title: "Busan's iconic sights",
        body: "Find the iconic views and places that define Busan.",
      },
      rhythm: {
        value: "Varied",
        title: "Keep it varied",
        body: "Connect different stops and see more sides of the city.",
      },
    },
    ELD: {
      profileName: "Market Alley Regular",
      resultIntro:
        "You like spending time in Busan's markets and alleys, feeling the city's daily rhythm and lively local energy up close.",
      recommendationPromise:
        "If you want to stay close to Busan's markets, lanes, and everyday energy, we'll find the local places that fit you.",
      atmosphere: {
        value: "Energetic",
        title: "Busan with more energy",
        body: "Feel Busan's energy in places full of people, movement, and conversation.",
      },
      place: {
        value: "Local",
        title: "Busan between the streets",
        body: "Go beyond the views and meet daily Busan in its markets and lanes.",
      },
      rhythm: {
        value: "Slow",
        title: "Stay longer",
        body: "Stay where it feels good and let the place open up over time.",
      },
    },
    ELV: {
      profileName: "Lively Neighborhood Explorer",
      resultIntro:
        "You like moving lightly through Busan's markets and neighborhoods, enjoying how the energy shifts from one area to the next.",
      recommendationPromise:
        "If you want to follow Busan's daily energy from neighborhood to neighborhood, we'll help you explore more of the in-between.",
      atmosphere: {
        value: "Energetic",
        title: "Busan with more energy",
        body: "Feel Busan's energy in places full of people, movement, and conversation.",
      },
      place: {
        value: "Local",
        title: "Busan between the streets",
        body: "Walk the lanes and find the daily life beyond the main sights.",
      },
      rhythm: {
        value: "Varied",
        title: "Keep it varied",
        body: "Move lightly between different places and enjoy how each one feels.",
      },
    },
    EFD: {
      profileName: "Lively Landmark Lounger",
      resultIntro:
        "You enjoy Busan most when you can settle into an iconic spot and take in its energy, views, and things to see.",
      recommendationPromise:
        "If you want lively landmarks with room to actually enjoy them, we'll start with places that match your rhythm.",
      atmosphere: {
        value: "Energetic",
        title: "Busan with more energy",
        body: "Feel Busan's energy in places filled with movement, views, and things to do.",
      },
      place: {
        value: "Iconic",
        title: "Busan's iconic sights",
        body: "At Busan's iconic spots, take in the views, energy, and variety.",
      },
      rhythm: {
        value: "Slow",
        title: "Stay longer",
        body: "Slow down and give one iconic place enough time to sink in.",
      },
    },
    EFV: {
      profileName: "Popular Landmark Hopper",
      resultIntro:
        "You like following Busan's iconic landmarks and talked-about scenes, experiencing as many sides of the city as you can.",
      recommendationPromise:
        "If you want to move from landmark to landmark and catch Busan's must-see moments, we'll build that route for you.",
      atmosphere: {
        value: "Energetic",
        title: "Busan with more energy",
        body: "Feel Busan's energy in places full of people and movement.",
      },
      place: {
        value: "Iconic",
        title: "Busan's iconic sights",
        body: "Visit the iconic places and views that define Busan.",
      },
      rhythm: {
        value: "Varied",
        title: "Keep it varied",
        body: "Move between iconic stops and see more sides of Busan.",
      },
    },
  },
};
