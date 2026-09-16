"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useHydrated, useStoredSnapshot } from "@/hooks/useStoredSnapshot";
import { buildCf8Profile } from "@/lib/cfp";
import { AppHeader } from "@/components/common/AppHeader";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { CharacterReveal } from "@/components/profile/CharacterReveal";
import { DEFAULT_QUIZ_ANSWERS, DEFAULT_HARD_FILTER } from "@/data/quiz";
import { CF8_PROFILES } from "@/data/cf8Profiles";
import {
  STORAGE_KEYS,
  clearJustDiagnosed,
  readJustDiagnosed,
  setTripSetupMode,
} from "@/lib/storage";
import type { Locale } from "@/i18n/routing";

/** 축 → 시트 사본의 축 카드 이름 */
const AXES = [
  { key: "atmosphere", card: "atmosphere" },
  { key: "placeType", card: "place" },
  { key: "experience", card: "rhythm" },
] as const;

/** 첫 화면 맨 위에서 이만큼 넘게 밀면 두 번째 화면으로 */
const PUSH = 60;
/** 스크롤이 이만큼 멈추면 손을 뗀 것으로 본다 */
const SETTLE = 140;
/** 화면 2 항목이 올라오는 최소 간격 — 한꺼번에 보여도 차례로 */
const RISE_GAP = 150;

function scrollToY(scroller: HTMLElement | null, top: number) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  scroller?.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
}

/**
 * S02 취향 결과 — 두 화면.
 *
 * 화면 1 은 결과 하나(유형명 · 캐릭터 · 소개)가 보이는 높이를 채우고, 화면 2 는
 * 축 세 개와 추천 약속. 스냅은 첫 화면 맨 위에서 아래로 밀었을 때만 한다 —
 * CSS 스냅은 위로 올릴 때도 끌어당기고 화면 2 끝에서 튕긴다.
 */
