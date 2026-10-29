/**
 * 링크에서 장소 이름 단서를 꺼낸다. 네트워크는 쓰지 않는다 — 호출은 `/api/link-resolve` 몫.
 */

export type LinkProvider = "youtube" | "kakaomap" | "navermap" | "googlemap" | "other";

/**
 * 단서 하나. `evidence` 는 L2 에 "설명 “…”" 으로 그대로 보여 준다.
 * `kind` 로 믿을 만한 정도가 갈린다 — 작성자가 장소로 적은 `pin` · 지도 `map` 이 가장 높고,
 * 음식 이름이 섞이는 `title` · `tag` 가 가장 낮다.
 */
export type LinkClue = { name: string; evidence: string; kind: "pin" | "stamp" | "tag" | "title" | "map" };

/** 단축 링크 · 최종 목적지 모두 이 호스트 안에서만 따라간다 */
const PROVIDER_HOSTS: Record<Exclude<LinkProvider, "other">, string[]> = {
  youtube: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"],
  kakaomap: ["map.kakao.com", "place.map.kakao.com", "m.map.kakao.com", "kko.to"],
  navermap: ["map.naver.com", "m.map.naver.com", "m.place.naver.com", "pcmap.place.naver.com", "naver.me"],
  googlemap: ["www.google.com", "google.com", "maps.google.com", "maps.app.goo.gl", "goo.gl"],
};

export const SHORT_HOSTS = ["youtu.be", "kko.to", "naver.me", "maps.app.goo.gl", "goo.gl"];

export function isAllowedHost(host: string): boolean {
  return Object.values(PROVIDER_HOSTS).some((hosts) => hosts.includes(host));
}

/** 최종 주소 기준. google.com 은 `/maps` 경로일 때만 지도다 */
export function detectProvider(url: URL): LinkProvider {
  const host = url.hostname;
  if (PROVIDER_HOSTS.youtube.includes(host)) return "youtube";
  if (PROVIDER_HOSTS.kakaomap.includes(host) && host !== "kko.to") return "kakaomap";
  if (PROVIDER_HOSTS.navermap.includes(host) && host !== "naver.me") return "navermap";
  if (host === "maps.google.com" || (host.endsWith("google.com") && url.pathname.startsWith("/maps"))) {
    return "googlemap";
  }
  return "other";
}

/** watch?v= · youtu.be/ · shorts/ */
export function youtubeVideoId(url: URL): string | null {
  const id =
    url.hostname === "youtu.be"
      ? url.pathname.slice(1).split("/")[0]
      : url.searchParams.get("v") ?? url.pathname.match(/^\/(?:shorts|live)\/([^/]+)/)?.[1];
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

const MAX_NAME = 30;

const STAMP = /^(?:\d{1,2}:)?\d{1,2}:\d{2}\s+(.+)/;

/** 장소가 아닌 챕터 제목. 카카오는 "인트로" 로도 모텔을 찾아 준다 */
const CHAPTER = /^(인트로|오프닝|아웃트로|엔딩|마무리|시작|intro|outro|opening|ending)(\s|$)/iu;

/** "#부산맛집" 같은 일반어. 카카오에는 이 이름의 가게가 정말 있어서 이름 필터로는 못 거른다 */
const GENERIC = /(맛집|여행|브이로그|vlog|추천|코스|투어|가볼만한곳|핫플|스팟|명소)$/iu;

/** `1. 호돌이초장집` — 바로 아래 `📍` 줄이 붙을 때만 장소 이름으로 본다 */
const NUMBERED = /^\d{1,2}[.)]\s*(.+)/;

/** `① 부산역(출발)` · `⑩. 시립미술관, 벡스코` — 원 숫자는 목록에만 쓰는 기호라 아래 `📍` 없이도 장소 줄로 본다 */
const CIRCLED = /^[\u2460-\u2473]\.?\s*(.+)/u;

/** `📍부산 중구 부평동1가 41-6` 같은 주소 줄. 이름이 아니다 */
const ADDRESS = /^(부산(광역시)?\s+)?\S+[구군]\s/u;

function clean(s: string): string {
  return s
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s*@\S+/g, "") // 인스타 계정 표기
    .replace(/(^|\s)(?:\d{1,2}:)?\d{1,2}:\d{2}(?=\s|$)/g, " ") // "바우하우스 00:42"
    .replace(/\s*\*.*$/u, "") // "UN기념공원 *기간한정 무정차"
    .replace(/[\s–—\-:|·,]+$/u, "")
    .replace(/^[\s–—\-:|·]+/u, "")
    .trim();
}

