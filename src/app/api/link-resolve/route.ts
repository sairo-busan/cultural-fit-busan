import { NextRequest, NextResponse } from "next/server";
import {
  detectProvider,
  googlePlaceName,
  isAllowedHost,
  ogTitle,
  SHORT_HOSTS,
  titleClues,
  youtubeClues,
  youtubeVideoId,
  type LinkClue,
  type LinkProvider,
} from "@/lib/linkClues";
import { searchKakao, type KakaoPlace } from "@/lib/kakaoLocal";

const MAX_HOPS = 5;
/** 링크 하나에서 검색하는 단서 · 돌려주는 후보 수. 타임라인이 15~20줄인 영상이 흔하다 */
const MAX_CLUES = 30;
const MAX_CANDIDATES = 30;
/** 장소 후보가 아닌 카카오 업종 */
const RESIDENTIAL = /빌라|주택|아파트|오피스텔|주거/;
/** 카카오에 한꺼번에 보내는 검색 수 */
const BATCH = 10;
const TIMEOUT_MS = 5000;

type Candidate = KakaoPlace & Pick<LinkClue, "evidence" | "kind">;

const squash = (s: string) => s.replace(/\s/g, "").toLowerCase();

function sharesBigram(a: string, b: string): boolean {
  const [x, y] = [squash(a), squash(b)];
  for (let i = 0; i < x.length - 1; i++) if (y.includes(x.slice(i, i + 2))) return true;
  return false;
}

const KIND_ORDER: Record<LinkClue["kind"], number> = { pin: 0, map: 0, stamp: 1, title: 2, tag: 3 };

type ResolveResult = {
  provider: LinkProvider;
  url: string;
  title: string | null;
  /** 출처 영상 썸네일(YouTube). L2 시트 머리에 한 번 보여 준다 */
  thumbnail?: string;
  candidates: Candidate[];
  /** 후보가 비었을 때 원인. 화면에는 쓰지 않고 실험 기록용 */
  reason?: string;
};

/**
 * GET /api/link-resolve?url=
 * 링크 하나에서 부산 장소 후보를 찾는다(lab/link-save 실험).
 * 허용 호스트 밖으로는 요청을 보내지 않는다 — 단축 링크의 중간 hop 도 같다.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url")?.trim();

  let input: URL;
  try {
    input = new URL(raw ?? "");
  } catch {
    return NextResponse.json({ error: "url 이 올바르지 않습니다" }, { status: 400 });
  }
  if (input.protocol !== "https:") {
    return NextResponse.json({ error: "https 링크만 받습니다" }, { status: 400 });
  }

  const result: ResolveResult = { provider: "other", url: input.href, title: null, candidates: [] };

  try {
    const { url, html } = await follow(input);
    result.provider = detectProvider(url);
    // 저장은 url 로 중복을 막는다. youtu.be · shorts · &feature= 처럼 모양이 달라도 같은 영상은 한 주소로
    const videoId = result.provider === "youtube" ? youtubeVideoId(url) : null;
    result.url = videoId ? `https://www.youtube.com/watch?v=${videoId}` : url.href;

    const { title, thumbnail, clues, reason } = await cluesFor(result.provider, url, html);
    result.title = title;
    result.thumbnail = thumbnail;
    result.reason = reason;
    result.candidates = await toCandidates(clues);
    if (!process.env.KAKAO_REST_API_KEY) result.reason ??= "KAKAO_REST_API_KEY 없음";
    if (!result.candidates.length && !result.reason) {
      result.reason = clues.length ? "카카오에서 맞는 곳 없음" : "단서 없음";
    }
  } catch (error) {
    result.reason = (error as Error).message;
  }

  return NextResponse.json(result);
}

/**
 * 단축 링크를 따라간다. 지도 장소 페이지는 og:title 을 읽어야 하므로 마지막 본문도 돌려준다.
 * 허용 호스트가 아니면 따라가지도, 본문을 받지도 않는다.
 */
async function follow(start: URL): Promise<{ url: URL; html: string | null }> {
  let url = start;

  for (let hop = 0; hop <= MAX_HOPS; hop++) {
    if (!isAllowedHost(url.hostname) || url.protocol !== "https:") return { url, html: null };

    const isShort = SHORT_HOSTS.includes(url.hostname);
    const needsBody = !isShort && (detectProvider(url) === "kakaomap" || detectProvider(url) === "navermap");
    if (!isShort && !needsBody) return { url, html: null };

    const res = await fetch(url, {
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SAIRO-lab)" },
    });

    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      url = new URL(location, url);
      continue;
    }
    return { url, html: needsBody && res.ok ? await res.text() : null };
  }

  throw new Error("리다이렉트가 너무 깁니다");
}

