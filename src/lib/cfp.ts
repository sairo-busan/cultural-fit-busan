/**
 * CF8 진단 환산 — S01 응답 → cf8_code → S02 표시용 프로필
 *
 * 문항·문구 정본: `05_CFQ_취향문항`(gid=1808300501) — 3문항 전부 2지선다
 * 계산 정본:     `4_03A-2_CF점수기준`(gid=11755224) — CALC_01 왼쪽 -1 / 오른쪽 +1
 *
 * "CF8 코드 = left/right_code 3개 조합. 예: C + L + D → CLD"
 */

import type {
  QuizAnswers,
  HardFilter,
  AxisValue,
  Cf8Axes,
  Cf8Code,
  Cf8Profile,
  AtmosphereCode,
  PlaceTypeCode,
  ExperienceCode,
} from "@/types/cfp";

// === 8유형 메타데이터 ===

/**
 * ⚠️ 유형명이 탭마다 다르다. S02 화면 정본은 `2_03A_CF8프로필`(유나 9/9 지정)이다.
 *    `04_CF8_유형` 은 아직 갱신 전이라 ELV·EFD·EFV 세 개가 옛 이름으로 남아 있다.
 *    영문명은 `04_CF8_유형` 에만 있어 그대로 두지만, 한글이 어긋난 상태라 재확인이 필요하다.
 *
 * ⚠️ 이 상수는 FE-FEAT-007에서 `src/data/cf8Profiles.ts` 로 옮기고 삭제한다.
 *    시트가 자주 바뀌어(9/7→9/9 이틀 사이 3개 변경) 하드코딩 유지 비용이 크다.
 */
type Cf8TypeMeta = {
  /** `2_03A_CF8프로필` profile_name */
  nameKo: string;
  /** `04_CF8_유형` type_name_en — W2 i18n에서 사용 */
  nameEn: string;
  /** `2_03A_CF8프로필` engine_recommendation_reason */
  description: string;
};

const CF8_TYPES: Record<Cf8Code, Cf8TypeMeta> = {
  CLD: {
    nameKo: "조용한 골목 산책자",
    nameEn: "Quiet Alley Wanderer",
    description: "조용한 로컬 장소에 충분히 머물며 깊이 경험하는 성향을 반영했어요.",
  },
  CLV: {
    nameKo: "조용한 로컬 탐험가",
    nameEn: "Quiet Local Explorer",
    description: "차분한 로컬 장소를 다양하게 발견하는 성향을 반영했어요.",
  },
  CFD: {
    nameKo: "느긋한 뷰 감상자",
    nameEn: "Slow View Watcher",
    description: "부산 대표명소를 여유 있게 깊이 감상하는 성향을 반영했어요.",
  },
  CFV: {
    nameKo: "조용한 명소 수집가",
    nameEn: "Quiet Landmark Collector",
    description: "차분한 대표명소를 다양하게 둘러보는 성향을 반영했어요.",
  },
  ELD: {
    nameKo: "시장 골목 정착자",
    nameEn: "Market Alley Settler",
    description: "활기찬 로컬 공간에 머물며 현장을 깊이 경험하는 성향을 반영했어요.",
  },
  ELV: {
    nameKo: "활기찬 동네 탐험가",
    nameEn: "Vivid Local Runner",
    description: "생동감 있는 로컬 장소를 다양하게 발견하는 성향을 반영했어요.",
  },
  EFD: {
    nameKo: "활기찬 명소 감상자",
    nameEn: "Hotspot Relaxer",
    description: "활기찬 부산 대표명소를 충분히 체험하는 성향을 반영했어요.",
  },
  EFV: {
    nameKo: "인기 명소 탐방가",
    nameEn: "Landmark Hopper",
    description: "생동감 있는 대표명소를 다양하게 둘러보는 성향을 반영했어요.",
  },
};

/** 답이 없을 때 쓰는 기본 유형 — 왼쪽 끝으로 귀결 */
const FALLBACK_CODE: Cf8Code = "CLD";

// === 프리셋 (S00 건너뛰기용) ===

export const CF8_PRESETS = {
  quiet: "CLD",
  explorer: "CLV",
  lively: "EFV",
} as const satisfies Record<string, Cf8Code>;

// === 환산 ===

/**
 * 응답(축 값) → 3축.
 * 부호가 축 코드를 결정한다. 미응답 축은 왼쪽(−1)으로 채운다.
 */
function toAxis<T extends string>(
  value: AxisValue | null,
  left: T,
  right: T,
): { code: T; value: AxisValue } {
  const resolved: AxisValue = value ?? -1;
  return { code: resolved > 0 ? right : left, value: resolved };
}

export function calculateAxes(answers: QuizAnswers): Cf8Axes {
  return {
    atmosphere: toAxis<AtmosphereCode>(answers.atmosphere, "C", "E"),
    placeType: toAxis<PlaceTypeCode>(answers.placeType, "L", "F"),
    experience: toAxis<ExperienceCode>(answers.experience, "D", "V"),
  };
}

/** 3축 코드를 순서대로 이어붙여 cf8_code 산출 */
export function getCf8Code(axes: Cf8Axes): Cf8Code {
  const code = `${axes.atmosphere.code}${axes.placeType.code}${axes.experience.code}`;
  return isCf8Code(code) ? code : FALLBACK_CODE;
}

export function isCf8Code(value: string): value is Cf8Code {
  return value in CF8_TYPES;
}

export function getCf8TypeMeta(code: string): Cf8TypeMeta {
  return isCf8Code(code) ? CF8_TYPES[code] : CF8_TYPES[FALLBACK_CODE];
}

/** 세 문항에 모두 답했는지 */
export function isComplete(answers: QuizAnswers): boolean {
  return (
    answers.atmosphere !== null &&
    answers.placeType !== null &&
    answers.experience !== null
  );
}

/** 전체 프로필 빌드 */
export function buildCf8Profile(
  answers: QuizAnswers,
  hardFilter: HardFilter,
): Cf8Profile {
  const axes = calculateAxes(answers);
  const code = getCf8Code(axes);
  const meta = getCf8TypeMeta(code);

  return {
    code,
    nameKo: meta.nameKo,
    description: meta.description,
    axes,
    hardFilter,
  };
}

/** 코드 문자열에서 프로필 복원 (cf8_code만 저장된 재방문 경로용). */
export function profileFromCode(
  code: string,
  hardFilter: HardFilter,
): Cf8Profile {
  const safe = isCf8Code(code) ? code : FALLBACK_CODE;
  return buildCf8Profile(
    {
      atmosphere: safe[0] === "C" ? -1 : 1,
      placeType: safe[1] === "L" ? -1 : 1,
      experience: safe[2] === "D" ? -1 : 1,
    },
    hardFilter,
  );
}