/** `📍` 줄의 이름. "부산역 점심 | 영동밀면" 은 뒤가, "해동용궁사 – 기장해안로 86" 은 앞이 이름이다 */
function pinName(text: string): string {
  const parts = text.split(/\s\|\s/u);
  return clean((parts.length > 1 ? parts[parts.length - 1] : text).split(/\s[–—-]\s|[(/]/u)[0]);
}

/**
 * 설명란 단서는 세 가지만 본다: `📍` 줄, 타임스탬프 줄(`03:12 청사포`), 해시태그.
 * 문장 속 지명은 고르지 않는다 — 오탐이 후보를 덮는다.
 */
export function youtubeClues(description: string): LinkClue[] {
  const clues: LinkClue[] = [];
  /** `📍` 머리줄 아래 `- 장소` 목록을 읽는 중. 다음 `📍` 이나 빈 줄 두 개에서 끝난다 */
  let pinList = false;

  const lines = description.split(/\r?\n/).map((l) => l.trim());

  for (const [i, line] of lines.entries()) {
    if (line === "" && lines[i - 1] === "") pinList = false;
    const next = lines[i + 1] ?? "";

    // "ㄴ해동용궁사 https://place.map.kakao.com/…" — 링크는 떼고 이름만
    const bullet = line.match(/^[-•·*ㄴ└]\s*(.+)/u);
    if (pinList && bullet) {
      // "-기장" 아래 "ㄴ해동용궁사" — 아래에 ㄴ 줄을 거느린 줄은 지역 묶음 이름이다
      if (!/^[ㄴ└]/u.test(line) && /^[ㄴ└]/u.test(next)) continue;
      const shown = line.replace(/\s*https?:\/\/\S+/g, "");
      const name = clean(bullet[1].replace(/https?:\/\/\S+/g, ""));
      if (name) clues.push({ name, evidence: `설명 “${shown}”`, kind: "pin" });
      continue;
    }

    const circled = line.match(CIRCLED);
    if (circled) {
      for (const part of circled[1].split(/\s*,\s*/u)) {
        // "마린시티(수영만 요트경기장)" 은 괄호 안이 정류장의 실제 장소다. "(출발)" 같은 안내는 아니다
        const inner = part.match(/\(([^)]{3,})\)/u)?.[1];
        const name = inner && !/출발|도착|경유|무정차/u.test(inner) ? clean(inner) : pinName(part);
        if (name) clues.push({ name, evidence: `설명 “${line}”`, kind: "pin" });
      }
      continue;
    }

    const numbered = line.match(NUMBERED);
    if (numbered && next.includes("📍")) {
      const name = clean(numbered[1]);
      if (name) clues.push({ name, evidence: `설명 “${line}”`, kind: "pin" });
      continue;
    }

    const pin = line.match(/📍\s*(.+)/u);
    if (pin) pinList = false;

    /**
     * 머리줄 — 아래 목록을 거느린 `📍` 줄. 이름이 "곳 · 장소 · 코스" 같은 말이거나,
     * 다음 줄이 글머리(`-` · `ㄴ`)거나 글자로 시작하는 보통 문장일 때("📍 스킨케어" 아래 화장품 목록).
     * 다음 줄이 ⏰ · 💸 같은 기호로 시작하면 그 `📍` 은 장소이고 아래는 장소 정보다.
     */
    const nextIsList = /^[-•·*ㄴ└]/u.test(next);
    const nextIsText = /^[\p{L}]/u.test(next) && !STAMP.test(next) && !NUMBERED.test(next);
    const header =
      /곳|장소|위치|코스|spots?|places?|course|route|:$/iu.test(pin?.[1] ?? "") || nextIsList || nextIsText;
    if (pin && header) {
      pinList = true;
      continue;
    }
    if (pin) {
      if (ADDRESS.test(pin[1])) continue;
      const name = pinName(pin[1]);
      if (name) clues.push({ name, evidence: `설명 “${line}”`, kind: "pin" });
      continue;
    }

    const stamp = line.match(STAMP);
    if (stamp) {
      const name = clean(stamp[1]);
      if (name && !CHAPTER.test(name)) clues.push({ name, evidence: `설명 “${line}”`, kind: "stamp" });
    }
  }

  for (const tag of description.matchAll(/#([\p{L}\p{N}_]+)/gu)) {
    if (GENERIC.test(tag[1])) continue;
    clues.push({ name: tag[1].replace(/_/g, " "), evidence: `설명 해시태그 “#${tag[1]}”`, kind: "tag" });
  }

  return dedupe(clues.filter((c) => c.name.length <= MAX_NAME));
}

/**
 * 제목에 늘어놓은 장소 — "…(이재모•신발원만두•아구수육)" · "… | 해목, 비비비당, 신발원" · "…ㅣ돼지국밥, 연화리해녀촌".
 * 음식 이름도 섞여 있어 믿을 만한 정도는 해시태그와 같다.
 */
export function titleClues(title: string): LinkClue[] {
  const lists = [
    ...[...title.matchAll(/\(([^)]+)\)/g)].map((m) => m[1]),
    // 구분자로 "|" 대신 한글 모음 "ㅣ" 를 쓰는 제목도 많다
    ...(/[|ㅣ]/u.test(title) ? [title.split(/[|ㅣ]/u).pop()!] : []),
  ];
  return dedupe(
    lists
      .filter((l) => /[•·,]/u.test(l))
      .flatMap((l) => l.split(/[•·,]/u))
      .map(clean)
      .filter((name) => name.length >= 2 && name.length <= MAX_NAME && !GENERIC.test(name))
      .map((name) => ({ name, evidence: `제목 “${name}”`, kind: "title" as const })),
  );
}

/** `/maps/place/<이름>/@…` */
export function googlePlaceName(url: URL): string | null {
  const seg = url.pathname.match(/\/maps\/place\/([^/]+)/)?.[1];
  if (!seg) return null;
  const name = decodeURIComponent(seg.replace(/\+/g, " ")).trim();
  return name || null;
}

/** `og:title` 의 " : 네이버" · " | 카카오맵" 같은 꼬리는 뺀다 */
export function ogTitle(html: string): string | null {
  const content =
    html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:title["']/i)?.[1];
  if (!content) return null;
  const name = content.split(/\s[:|]\s/)[0].trim();
  return name || null;
}

function dedupe(clues: LinkClue[]): LinkClue[] {
  const seen = new Set<string>();
  return clues.filter((c) => {
    const key = c.name.replace(/\s/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
