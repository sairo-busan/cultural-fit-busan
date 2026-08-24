/** S02 프로필 결과 화면용 표시 데이터. 가이드 텍스트는 placeholder. */

// === 동반인·걷기 표시 텍스트 ===

export const COMPANION_LABEL: Record<string, string> = {
  solo: "혼자",
  couple: "연인과",
  friends: "친구와",
  family: "가족과",
};

export const WALKING_LABEL: Record<string, string> = {
  short: "도보 10분",
  medium: "도보 15분",
  long: "도보 20분까지",
};

// === 4축 슬라이더 라벨 ===

export const AXIS_CONFIG = [
  { key: "atmosphere", label: "분위기", left: "고요", right: "활기" },
  { key: "placeType", label: "로컬", left: "현지", right: "익숙" },
  { key: "palate", label: "음식", left: "순함", right: "매움" },
  { key: "pace", label: "이동", left: "여유", right: "활보" },
] as const;

// === "이렇게 안내하겠습니다" 가이드 텍스트 (축 코드별) ===

type GuideItem = {
  title: string;
  description: string;
};

export const AXIS_GUIDE: Record<string, GuideItem> = {
  Q: { title: "조용한 곳", description: "사람 적은 시간대와 한적한 장소를 먼저 보여드립니다" },
  V: { title: "활기찬 곳", description: "북적이는 시장과 사람 많은 명소를 우선 안내합니다" },
  L: { title: "현지 깊이", description: "현지인이 가는 곳을 우선하고 이용 방법을 자세히 안내합니다" },
  F: { title: "편한 안내", description: "영어 메뉴판이 있고 안내가 잘 된 곳을 우선합니다" },
  M: { title: "순한 음식", description: "매운 메뉴가 있으면 조절 요청법을 함께 알려드립니다" },
  H: { title: "매운 음식", description: "부산 대표 매운맛 메뉴를 적극적으로 안내합니다" },
  S: { title: "짧은 동선", description: "도보 10분 이내로 두세 곳만 묶어 드립니다" },
  W: { title: "넓은 동선", description: "도보 20분까지 여러 곳을 효율적으로 묶어 드립니다" },
};
