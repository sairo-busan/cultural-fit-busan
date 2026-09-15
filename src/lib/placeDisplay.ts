/**
 * 장소 표시용 순수 함수. 브라우저 I/O 를 넣지 않는다 — `npx tsx` 로 검증할 수 있어야 한다.
 *
 * 문구는 화면이 넘겨준다(`translate`). 여기서 로케일을 알 필요가 없다.
 */

/**
 * "부산광역시 해운대구 우동" → "해운대".
 * 접미사를 떼면 한 글자만 남는 곳(중구·서구·동구)은 그대로 둔다.
 */
export function districtLabel(addr1: string): string | null {
  const district = addr1.split(" ")[1];
  if (!district) return null;

  const trimmed = district.replace(/[구군]$/, "");
  return trimmed.length >= 2 ? trimmed : district;
}

export type Translate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

/**
 * 45 → "45분" · 150 → "2시간 30분".
 *
 * 시트에 사람이 손으로 적은 추정치라(10분 단위, 45분만 예외) 문구에 "보통" 을
 * 붙여 측정값이 아님을 드러낸다. 실제 값은 10~150분이다.
 */
export function formatStayMinutes(
  minutes: number | null,
  translate: Translate,
): string | null {
  if (minutes === null || minutes <= 0) return null;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return translate("stay.minutes", { m: rest });
  if (rest === 0) return translate("stay.hours", { h: hours });
  return translate("stay.hoursMinutes", { h: hours, m: rest });
}

export type FitBand = "great" | "good" | "fair";

/**
 * CF8 적합도(0~100)를 세 구간으로 접는다.
 *
 * 숫자를 그대로 쓰지 않는 이유는 값이 촘촘하지 않아서다 — 49곳에 서로 다른 값이
 * 10개뿐이라(16.7 · 25 · 33.3 …) "87" 같은 표기는 없는 정밀도를 만들어 낸다.
 *
 * 태그가 없어 점수를 못 낸 곳(`null`)은 구간도 없다. 0 으로 접으면 "안 맞음" 이
 * 되는데 사실은 "모름" 이다.
 */
export function fitBand(score: number | null): FitBand | null {
  if (score === null) return null;
  if (score >= 75) return "great";
  if (score >= 50) return "good";
  return "fair";
}

/**
 * 저장 시점을 "오늘 · 어제 · N일 전 · 9월 3일" 로 적는다.
 *
 * 날짜 경계로 센다(경과 시간이 아니라) — 어젯밤 11시에 저장한 것이 오늘 아침에
 * "9시간 전" 으로 보이면 어제 한 일인지 알 수 없다.
 */
export function formatSavedAt(
  savedAt: string,
  now: Date,
  translate: Translate,
): string | null {
  const then = new Date(savedAt);
  if (Number.isNaN(then.getTime())) return null;

  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(then)) / 86_400_000);

  if (days <= 0) return translate("savedAt.today");
  if (days === 1) return translate("savedAt.yesterday");
  if (days < 7) return translate("savedAt.daysAgo", { d: days });
  return translate("savedAt.date", { m: then.getMonth() + 1, d: then.getDate() });
}

/**
 * TourAPI 이미지 주소에 `http` 가 섞여 온다(49건 중 16건).
 * `next.config.ts` 는 https 만 허용하고 배포도 https 라 그대로 두면 안 뜬다.
 * 같은 주소가 https 로도 응답하는 것을 확인했다.
 */
export function secureImageUrl(url: string): string {
  return url.replace(/^http:\/\//, "https://");
}
