"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, ExternalLink, Link2, Search, X } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { AppHeader } from "@/components/common/AppHeader";
import { apiUrl } from "@/lib/apiBase";
import { youtubeVideoId } from "@/lib/linkClues";
import { upsertLinkSave } from "@/lib/storage";
import { KakaoMap } from "./KakaoMap";
import { useCatalog } from "./useCatalog";

/** `/api/place-search` · `/api/link-resolve` 의 카카오 장소 */
type Place = {
  kakaoId: string;
  name: string;
  addr: string | null;
  category: string | null;
  x: number;
  y: number;
};

type Candidate = Place & { evidence: string; kind: "pin" | "stamp" | "tag" | "title" | "map" };

type Resolved = {
  provider: string;
  url: string;
  title: string | null;
  thumbnail?: string;
  candidates: Candidate[];
  reason?: string;
};

type Picked = { label: string; placeId: string | null; kakaoId: string | null };

const samePick = (a: Picked, b: Picked) => (a.kakaoId ?? a.label) === (b.kakaoId ?? b.label);

export const PROVIDER_LABEL: Record<string, string> = {
  youtube: "YouTube",
  kakaomap: "카카오맵",
  navermap: "네이버 지도",
  googlemap: "구글 지도",
  other: "링크",
};

const BTN_PRIMARY =
  "ds-title-2 flex min-h-12 w-full items-center justify-center rounded-xl bg-primary text-white active:bg-primary-press disabled:bg-surface disabled:text-sub-on-surface";
const BTN_TEXT = "ds-body-2 min-h-11 w-full font-medium text-sub";

/** 작성자가 장소로 적은 줄 · 지도 링크만 처음부터 고른다. 챕터 · 제목 · 해시태그는 오탐이 섞인다 */
const preselect = (c: Candidate) => c.kind === "pin" || c.kind === "map";

export const shortUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "");

/** 자동 후보 대상이 아닌 링크도 출처는 알아보게 호스트로 이름을 붙인다 */
const HOST_LABEL: [RegExp, string][] = [
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)(facebook\.com|fb\.watch)$/, "Facebook"],
];

/** YouTube 썸네일은 영상 id 로 정해진다 — 저장하지 않는다 */
export function thumbnailOf(provider: string, url: string): string | null {
  if (provider !== "youtube") return null;
  try {
    const id = youtubeVideoId(new URL(url));
    return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null;
  } catch {
    return null;
  }
}

export function providerLabel(provider: string, url: string): string {
  if (provider !== "other") return PROVIDER_LABEL[provider] ?? "링크";
  try {
    const host = new URL(url).hostname;
    return HOST_LABEL.find(([re]) => re.test(host))?.[1] ?? "링크";
  } catch {
    return "링크";
  }
}

export const PATH = "/lab/link-save";
/** 접힌 시트에 남는 높이(px) — 손잡이와 지금 보는 곳 카드. 헤더 칸의 `h-32` 와 같다 */
const PEEK = 128;
/** 펼친 시트의 윗변(px). `top-60` 과 같다 */
const SHEET_TOP = 240;

/** 고른 곳은 새로고침해도 남게 탭 단위로 둔다 */
const pickKey = (url: string) => `cfb_link_pick:${url}`;

function readPick(url: string): Picked[] | null {
  try {
    const raw = sessionStorage.getItem(pickKey(url));
    return raw ? (JSON.parse(raw) as Picked[]) : null;
  } catch {
    return null;
  }
}

export function writePick(url: string, picked: Picked[]) {
  try {
    sessionStorage.setItem(pickKey(url), JSON.stringify(picked));
  } catch {}
}

/**
 * L1 링크 넣기 → L2 장소 고르기. 링크 하나만 받는다.
 * 링크와 단계는 주소(`?url=…&step=pick`)에 둔다 — 새로고침해도 같은 화면으로 돌아오고,
 * 브라우저 뒤로 가기가 L2 → L1 으로 간다.
 */
