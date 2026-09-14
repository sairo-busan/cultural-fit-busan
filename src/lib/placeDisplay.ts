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

/**
 * TourAPI 이미지 주소에 `http` 가 섞여 온다(49건 중 16건).
 * `next.config.ts` 는 https 만 허용하고 배포도 https 라 그대로 두면 안 뜬다.
 * 같은 주소가 https 로도 응답하는 것을 확인했다.
 */
export function secureImageUrl(url: string): string {
  return url.replace(/^http:\/\//, "https://");
}
