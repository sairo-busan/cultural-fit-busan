/**
 * 장소 표시용 순수 함수. 브라우저 I/O 를 넣지 않는다 — `npx tsx` 로 검증할 수 있어야 한다.
 *
 * 문구는 화면이 넘겨준다(`translate`). 여기서 로케일을 알 필요가 없다.
 */

/**
 * "부산광역시 해운대구 우동" → "해운대".
 * 접미사를 떼면 한 글자만 남는 곳(중구·서구·동구)은 그대로 둔다.
 */
export function districtLabel(addr1: string | null): string | null {
  const district = addr1?.split(" ")[1];
  if (!district) return null;

  const trimmed = district.replace(/[구군]$/, "");
  return trimmed.length >= 2 ? trimmed : district;
}

/** 부산 16개 구·군의 영문 표기 (국어의 로마자 표기법) */
const DISTRICT_EN: Record<string, string> = {
  중구: "Jung-gu",
  서구: "Seo-gu",
  동구: "Dong-gu",
  영도구: "Yeongdo-gu",
  부산진구: "Busanjin-gu",
  동래구: "Dongnae-gu",
  남구: "Nam-gu",
  북구: "Buk-gu",
  해운대구: "Haeundae-gu",
  사하구: "Saha-gu",
  금정구: "Geumjeong-gu",
  강서구: "Gangseo-gu",
  연제구: "Yeonje-gu",
  수영구: "Suyeong-gu",
  사상구: "Sasang-gu",
  기장군: "Gijang-gun",
};

/** "부산광역시 기장군 기장읍 …" → "Gijang-gun". 표에 없으면 null */
export function districtLabelEn(addr1: string | null): string | null {
  return DISTRICT_EN[addr1?.split(" ")[1] ?? ""] ?? null;
}

/**
 * 구글맵에서 장소를 검색한 상태로 연다. 영문 화면도 한국어 이름을 쓴다 — 구글의 한국 장소는 한국어 이름으로 가장 잘 잡힌다.
 *
 * 좌표만 넘기면 장소가 아니라 핀이 뜬다. 주소를 붙이면 오히려 검색 목록으로 떨어진다.
 * 이름에 "부산" 이 없으면 붙인다 — 전국에 같은 이름이 있다.
 */
export function googleMapsUrl(nameKo: string): string {
  const query = nameKo.includes("부산") ? nameKo : `${nameKo} 부산`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * 부산관광아카이브에서 받아 직접 올린 사진인지 본다. TourAPI 사진과 출처가 다르다.
 *
 * `imageSources.cpyrhtDivCd` 는 공공누리 유형이지 제공 기관이 아니라 이 구분에 못 쓴다 —
 * 유형이 안 붙은 TourAPI 사진도 `null` 로 온다. `next.config.ts` 의 허용 패턴과 같은
 * 기준이라 스토어를 다시 만들어 서브도메인이 바뀌어도 그대로 잡힌다.
 */
export function isArchivePhoto(url: string): boolean {
  return url.includes("blob.vercel-storage.com");
}

/**
 * 추천 이유가 한 줄 설명으로 시작하면 그 첫 문장을 뗀다.
 * "가야 고분과 … 역사박물관입니다. 비교적 조용한…" → "비교적 조용한…"
 *
 * 이유 문장이 모두 이렇게 시작해, 제목 아래 한 줄 설명과 박스 첫 줄이 같은 말이 된다.
 * 설명으로 시작하지 않으면 그대로 둔다.
 */
export function reasonWithoutLead(reason: string, lead: string | null): string {
  if (!lead || !reason.startsWith(lead)) return reason;
  const rest = reason.slice(lead.length).replace(/^[^.!?]*[.!?]\s*/, "");
  return rest || reason;
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
