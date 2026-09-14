import type { Locale } from "@/i18n/routing";

/**
 * S02 취향 결과 화면의 구조 상수.
 *
 * 화면 정본: 피그마 Page 2_최종 `S02 · 취향 결과`(1007:1769)
 *
 * 유형별 문구는 여기 없다 — `src/data/cf8Profiles.ts`(시트 사본)에서 온다.
 * 여기에는 축 슬라이더의 양극 라벨과 화면 고정 문구만 둔다.
 *
 * ⚠️ 영문은 초안(DRAFT)이다. 시트에 영문 컬럼이 없어 코드에서 임시로 만들었다.
 *    시트에 `*_en` 컬럼이 생기면 그쪽이 정본이고 여기는 사본이 된다.
 */

// === 축 슬라이더 양극 라벨 ===

type AxisLabels = { left: string; right: string };

/** 축의 구조는 하나. 라벨만 로케일로 갈린다 — 구조를 복사하면 한쪽만 고치는 사고가 난다 */
export const AXIS_CONFIG = [
  { key: "atmosphere", card: "atmosphere" },
  { key: "placeType", card: "place" },
  { key: "experience", card: "rhythm" },
] as const;

export type AxisKey = (typeof AXIS_CONFIG)[number]["key"];

export const AXIS_LABELS: Record<Locale, Record<AxisKey, AxisLabels>> = {
  ko: {
    atmosphere: { left: "차분", right: "활기" },
    placeType: { left: "현지", right: "명소" },
    experience: { left: "한 곳", right: "여러 곳" },
  },
  // DRAFT
  en: {
    atmosphere: { left: "Calm", right: "Lively" },
    placeType: { left: "Local", right: "Landmark" },
    experience: { left: "One place", right: "Many places" },
  },
};

// === 화면 문구 (피그마 S02) ===

export type ProfileCopy = {
  sectionLabel: string;
  typeLabel: string;
  styleHeading: string;
  actionHint: string;
  primaryCta: string;
  secondaryCta: string;
  retry: string;
};

export const PROFILE_COPY: Record<Locale, ProfileCopy> = {
  ko: {
    sectionLabel: "여행 스타일 진단 결과",
    typeLabel: "내 여행 유형",
    styleHeading: "부산에서 이렇게 여행해요",
    actionHint: "다음 단계를 선택하세요",
    primaryCta: "바로 추천받기",
    secondaryCta: "조건 더 알려주기",
    retry: "다시 하기",
  },
  // DRAFT
  en: {
    sectionLabel: "Your result",
    typeLabel: "Your travel type",
    styleHeading: "How you travel in Busan",
    actionHint: "Where to next",
    primaryCta: "Show me places",
    secondaryCta: "Add trip conditions",
    retry: "Retake",
  },
};
