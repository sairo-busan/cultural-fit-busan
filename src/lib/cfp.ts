/**
 * CF8 진단 환산 — S01 응답 → cf8_code → S02 표시용 프로필
 *
 * 화면 정본: 피그마 Page 2_최종 S01(1007:1661) — 4/4/3지선다
 * 체계 정본: 기획 구글 시트 [최] SAIRO 통합본
 * - "CF8 코드 = left/right_code 3개 조합. 예: C + L + D → CLD"
 * - cf_code 8종 + profile_name + explanation_template (status: ACTIVE_V6)
 *
 * ⚠️ 정본 시트는 2지선다(−1/+1)인데 화면은 4/4/3지선다다. 선택지를 축 값으로
 *    접는 규칙이 어느 자료에도 없어 화면 단계 수에 맞춰 정했다. 유나 확인 필요.
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

type Cf8TypeMeta = {
  nameKo: string;
  /** 정본 explanation_template */
  description: string;
};

const CF8_TYPES: Record<Cf8Code, Cf8TypeMeta> = {
  CLD: {
    nameKo: "고요한 로컬 몰입가",
    description: "조용한 로컬 장소에 충분히 머물며 깊이 경험하는 성향을 반영했어요.",
  },
  CLV: {
    nameKo: "조용한 골목 탐험가",
    description: "차분한 로컬 장소를 다양하게 발견하는 성향을 반영했어요.",
  },
  CFD: {
    nameKo: "느긋한 명소 감상가",
    description: "부산 대표명소를 여유 있게 깊이 감상하는 성향을 반영했어요.",
  },
  CFV: {
    nameKo: "차분한 명소 수집가",
    description: "차분한 대표명소를 다양하게 둘러보는 성향을 반영했어요.",
  },
  ELD: {
    nameKo: "활기찬 로컬 몰입가",
    description: "활기찬 로컬 공간에 머물며 현장을 깊이 경험하는 성향을 반영했어요.",
  },
  ELV: {
    nameKo: "로컬 에너지 탐험가",
    description: "생동감 있는 로컬 장소를 다양하게 발견하는 성향을 반영했어요.",
  },
  EFD: {
    nameKo: "활기찬 명소 체험가",
    description: "활기찬 부산 대표명소를 충분히 체험하는 성향을 반영했어요.",
  },
  EFV: {
    nameKo: "에너지 명소 순회자",
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
 * 부호가 축 코드를 결정하고, 0(중립)은 왼쪽으로 귀결시킨다.
 * 미응답 축은 왼쪽 끝(−2)으로 채운다.
 */
function toAxis<T extends string>(
  value: AxisValue | null,
  left: T,
  right: T,
): { code: T; value: AxisValue } {
  const resolved: AxisValue = value ?? -2;
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

/**
 * 코드 문자열에서 프로필 복원 (cf8_code만 저장된 재방문 경로용).
 * 축 값의 세기는 복원할 수 없으므로 양 끝(±2)으로 둔다.
 */
export function profileFromCode(
  code: string,
  hardFilter: HardFilter,
): Cf8Profile {
  const safe = isCf8Code(code) ? code : FALLBACK_CODE;
  return buildCf8Profile(
    {
      atmosphere: safe[0] === "C" ? -2 : 2,
      placeType: safe[1] === "L" ? -2 : 2,
      experience: safe[2] === "D" ? -2 : 2,
    },
    hardFilter,
  );
}