async function cluesFor(
  provider: LinkProvider,
  url: URL,
  html: string | null,
): Promise<{ title: string | null; thumbnail?: string; clues: LinkClue[]; reason?: string }> {
  switch (provider) {
    case "youtube": {
      const key = process.env.YOUTUBE_API_KEY;
      const id = youtubeVideoId(url);
      if (!key) return { title: null, clues: [], reason: "YOUTUBE_API_KEY 없음" };
      if (!id) return { title: null, clues: [], reason: "영상 ID 없음" };

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${key}`,
        { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) },
      );
      if (!res.ok) return { title: null, clues: [], reason: `YouTube API ${res.status}` };

      const snippet = (await res.json()).items?.[0]?.snippet;
      if (!snippet) return { title: null, clues: [], reason: "영상 없음" };
      // 설명은 단서만 뽑고 버린다(저장하지 않음)
      return {
        title: snippet.title ?? null,
        thumbnail: snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url,
        clues: [...youtubeClues(`${snippet.description ?? ""}`), ...titleClues(snippet.title ?? "")],
      };
    }
    case "googlemap": {
      const name = googlePlaceName(url);
      return { title: name, clues: name ? [{ name, evidence: `구글 지도 “${name}”`, kind: "map" }] : [] };
    }
    case "kakaomap":
    case "navermap": {
      const name = html ? ogTitle(html) : null;
      const label = provider === "kakaomap" ? "카카오맵" : "네이버 지도";
      return {
        title: name,
        clues: name ? [{ name, evidence: `${label} “${name}”`, kind: "map" }] : [],
        reason: html ? undefined : "장소 페이지 본문 없음",
      };
    }
    default:
      return { title: null, clues: [], reason: "자동 후보 대상 아님" };
  }
}

/** 단서마다 부산 안에서 카카오 검색 1건. 같은 곳은 처음 근거만 남긴다 */
async function toCandidates(clues: LinkClue[]): Promise<Candidate[]> {
  if (!clues.length) return [];

  // 한도 안에서 작성자가 장소로 적은 줄부터 쓴다
  const ordered = [...clues].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]).slice(0, MAX_CLUES);
  const hits: (Candidate | null)[] = [];
  for (let i = 0; i < ordered.length; i += BATCH) {
    hits.push(...(await Promise.all(ordered.slice(i, i + BATCH).map(searchClue))));
  }

  const seen = new Set<string>();
  return hits
    .filter((h): h is Candidate => h !== null && !seen.has(h.kakaoId) && !!seen.add(h.kakaoId))
    .slice(0, MAX_CANDIDATES);
}

/** 단서 하나 → 카카오 검색, 부산 주소 · 주거시설 아닌 첫 결과 */
async function searchClue(clue: LinkClue): Promise<Candidate | null> {
  try {
    // 같은 이름의 빌라 · 아파트가 첫 결과로 오는 일이 있다("씨메르") — 주거시설은 건너뛴다
    // 검색 사각형에 김해 일부가 걸친다 — 주소가 부산인 곳만
    const place = (await searchKakao(clue.name, 5)).find(
      (p) => !RESIDENTIAL.test(p.category ?? "") && p.addr?.startsWith("부산"),
    );
    if (!place) return null;
    // 단서와 가게 이름이 두 글자도 안 겹치면 엉뚱한 곳이다 — "광복로" → "올리브영 남포점". 영어 단서는 한글 이름과 비교할 수 없어 뺀다
    if (clue.kind !== "map" && /[가-힣]/u.test(clue.name) && !sharesBigram(clue.name, place.name)) return null;
    // 해시태그는 "#부산여행" 으로 케이블카가 나오는 식이라, 이름에 태그가 그대로 들어 있을 때만 쓴다
    if (clue.kind === "tag" && !squash(place.name).includes(squash(clue.name))) return null;
    // 제목 목록엔 음식 이름이 섞인다("떡볶이"). 가게 이름과 단서가 한쪽으로 시작할 때만 — "신발원만두" ↔ "신발원"
    if (clue.kind === "title") {
      const [a, b] = [squash(place.name), squash(clue.name)];
      if (!a.startsWith(b) && !b.startsWith(a)) return null;
    }
    return { ...place, evidence: clue.evidence, kind: clue.kind };
  } catch {
    return null;
  }
}