export function ProfilePage() {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const t = useTranslations("profile");
  const tAxis = useTranslations("onboarding.axis");
  const hydrated = useHydrated();
  /**
   * 캐릭터 공개는 온보딩에서 막 넘어왔을 때만 돈다.
   *
   * 서버 스냅샷이 `false` 라 `/profile` 을 직접 열면(북마크·새로고침·유형 카드)
   * 결과가 바로 그려진다.
   */
  const justDiagnosed = useStoredSnapshot(readJustDiagnosed, false);
  const [revealDone, setRevealDone] = useState(false);
  const revealing = justDiagnosed && !revealDone;
  const [answers] = useLocalStorage(STORAGE_KEYS.answers, DEFAULT_QUIZ_ANSWERS);
  const [, setCf8Code] = useLocalStorage(STORAGE_KEYS.cf8Code, "");
  const [hardFilter] = useLocalStorage(
    STORAGE_KEYS.hardFilter,
    DEFAULT_HARD_FILTER,
  );
  const [retakeOpen, setRetakeOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);
  /** 화면 1 높이 — 하단 버튼이 펼쳐진 상태에서 잰다 */
  const stageRef = useRef(0);
  const [stageHeight, setStageHeight] = useState<number>();
  const [collapsed, setCollapsed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const detailRef = useRef<HTMLElement>(null);
  /** 화면 2 에서 보인 항목 → 올라오기 시작할 때까지 기다릴 시간(ms) */
  const [risen, setRisen] = useState<Record<number, number>>({});

  const profile = buildCf8Profile(answers, hardFilter);
  const typeCopy = CF8_PROFILES[locale][profile.code];

  // 진단 결과 코드를 저장한다 (재방문 시 진단 건너뛰기 분기에 사용)
  useEffect(() => {
    setCf8Code(profile.code);
  }, [profile.code, setCf8Code]);

  const finishReveal = useCallback(() => {
    setRevealDone(true);
    // 연출이 끝난 뒤에 지운다 — 도중에 지우면 신호가 사라지며 연출이 끊긴다
    clearJustDiagnosed();
  }, []);

  useEffect(() => {
    const scroller = scrollRef.current;
    const foot = footRef.current;
    if (!scroller || !foot) return;

    let footHeight = foot.offsetHeight;
    let isCollapsed = false;
    // 버튼이 접혀 스크롤 영역이 커져도 화면 2 시작 위치가 밀리지 않게, 창 크기가 바뀔 때만 다시 잰다
    const measure = () => {
      if (!isCollapsed) footHeight = foot.offsetHeight;
      stageRef.current = scroller.clientHeight - (isCollapsed ? footHeight : 0);
      setStageHeight(stageRef.current);
    };
    measure();

    let timer: ReturnType<typeof setTimeout> | undefined;
    let gesture = false;
    let startY = 0;
    let lastY = 0;
    const settle = () => {
      const y = scroller.scrollTop;
      const from = startY;
      gesture = false;
      lastY = y;
      startY = y;
      // 첫 화면 맨 위에서 아래로 민 경우만 — 위로 올릴 때 · 화면 2 안에서는 손 뗀 자리에 둔다
      if (from <= 2 && y > from && y < stageRef.current)
        scrollToY(scroller, y > PUSH ? stageRef.current : 0);
    };
    const onScroll = () => {
      const y = scroller.scrollTop;
      isCollapsed = y > stageRef.current / 2;
      setCollapsed(isCollapsed);
      setScrolled(y > 8);
      if (!gesture) {
        gesture = true;
        startY = lastY;
      }
      clearTimeout(timer);
      timer = setTimeout(settle, SETTLE);
    };

    window.addEventListener("resize", measure);
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measure);
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [hydrated]);

  // 항목마다 화면에 들어설 때 올라온다. 앞 항목이 막 올라왔으면 RISE_GAP 만큼 뒤에 —
  // 스냅처럼 빠르게 내려가 여러 개가 한 번에 보여도 위에서부터 차례로
  useEffect(() => {
    const items = detailRef.current?.querySelectorAll<HTMLElement>("[data-rise]");
    if (!items) return;
    let nextAt = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        const fresh = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target as HTMLElement)
          .sort((a, b) => Number(a.dataset.rise) - Number(b.dataset.rise));
        if (!fresh.length) return;
        const now = performance.now();
        const delays: Record<number, number> = {};
        for (const el of fresh) {
          observer.unobserve(el);
          nextAt = Math.max(now, nextAt);
          delays[Number(el.dataset.rise)] = Math.round(nextAt - now);
          nextAt += RISE_GAP;
        }
        setRisen((prev) => ({ ...prev, ...delays }));
      },
      { root: scrollRef.current, rootMargin: "0px 0px -10% 0px" },
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [hydrated]);

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/feed");
  };

  // S02의 두 갈래가 trip_setup_mode를 결정한다 (04_추천로직 R024).
  // QUICK이면 엔진이 CF8 + 자동상황(날씨·계절·시간대)만 쓰고 S03 조건은 보지 않는다.
  const handleStart = () => {
    setTripSetupMode("QUICK");
    router.push("/feed");
  };

  const handleMoreConditions = () => {
    setTripSetupMode("CUSTOM");
    router.push("/trip-setup");
  };

  // localStorage 를 읽기 전에는 기본 유형이 스친다
  if (!hydrated) return <div className="flex-1" />;

  /** 공개 연출 중에는 자리만 잡아 두고, 끝나면 순서대로 올라온다 */
  const enter = (delay: string, kind = "animate-reveal") =>
    revealing ? "invisible" : `${kind} animate-reveal-${delay}`;
  /** 화면 2 항목 — 보이기 전에는 숨겨 두고, 보이면 차례대로 올라온다 */
  const rise = (order: number, className: string) => ({
    "data-rise": order,
    className: `${className} ${order in risen ? "animate-rise" : "opacity-0"}`,
    style: { animationDelay: `${risen[order] ?? 0}ms` },
  });

  const actions = (
    <>
      <button
        type="button"
        onClick={handleStart}
        className="ds-title-2 flex min-h-12 w-full items-center justify-center rounded-xl bg-primary text-white transition-colors active:bg-primary-press"
      >
        {t("primary")}
      </button>
      <button
        type="button"
        onClick={handleMoreConditions}
        className="flex min-h-15 w-full flex-col items-center justify-center gap-0.5 rounded-xl border border-line py-2 text-ink transition-colors active:bg-surface"
      >
        <span className="ds-title-2">{t("secondary")}</span>
        <span className="ds-caption font-medium text-sub">
          {t("secondaryHint")}
        </span>
      </button>
    </>
  );

  return (
    <div className="flex h-dvh flex-col">
      <div className={enter("d1", "animate-fade-delayed")}>
        <AppHeader
          onBack={back}
          right={
            <button
              type="button"
              onClick={() => setRetakeOpen(true)}
              aria-label={t("retake.label")}
              className="-mr-3 flex size-11 items-center justify-center text-sub transition-all active:scale-[0.95]"
            >
              <RotateCcw size={20} strokeWidth={1.5} />
            </button>
          }
        />
      </div>

      <div
        ref={scrollRef}
        className={`min-h-0 flex-1 ${revealing ? "overflow-hidden" : "overflow-y-auto"}`}
      >
        {/* 화면 1 */}
        <section
          style={{ minHeight: stageHeight }}
          className="flex min-h-full flex-col items-center justify-center px-8 pt-8 pb-5 text-center"
        >
          <p className={`ds-body-2 font-medium text-sub ${enter("d1")}`}>
            {t("label")}
          </p>
          <h1 className={`ds-display mt-3 ${enter("d2")}`}>
            {typeCopy.profileName}
          </h1>
          <p className={`ds-title-1 mt-2 font-semibold ${enter("d3")}`}>
            {AXES.map((axis) => typeCopy[axis.card].value).join(" · ")}
          </p>

          <div className="relative mt-4 grid size-55 place-items-center">
            <span
              aria-hidden
              className="absolute size-45 rounded-full bg-primary-tint"
            />
            {revealing ? (
              <CharacterReveal
                code={profile.code}
                name={typeCopy.profileName}
                onDone={finishReveal}
              />
            ) : (
              <Image
                src={`/characters/${profile.code}.webp`}
                alt=""
                width={440}
                height={440}
                priority
                className="relative size-full"
              />
            )}
          </div>

          <p className={`ds-body-1 mt-4 text-sub ${enter("d4")}`}>
            {typeCopy.resultIntro}
          </p>

          <div className={`mt-8 ${enter("d6", "animate-fade-delayed")}`}>
            <button
              type="button"
              onClick={() => scrollToY(scrollRef.current, stageRef.current)}
              aria-label={t("more")}
              className={`animate-nudge grid size-12 place-items-center text-sub transition-opacity ${
                scrolled ? "pointer-events-none opacity-0" : ""
              }`}
            >
              <ChevronDown size={22} strokeWidth={1.8} />
            </button>
          </div>
        </section>

        {/* 화면 2 — 취향 · 약속 카드 · 버튼 세 덩어리는 같은 간격 */}
        <section
          ref={detailRef}
          className="flex min-h-full flex-col gap-10 px-8 pt-8 pb-8"
        >
          <div>
            <h2 {...rise(0, "ds-title-1 pb-4 text-center font-bold")}>
              {t("axesHeading")}
            </h2>
            {AXES.map((axis, i) => {
              const left = profile.axes[axis.key].value === -1;
              return (
                <div
                  key={axis.key}
                  {...rise(
                    i + 1,
                    `py-5 text-center last:pb-0 ${i > 0 ? "border-t border-hair" : ""}`,
                  )}
                >
                  <p className="ds-body-1 font-bold">{tAxis(axis.key)}</p>
                  <div aria-hidden className="mt-4 flex items-center gap-2">
                    <span
                      className={`size-3 rounded-full border-2 ${left ? "border-ink bg-ink" : "border-line bg-page"}`}
                    />
                    <span className="h-0.5 flex-1 rounded-full bg-hair" />
                    <span
                      className={`size-3 rounded-full border-2 ${left ? "border-line bg-page" : "border-ink bg-ink"}`}
                    />
                  </div>
                  <div className="ds-body-2 mt-2 flex justify-between">
                    <span
                      className={left ? "font-bold" : "font-medium text-sub"}
                    >
                      {t(`poles.${axis.key}.left`)}
                    </span>
                    <span
                      className={left ? "font-medium text-sub" : "font-bold"}
                    >
                      {t(`poles.${axis.key}.right`)}
                    </span>
                  </div>
                  <p className="ds-body-2 mt-3 text-sub">
                    {typeCopy[axis.card].body}
                  </p>
                </div>
              );
            })}
          </div>

          <div {...rise(4, "rounded-2xl bg-surface p-5")}>
            <p className="ds-body-2 font-semibold text-sub">
              {t("promiseTitle")}
            </p>
            <p className="ds-body-1 mt-1 font-semibold">
              {typeCopy.recommendationPromise}
            </p>
          </div>

          <div {...rise(5, "flex flex-col gap-3")}>
            {actions}
          </div>

          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={() => scrollToY(scrollRef.current, 0)}
              aria-label={t("top")}
              className="animate-nudge-up grid size-12 place-items-center text-sub"
            >
              <ChevronUp size={22} strokeWidth={1.8} />
            </button>
          </div>
        </section>
      </div>

      {/* 화면 2 에 들어서면 접고, 같은 버튼을 본문에 둔다 */}
      <div
        ref={footRef}
        inert={collapsed}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ${
          collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`screen pb-safe-cta flex flex-col gap-3 border-t border-hair pt-3 ${enter("d5", "animate-fade-delayed")}`}
          >
            {actions}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={retakeOpen}
        title={t("retake.title")}
        body={t("retake.body")}
        primaryLabel={t("retake.confirm")}
        secondaryLabel={t("retake.close")}
        onPrimary={() => {
          setRetakeOpen(false);
          router.push("/onboarding");
        }}
        onSecondary={() => setRetakeOpen(false)}
        onClose={() => setRetakeOpen(false)}
      />
    </div>
  );
}

export { ProfilePage as default };
