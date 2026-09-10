import type { TripQuestion, TripSetup } from "@/types/trip";

/**
 * S03 조건 입력 화면 데이터 — 구글 시트 S03 문항 탭(`CMP01`~`ACT01`) 사본.
 * 시트가 바뀌면 이 파일만 고친다.
 */

export const TRIP_SETUP_COPY = {
  title: "여행 조건을 알려주세요",
  description:
    "여행을 함께하는 사람과 이동 방식 지금 상황까지 고려해 최적의 장소를 찾아드려요.",
  emptySummary: "조건 미선택",
  clearAll: (n: number) => `${n}개 선택해제`,
  singleHint: "단일 선택",
  primaryCta: "추천 받기",
  optionalNotice: "선택하지 않아도 추천 피드에 진입할 수 있어요",
} as const;

/** 시트 순서 그대로. 조건부 문항은 트리거 바로 뒤에 온다. */
export const TRIP_QUESTIONS: TripQuestion[] = [
  {
    id: "CMP01",
    key: "primary_companion",
    title: "함께하는 분",
    helperText: "한 분을 고르고, 아이·반려동물은 함께 고를 수 있어요.",
    options: [
      {
        value: "SOLO",
        label: "혼자",
        description: "내 일정과 속도에 맞는 장소를 찾습니다.",
      },
      {
        value: "FRIEND_COUPLE",
        label: "친구·연인",
        description: "함께 이야기하고 즐길 수 있는 장소를 찾습니다.",
      },
      {
        value: "PARENTS",
        label: "부모님",
        description: "함께 편안하게 이용할 수 있는 장소를 찾습니다.",
      },
    ],
    toggles: [
      {
        key: "child_with",
        option: {
          value: "CHILD",
          label: "아이 동반",
          description: "아이의 연령을 확인해 안전성과 흥미를 반영합니다.",
        },
      },
      {
        key: "pet_with",
        option: {
          value: "PET",
          label: "반려동물 동반",
          description: "동반 허용 여부와 이동 조건을 확인합니다.",
        },
      },
    ],
  },
  {
    id: "CHILD01",
    key: "child_age_group",
    title: "아이는 몇 살인가요?",
    helperText: "여러 명이면 가장 어린 아이를 기준으로 골라주세요.",
    showWhen: { key: "child_with", equals: true },
    options: [
      {
        value: "INFANT",
        label: "0~3세",
        description: "유모차·수유·화장실과 짧은 이동을 우선 확인합니다.",
      },
      {
        value: "PRESCHOOL",
        label: "4~7세",
        description: "짧고 직관적인 체험과 안전한 공간을 우선 확인합니다.",
      },
      {
        value: "ELEMENTARY",
        label: "8~13세",
        description: "참여형 체험과 활동·학습 요소를 확인합니다.",
      },
      {
        value: "TEEN",
        label: "14~18세",
        description: "사진·트렌드·자율적인 경험 요소를 확인합니다.",
      },
    ],
  },
  {
    id: "PET01",
    key: "pet_carry",
    title: "반려동물과 어떻게 이동하시나요?",
    helperText: "캐리어를 쓰시면 실내도 가능한 곳이 늘어납니다.",
    showWhen: { key: "pet_with", equals: true },
    options: [
      {
        value: "LEASH",
        label: "목줄·하네스",
        description: "실외 이용 가능 구간과 입장 제한을 확인합니다.",
      },
      {
        value: "CARRIER",
        label: "이동가방·캐리어",
        description: "캐리어 조건으로 실내 입장이 가능한 곳을 확인합니다.",
      },
      {
        value: "BOTH",
        label: "둘 다 사용",
        description: "목줄과 캐리어 조건을 모두 확인합니다.",
      },
    ],
  },
  {
    id: "MOB01",
    key: "mobility_care",
    multiple: true,
    title: "보행 부담",
    options: [
      {
        value: "NONE",
        exclusive: true,
        label: "무관",
        description: "별도의 보행 조건을 적용하지 않습니다.",
      },
      {
        value: "LONG_WALK",
        label: "오래 걷기 어려움",
        description: "긴 보행을 줄이고 휴식 가능한 장소를 우선합니다.",
      },
      {
        value: "STAIRS",
        label: "계단·경사로 어려움",
        description: "계단·급경사와 대체 동선을 확인합니다.",
      },
      {
        value: "STROLLER",
        label: "유모차 사용",
        description: "유아차 이동 가능한 통로와 출입 환경을 확인합니다.",
      },
      {
        value: "WHEELCHAIR",
        label: "휠체어·보조기구",
        description: "확인된 무장애 출입구·화장실·동선을 확인합니다.",
      },
    ],
  },
  {
    id: "TRN01",
    key: "transport_mode",
    title: "이동 수단",
    options: [
      {
        value: "WALK",
        label: "도보 우선",
        description: "가까운 장소를 보행 중심으로 연결합니다.",
      },
      {
        value: "TRANSIT",
        label: "대중교통",
        description: "대중교통 접근성과 환승 부담을 반영합니다.",
      },
      {
        value: "CAR",
        label: "자동차",
        description: "차량 이동시간과 확인된 주차 정보를 반영합니다.",
      },
    ],
  },
  {
    id: "FOOD01",
    key: "food_restriction",
    multiple: true,
    title: "음식 제약",
    helperText: "피하고 싶은 음식과 식단 조건을 알려주세요.",
    options: [
      {
        value: "NONE",
        exclusive: true,
        label: "특별히 없어요",
        description: "별도의 음식 제약을 적용하지 않습니다.",
      },
      {
        value: "NO_SPICY",
        label: "매운 음식",
        description: "매운 음식과의 충돌이 확인된 후보를 제외합니다.",
      },
      {
        value: "VEGAN",
        label: "채식·비건",
        description: "검증된 채식·비건 선택 가능 여부를 확인합니다.",
      },
      {
        value: "NO_RAW_MEAT",
        label: "날고기",
        description: "날고기 제공 여부가 확인된 후보를 제외합니다.",
      },
      {
        value: "NO_RAW_SEAFOOD",
        label: "회·생해산물",
        description: "회·생해산물 중심 여부가 확인된 후보를 제외합니다.",
      },
      {
        value: "NO_PORK",
        label: "돼지고기",
        description:
          "돼지고기 없는 선택지가 확인된 장소를 우선하고, 충돌이 확인된 후보는 제외합니다.",
      },
    ],
  },
  {
    id: "CTX01",
    key: "current_context",
    multiple: true,
    title: "현재 상황",
    options: [
      {
        value: "TIME_FLEXIBLE",
        label: "시간이 넉넉해요",
        description: "체류시간이 긴 장소와 여유 있는 코스를 허용합니다.",
      },
      {
        value: "BEFORE_MEAL",
        label: "식사 전",
        description: "음식 장소를 코스 앞부분에 우선 배치합니다.",
      },
      {
        value: "INDOOR_FIRST",
        conflictsWith: ["OUTDOOR_PREFERRED"],
        label: "실내 우선",
        description: "실내·차양이 확인된 장소를 우선합니다.",
      },
      {
        value: "OUTDOOR_PREFERRED",
        label: "야외 선호",
        description: "야외 경험이 중심인 장소를 우선합니다.",
      },
      {
        value: "AVAILABLE_NOW",
        label: "지금 바로 갈 수 있는 곳",
        description: "현재 운영 여부와 이동 가능 범위를 확인합니다.",
      },
      {
        value: "AVOID_CROWD",
        label: "혼잡 피하기",
        description:
          "실시간이라고 표현하지 않고 예상 혼잡이 낮은 후보를 우선합니다.",
      },
      {
        value: "NONE",
        exclusive: true,
        label: "특별히 없어요",
        description:
          "추가 상황 보정을 적용하지 않습니다. 자동 날씨·계절·시간 보정은 유지됩니다.",
      },
    ],
  },
];

export const DEFAULT_TRIP_SETUP: TripSetup = {
  primary_companion: null,
  child_with: false,
  pet_with: false,
  child_age_group: null,
  pet_carry: null,
  mobility_care: [],
  transport_mode: null,
  food_restriction: [],
  current_context: [],
};

/** 지금 화면에 보여야 하는 문항만 (조건부 문항 필터) */
export function visibleQuestions(setup: TripSetup): TripQuestion[] {
  return TRIP_QUESTIONS.filter((q) => {
    if (!q.showWhen) return true;
    return setup[q.showWhen.key] === q.showWhen.equals;
  });
}

/** 요약 바 라벨. 문항 순서대로, 조건부 문항 값도 포함한다 */
export function summaryLabels(setup: TripSetup): string[] {
  const labels: string[] = [];

  for (const question of visibleQuestions(setup)) {
    const value = setup[question.key];
    const picked = Array.isArray(value) ? value : value ? [value] : [];

    for (const code of picked) {
      const label = question.options.find((o) => o.value === code)?.label;
      if (label) labels.push(label);
    }

    for (const toggle of question.toggles ?? []) {
      if (setup[toggle.key]) labels.push(toggle.option.label);
    }
  }

  return labels;
}