export function LinkSaveContent() {
  const router = useRouter();
  const { matchCatalog, fitLabel } = useCatalog();

  const toPicked = (p: Place): Picked => ({
    label: p.name,
    placeId: matchCatalog(p.name, p.x, p.y),
    kakaoId: p.kakaoId,
  });

  const params = useSearchParams();
  const urlParam = params.get("url") ?? "";
  const step = params.get("step") === "pick" ? "pick" : "input";

  const [input, setInput] = useState(urlParam);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [picked, setPicked] = useState<Picked[]>([]);
  const [searching, setSearching] = useState(false);
  /** 지도와 목록이 함께 보는 후보 */
  const [focus, setFocus] = useState(0);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const [sheetOpen, setSheetOpen] = useState(true);
  const dragFrom = useRef<{ x: number; y: number } | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);
  const [shellH, setShellH] = useState(0);
  const [footH, setFootH] = useState(0);

  const requestId = useRef(0);

  async function analyze(raw: string) {
    const url = raw.trim();
    if (!/^https?:\/\//.test(url)) return;

    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    setResolved(null);
    try {
      const res = await fetch(apiUrl(`/api/link-resolve?url=${encodeURIComponent(url)}`));
      const body = await res.json();
      if (id !== requestId.current) return;
      if (!res.ok) throw new Error(body.error ?? "링크를 읽지 못했어요");
      const result = body as Resolved;
      setResolved(result);
      if (step === "pick") startPick(url, result);
      else router.replace({ pathname: PATH, query: { url } });
    } catch (e) {
      if (id === requestId.current) setError((e as Error).message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  // 새로고침 · 공유 링크로 들어오면 주소의 링크를 다시 분석한다
  useEffect(() => {
    if (urlParam) queueMicrotask(() => analyze(urlParam));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clear() {
    requestId.current++;
    setInput("");
    setResolved(null);
    setError(null);
    setLoading(false);
    router.replace(PATH);
  }

  function startPick(url: string, result: Resolved) {
    setPicked(readPick(url) ?? result.candidates.filter(preselect).map(toPicked));
    setSearching(result.candidates.length === 0);
    setFocus(0);
    setSheetOpen(true);
  }

  function openPick() {
    if (!resolved) return;
    const url = input.trim();
    startPick(url, resolved);
    router.push({ pathname: PATH, query: { url, step: "pick" } });
  }

  const backToInput = () => router.replace({ pathname: PATH, query: { url: input.trim() } });

  function save(places: Picked[]) {
    if (!resolved) return;
    upsertLinkSave({
      url: resolved.url,
      provider: resolved.provider,
      title: resolved.title,
      savedAt: new Date().toISOString(),
      places,
    });
    router.push("/lab/link-save/saved");
  }

  const togglePick = (p: Picked) =>
    setPicked((cur) => {
      const next = cur.some((x) => samePick(x, p)) ? cur.filter((x) => !samePick(x, p)) : [...cur, p];
      writePick(input.trim(), next);
      return next;
    });

  /** 후보를 모두 고르거나 모두 뺀다. 직접 찾아 더한 곳 · 이름만 적은 곳은 그대로 둔다 */
  function setAllCandidates(on: boolean) {
    if (!resolved) return;
    const all = resolved.candidates.map(toPicked);
    setPicked((cur) => {
      const others = cur.filter((p) => !all.some((a) => samePick(a, p)));
      const next = on ? [...others, ...all] : others;
      writePick(input.trim(), next);
      return next;
    });
  }

  const pins = useMemo(
    () =>
      (resolved?.candidates ?? []).map((c) => ({
        x: c.x,
        y: c.y,
        on: picked.some((p) => p.kakaoId === c.kakaoId),
        label: c.name,
      })),
    [resolved, picked],
  );

  // 지도가 가려지는 높이를 재려고 화면 · 하단 버튼 높이를 따라간다
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      setShellH(shellRef.current?.clientHeight ?? 0);
      setFootH(footRef.current?.offsetHeight ?? 0);
    });
    if (shellRef.current) ro.observe(shellRef.current);
    if (footRef.current) ro.observe(footRef.current);
    return () => ro.disconnect();
  }, [step, resolved, searching]);

  /** 시트 · 하단 버튼에 가려진 지도 아래쪽 높이. 핀을 그 위쪽 보이는 칸 가운데에 둔다 */
  const coverBottom = sheetOpen ? Math.max(shellH - SHEET_TOP, 0) : PEEK + footH;

  /** 손잡이를 끌어 접고 펼친다. 거의 안 움직였으면 누른 것으로 보고 뒤집는다 */
  /**
   * 손잡이 칸을 끌어 접고 편다. 거의 안 움직였으면 누른 것으로 보고 뒤집는다.
   * 접힌 상태에서 옆으로 밀면 이전 · 다음 곳으로 넘긴다.
   */
  function endDrag(x: number, y: number) {
    if (dragFrom.current === null) return;
    const dx = x - dragFrom.current.x;
    const dy = y - dragFrom.current.y;
    dragFrom.current = null;
    if (!sheetOpen && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      stepFocus(dx < 0 ? 1 : -1);
      return;
    }
    setSheetOpen(Math.abs(dy) < 8 ? !sheetOpen : dy < 0);
  }

  function stepFocus(delta: number) {
    const count = resolved?.candidates.length ?? 0;
    const next = Math.min(Math.max(focus + delta, 0), count - 1);
    setFocus(next);
    scrollRowIntoList(next);
  }

  /**
   * 목록 칸만 움직인다. `scrollIntoView` 는 바깥 화면(overflow-hidden 이어도)까지 밀어
   * 접힌 시트가 화면 가운데로 끌려 올라온다.
   */
  function scrollRowIntoList(i: number) {
    const row = rowRefs.current[i];
    const list = listRef.current;
    if (!row || !list) return;
    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    if (top < list.scrollTop) list.scrollTo({ top, behavior: "smooth" });
    else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: bottom - list.clientHeight, behavior: "smooth" });
    }
  }

  /** 마커를 누르면 지도 보기로 — 시트를 접고 그 곳 카드를 띄운다 */
  function focusPin(i: number) {
    setFocus(i);
    setSheetOpen(false);
    scrollRowIntoList(i);
  }

  if (step === "pick" && resolved && resolved.candidates.length > 0 && !searching) {
    const youtube = resolved.provider === "youtube";
    const allPicked = resolved.candidates.every((c) => picked.some((p) => p.kakaoId === c.kakaoId));

    return (
      <div ref={shellRef} className="relative mx-auto h-dvh w-full max-w-screen-sm overflow-hidden">
        <div className="absolute inset-0">
          <KakaoMap
            pins={pins}
            selected={focus}
            onSelect={focusPin}
            onMapClick={() => setSheetOpen(false)}
            coverBottom={coverBottom}
          />
        </div>
        <button
          type="button"
          onClick={backToInput}
          aria-label="뒤로"
          style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
          className="absolute left-3 z-10 grid size-10 place-items-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.15)]"
        >
          <ChevronLeft size={22} strokeWidth={1.5} />
        </button>

        <section
          aria-label="찾은 곳 목록"
          style={{
            bottom: footH,
            transform: sheetOpen ? "none" : `translateY(calc(100% - ${PEEK}px))`,
          }}
          className="absolute inset-x-0 top-60 z-10 flex flex-col rounded-t-[20px] bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.08)] transition-transform duration-300 motion-reduce:transition-none"
        >
          <div
            onPointerDown={(e) => {
              // 카드 안의 체크는 누르기만 — 끌기로 치지 않는다
              if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
              dragFrom.current = { x: e.clientX, y: e.clientY };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerUp={(e) => endDrag(e.clientX, e.clientY)}
            onPointerCancel={() => (dragFrom.current = null)}
            className={`screen shrink-0 touch-none pt-2.5 select-none ${sheetOpen ? "h-22" : "h-32"}`}
          >
            <button
              type="button"
              onClick={(e) => e.detail === 0 && setSheetOpen(!sheetOpen)}
              aria-expanded={sheetOpen}
              aria-label={sheetOpen ? "목록 접기" : "목록 펼치기"}
              className="mx-auto mb-2.5 flex h-4 w-12 items-center justify-center"
            >
              <span className="h-1 w-9 rounded-full bg-line" />
            </button>
            {sheetOpen ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <h1 className="ds-title-1">
                    {youtube ? "이 영상에 나온 곳" : "이 링크의 장소"} {resolved.candidates.length}
                  </h1>
                  <button
                    type="button"
                    data-no-drag
                    onClick={() => setAllCandidates(!allPicked)}
                    // 제목 줄 높이는 그대로, 누르는 영역만 넓힌다(시트 머리 높이가 고정이다)
                    className="ds-body-2 relative shrink-0 font-semibold text-ink before:absolute before:-inset-3 before:content-['']"
                  >
                    {allPicked ? "전체 해제" : "전체 선택"}
                  </button>
                </div>
                <p className="ds-caption truncate text-sub">
                  맞는 곳만 눌러 남겨주세요. 핀을 누르면 지도에서 크게 보여요
                </p>
              </>
            ) : (
              (() => {
                const c = resolved.candidates[focus];
                const pick = toPicked(c);
                const fit = fitLabel(pick.placeId);
                const area = c.addr?.split(" ").slice(1, 3).join(" ");
                return (
                  <div className="flex items-center gap-3" aria-live="polite">

                    <div className="min-w-0 flex-1">
                      <p className="ds-caption flex items-center gap-1 font-semibold text-sub" data-no-drag>
                        <button
                          type="button"
                          onClick={() => stepFocus(-1)}
                          disabled={focus === 0}
                          aria-label="이전 곳"
                          className="relative -ml-1.5 grid size-6 place-items-center disabled:opacity-30 before:absolute before:-inset-2.5 before:content-['']"
                        >
                          <ChevronLeft size={16} strokeWidth={2} />
                        </button>
                        <span className="tabular-nums">
                          {focus + 1} / {resolved.candidates.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => stepFocus(1)}
                          disabled={focus === resolved.candidates.length - 1}
                          aria-label="다음 곳"
                          className="relative grid size-6 place-items-center disabled:opacity-30 before:absolute before:-inset-2.5 before:content-['']"
                        >
                          <ChevronRight size={16} strokeWidth={2} />
                        </button>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className="ds-title-1 truncate">{c.name}</span>
                        {/* 사진 · 리뷰 · 영업시간은 카카오맵에서. 보이는 아이콘은 16px, 누르는 영역은 44px */}
                        <a
                          href={`https://place.map.kakao.com/${c.kakaoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-no-drag
                          aria-label={`카카오맵에서 ${c.name} 보기`}
                          className="relative grid size-4 shrink-0 place-items-center text-sub before:absolute before:-inset-3.5 before:content-['']"
                        >
                          <ExternalLink size={16} strokeWidth={1.8} />
                        </a>
                        {fit && <FitTag>{fit}</FitTag>}
                      </p>
                      <p className="ds-caption truncate text-sub-on-surface">
                        {[c.category, area].filter(Boolean).join(" · ")}
                      </p>
                      <p className="ds-caption truncate text-sub">{c.evidence}</p>
                    </div>
                    <span data-no-drag>
                      <CheckButton
                        on={picked.some((p) => samePick(p, pick))}
                        label={c.name}
                        onClick={() => togglePick(pick)}
                      />
                    </span>
                  </div>
                );
              })()
            )}
          </div>

          <div ref={listRef} className="screen relative min-h-0 flex-1 overflow-y-auto" inert={!sheetOpen}>
            <ul>
              {resolved.candidates.map((c, i) => {
                const pick = toPicked(c);
                const on = picked.some((p) => samePick(p, pick));
                const fit = fitLabel(pick.placeId);
                const area = c.addr?.split(" ").slice(1, 3).join(" ");
                return (
                  <li
                    key={c.kakaoId}
                    ref={(node) => {
                      rowRefs.current[i] = node;
                    }}
                    className="-mx-3"
                  >
                    {/* 줄 전체가 하나의 버튼 — 누르면 고르기 · 빼기, 지도는 그 곳으로 */}
                    <button
                      type="button"
                      onClick={() => {
                        togglePick(pick);
                        setFocus(i);
                      }}
                      aria-pressed={on}
                      aria-current={i === focus}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left ${
                        i === focus ? "bg-surface" : ""
                      }`}
                    >
                      <span
                        className={`grid size-[22px] shrink-0 place-items-center rounded-full border text-[11px] font-bold ${
                          i === focus ? "border-ink text-ink" : "border-line text-sub"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="ds-title-2 truncate text-ink">{c.name}</span>
                          {fit && <FitTag>{fit}</FitTag>}
                        </span>
                        {(c.category || area) && (
                          <span className="ds-caption block truncate text-sub-on-surface">
                            {[c.category, area].filter(Boolean).join(" · ")}
                          </span>
                        )}
                        <span className="ds-caption block truncate text-sub">{c.evidence}</span>
                      </span>
                      <CheckMark on={on} />
                    </button>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={() => setSearching(true)}
              className="ds-body-2 mt-1 min-h-11 font-semibold text-ink"
            >
              + 다른 곳 직접 찾기
            </button>
          </div>
        </section>

        <div ref={footRef} className="absolute inset-x-0 bottom-0 z-20 bg-white">
          <Foot>
            {picked.length > 0 && (
              <button type="button" onClick={() => save(picked)} className={BTN_PRIMARY}>
                {picked.length}곳 저장
              </button>
            )}
            <button type="button" onClick={() => save([])} className={BTN_TEXT}>
              나중에 정할게요
            </button>
          </Foot>
        </div>
      </div>
    );
  }

  if (step === "pick" && resolved) {
    const found = resolved.candidates.length;
    const youtube = resolved.provider === "youtube";

    return (
      <Screen onBack={backToInput}>
        <div className="screen flex-1">
          <h1 className="ds-display">
            {found ? (
              <>
                {youtube ? "이 영상에 나온 곳이" : "이 링크의 장소가"}
                <br />
                맞나요?
              </>
            ) : (
              <>
                어디인지
                <br />
                알려주세요
              </>
            )}
          </h1>
          <SourceLine url={input.trim()} video={youtube} />

          {found > 0 && !searching && (
            <>
              <p className="ds-caption mt-5 font-semibold text-sub">
                {youtube ? "영상 설명에서 찾은 곳" : "링크에서 찾은 곳"} {found}
              </p>
              <ul className="mt-2 flex flex-col gap-2">
                {resolved.candidates.map((c) => {
                  const pick = toPicked(c);
                  const on = picked.some((p) => samePick(p, pick));
                  const fit = fitLabel(pick.placeId);
                  return (
                    <li key={c.kakaoId}>
                      <PlaceOption on={on} name={c.name} sub={c.evidence} fit={fit} onClick={() => togglePick(pick)} />
                    </li>
                  );
                })}
              </ul>
              <p className="ds-caption mt-3 text-sub">눌러서 맞는 곳만 남겨주세요</p>
              <button
                type="button"
                onClick={() => setSearching(true)}
                className="ds-body-2 mt-1 min-h-11 font-semibold text-ink"
              >
                + 다른 곳 직접 찾기
              </button>
            </>
          )}

          {searching && (
            <ManualSearch
              notFound={found === 0}
              picked={picked}
              onToggle={togglePick}
              toPicked={toPicked}
              fitLabel={fitLabel}
            />
          )}
        </div>

        <Foot>
          {picked.length > 0 && (
            <button type="button" onClick={() => save(picked)} className={BTN_PRIMARY}>
              {picked.length}곳 저장
            </button>
          )}
          <button type="button" onClick={() => save([])} className={BTN_TEXT}>
            나중에 정할게요
          </button>
        </Foot>
      </Screen>
    );
  }

  const done = resolved !== null && !loading;

  return (
    <Screen
      onBack={() => router.back()}
      right={
        <Link href={`${PATH}/saved`} className="ds-body-2 grid min-h-11 place-items-center font-semibold text-ink">
          저장한 곳
        </Link>
      }
    >
      <div className="screen flex-1">
        <h1 className="ds-display">
          가고 싶은 곳,
          <br />
          링크로 남겨두세요
        </h1>
        <p className="ds-body-2 mt-2 text-sub">
          인스타·유튜브·지도에서 본 곳의 링크를 붙여넣으면 어디인지 찾아드려요.
        </p>

        <div className="mt-6 flex min-h-[3.75rem] items-center rounded-xl border border-line p-3 focus-within:border-ink">
          {loading || done ? (
            <span
              className={`ds-body-2 inline-flex h-9 max-w-full items-center gap-1.5 rounded-full bg-surface pr-2.5 ${
                done && resolved?.thumbnail ? "pl-1.5" : "pl-3"
              }`}
            >
              {loading ? (
                <>
                  <span className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-line border-t-ink" />
                  <span className="truncate text-sub">{input}</span>
                </>
              ) : (
                resolved && <>
                  {/* 썸네일이 있으면 그게 출처 표시다 — 플랫폼 이름은 뺀다 */}
                  {resolved.thumbnail ? (
                    <span className="relative h-6 w-[2.625rem] shrink-0 overflow-hidden rounded-md bg-line">
                      <Image src={resolved.thumbnail} alt="" fill sizes="42px" className="object-cover" />
                    </span>
                  ) : (
                    <span className="shrink-0 font-semibold text-ink">
                      {providerLabel(resolved.provider, resolved.url)}
                    </span>
                  )}
                  <span className="truncate text-ink">{resolved.title ?? shortUrl(resolved.url)}</span>
                </>
              )}
              <button type="button" onClick={clear} aria-label="링크 지우기" className="relative -m-1 shrink-0 p-1 text-sub">
                <X size={12} strokeWidth={2.2} />
              </button>
            </span>
          ) : (
            <input
              type="url"
              inputMode="url"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={(e) => {
                // 분석이 시작되면 입력칸이 칩으로 바뀌어 붙여넣기 기본 동작이 값을 못 남긴다
                e.preventDefault();
                const text = e.clipboardData.getData("text").trim();
                setInput(text);
                analyze(text);
              }}
              onKeyDown={(e) => e.key === "Enter" && analyze(input)}
              placeholder="링크 붙여넣기"
              aria-label="링크"
              className="ds-body-1 w-full bg-transparent px-1 outline-none! placeholder:text-sub"
            />
          )}
        </div>

        <p className="ds-caption mt-2.5 text-sub" aria-live="polite">
          {loading && "링크에서 장소를 찾고 있어요"}
          {error && <span className="text-caution">{error}</span>}
          {done &&
            (resolved.candidates.length
              ? `장소 후보 ${resolved.candidates.length}곳을 찾았어요`
              : "자동으로 찾지 못했어요. 이름으로 찾아볼 수 있어요")}
        </p>

      </div>

      {done && (
        <Foot>
          <button type="button" onClick={openPick} className={BTN_PRIMARY}>
            장소 찾기
          </button>
        </Foot>
      )}
    </Screen>
  );
}

/** L2 직접 찾기. 부산 안 카카오 검색, 없으면 이름만 적어 두기 */
function ManualSearch({
  notFound,
  picked,
  onToggle,
  toPicked,
  fitLabel,
}: {
  notFound: boolean;
  picked: Picked[];
  onToggle: (p: Picked) => void;
  toPicked: (p: Place) => Picked;
  fitLabel: (contentId: string | null) => string | null;
}) {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{ keyword: string; items: Place[] } | null>(null);
  const [nameOnly, setNameOnly] = useState("");

  useEffect(() => {
    const keyword = query.trim();
    if (!keyword) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(apiUrl(`/api/place-search?q=${encodeURIComponent(keyword)}`));
        const items: Place[] = res.ok ? await res.json() : [];
        if (!cancelled) setFound({ keyword, items });
      } catch {
        if (!cancelled) setFound({ keyword, items: [] });
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // 지운 검색어의 결과가 남지 않게, 지금 검색어의 결과만 쓴다
  const results = query.trim() && found?.keyword === query.trim() ? found.items : null;

  return (
    <>
      {notFound && picked.length === 0 && (
        <div className="mt-5 rounded-xl bg-surface p-4">
          <p className="ds-body-2 text-sub-on-surface">
            이 링크에서는 장소를 찾지 못했어요.
            <br />
            게시물에 나온 장소 이름으로 찾아주세요.
          </p>
        </div>
      )}

      {picked.length > 0 && (
        <>
          <p className="ds-caption mt-5 font-semibold text-sub">고른 곳 {picked.length}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {picked.map((p) => (
              <button
                key={p.kakaoId ?? p.label}
                type="button"
                onClick={() => onToggle(p)}
                aria-label={`${p.label} 빼기`}
                className="ds-body-2 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-ink pl-3.5 pr-2.5 font-semibold text-ink"
              >
                {p.label}
                <X size={14} strokeWidth={2} />
              </button>
            ))}
          </div>
        </>
      )}

      <label className="mt-4 flex h-12 items-center gap-2.5 rounded-xl border border-line px-3.5 focus-within:border-ink">
        <Search size={20} strokeWidth={1.8} className="shrink-0 text-sub" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="장소 이름"
          aria-label="장소 이름"
          className="ds-body-1 w-full bg-transparent outline-none! placeholder:text-sub"
        />
      </label>

      {results && results.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {results.map((r) => {
            const pick = toPicked(r);
            const on = picked.some((p) => samePick(p, pick));
            const fit = fitLabel(pick.placeId);
            return (
              <li key={r.kakaoId}>
                <PlaceOption
                  on={on}
                  name={r.name}
                  sub={[r.category, r.addr?.replace(/^부산\S*\s*/, "")].filter(Boolean).join(" · ")}
                  fit={fit}
                  onClick={() => onToggle(pick)}
                />
              </li>
            );
          })}
        </ul>
      )}

      {results && results.length === 0 && (
        <>
          <div className="mt-7 flex flex-col items-center gap-1.5 text-center">
            <p className="ds-title-1">찾지 못했어요</p>
            <p className="ds-body-2 text-sub">
              부산 안의 장소만 찾을 수 있어요.
              <br />
              다른 이름으로 찾거나 이름만 적어두세요.
            </p>
          </div>
          <div className="mt-5 rounded-xl bg-surface p-4">
            <p className="ds-title-2">이름만 적어두기</p>
            <p className="ds-caption text-sub-on-surface">지도에는 안 나오고, 저장 목록에 남아요</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const label = nameOnly.trim();
                if (label) onToggle({ label, placeId: null, kakaoId: null });
                setNameOnly("");
              }}
              className="mt-2.5 flex gap-2"
            >
              <input
                value={nameOnly}
                onChange={(e) => setNameOnly(e.target.value)}
                placeholder="예: 전포동 그 카페"
                aria-label="장소 이름 적어두기"
                className="ds-body-1 h-12 min-w-0 flex-1 rounded-[10px] border border-transparent bg-white px-3.5 outline-none! placeholder:text-sub focus:border-ink"
              />
              <button type="submit" className="ds-body-2 shrink-0 px-2 font-semibold text-ink">
                더하기
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}

function SourceLine({ url, video }: { url: string; video: boolean }) {
  return (
    <p className="ds-caption mt-3 flex items-center gap-2 text-sub">
      <Link2 size={14} strokeWidth={1.8} className="shrink-0" />
      <span className="truncate">{shortUrl(url)}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1 font-semibold text-ink"
      >
        {video ? "영상 보기" : "원문 열기"}
        <ExternalLink size={12} strokeWidth={2} />
      </a>
    </p>
  );
}

/**
 * 후보 한 줄. 고른 상태는 오른쪽 체크로만 표시한다 — 잉크로 채운 면은 아래 저장 버튼 하나뿐이어야
 * 무엇을 눌러 끝내는지 읽힌다.
 */
function PlaceOption({
  on,
  name,
  sub,
  fit,
  onClick,
}: {
  on: boolean;
  name: string;
  sub: string;
  fit: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors ${
        on ? "border-ink bg-white" : "border-transparent bg-surface"
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="ds-title-2 truncate text-ink">{name}</span>
          {fit && <FitTag>{fit}</FitTag>}
        </span>
        {sub && <span className="ds-caption block truncate text-sub">{sub}</span>}
      </span>
      <span
        aria-hidden
        className={`grid size-6 shrink-0 place-items-center rounded-full ${
          on ? "border-[1.5px] border-ink bg-white text-ink" : "border-[1.5px] border-line bg-white"
        }`}
      >
        {on && <Check size={14} strokeWidth={2.5} />}
      </span>
    </button>
  );
}

function Screen({
  onBack,
  right,
  children,
}: {
  onBack: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-screen-sm flex-col">
      <AppHeader onBack={onBack} right={right} />
      {children}
    </div>
  );
}

function Foot({ children }: { children: React.ReactNode }) {
  return <div className="screen pb-safe-cta flex flex-col gap-2 pt-3">{children}</div>;
}

export function FitTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="ds-caption shrink-0 rounded-md bg-white px-1.5 font-semibold text-sub-on-surface ring-1 ring-line">
      {children}
    </span>
  );
}

/** 고르기 / 빼기. 보이는 원은 24px, 누르는 영역은 44px */
function CheckButton({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={`${label} 고르기`}
      className="relative grid size-11 shrink-0 place-items-center -mr-2.5"
    >
      <CheckMark on={on} />
    </button>
  );
}

/** 고른 표시. 채우지 않는다 — 잉크로 채운 면은 저장 버튼 몫이다 */
function CheckMark({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] bg-white ${
        on ? "border-ink text-ink" : "border-line"
      }`}
    >
      {on && <Check size={14} strokeWidth={2.5} />}
    </span>
  );
}
