"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useStoredState } from "@/hooks/useStoredState";
import { AppHeader } from "@/components/common/AppHeader";
import {
  RadioChipGroup,
  CheckChipGroup,
} from "@/components/common/ChoiceChipGroup";
import {
  TRIP_QUESTIONS,
  DEFAULT_TRIP_SETUP,
  normalizeTripSetup,
  firstUnanswered,
  isCompanionValid,
  isUntouched,
} from "@/data/tripSetup";
import { TRIP_QUESTION_TEXT_EN } from "@/data/tripSetupEn";
import { STORAGE_KEYS, setTripSetupMode } from "@/lib/storage";
import type { TripSetup, TripQuestion } from "@/types/trip";

/** 영역 — 조건부 문항(아이 나이 · 반려동물 이동)은 트리거 문항 영역 안에 들어간다 */
const SECTIONS = TRIP_QUESTIONS.reduce<TripQuestion[][]>((sections, q) => {
  if (q.showWhen) sections[sections.length - 1].push(q);
  else sections.push([q]);
  return sections;
}, []);

/** 규칙을 설명하는 도움말만 보인다 */
const HELP_SHOWN = new Set(["CMP01", "CHILD01"]);

/** 영역 제목을 고정 제목 아래 이만큼 띄워 멈춘다 */
const SCROLL_GAP = 16;

const visible = (setup: TripSetup, q: TripQuestion) =>
  !q.showWhen || setup[q.showWhen.key] === q.showWhen.equals;

const answered = (setup: TripSetup, q: TripQuestion) => {
  const value = setup[q.key];
  return Array.isArray(value) ? value.length > 0 : value !== null;
};

const sectionDone = (setup: TripSetup, section: TripQuestion[]) =>
  section.every((q) => !visible(setup, q) || answered(setup, q));

/**
 * S03 조건 입력 — 제목은 고정하고 다섯 영역을 모두 그린다.
 *
 * 다섯 영역을 한 화면에 늘어놓고 순서와 상관없이 고르게 둔다. 덜 채운 채
 * 추천받기를 누르면 그 영역으로 올려 보여준다.
 */
export function TripSetupPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("tripSetup");
  const [stored, setSetup] = useStoredState<TripSetup>(
    STORAGE_KEYS.tripSetup,
    DEFAULT_TRIP_SETUP,
  );
  // 옛 빌드가 남긴 모양이 섞여 들어온다 — 씻어서 쓴다
  const setup = useMemo(() => normalizeTripSetup(stored), [stored]);

  /** 미선택으로 지적된 문항 id — 추천받기를 누른 뒤에만 표시한다 */
  const [flagged, setFlagged] = useState<string | null>(null);
  const [tailPad, setTailPad] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const doneCount = SECTIONS.filter((section) =>
    sectionDone(setup, section),
  ).length;
  const complete = doneCount === SECTIONS.length;
  const untouched = isUntouched(setup);

  /** 문항 하나를 영문 모드면 TRIP_QUESTION_TEXT_EN으로 치환한 뒤 돌려준다. 없으면 한국어 그대로 */
  const localize = (question: TripQuestion): TripQuestion => {
    if (locale !== "en") return question;
    const en = TRIP_QUESTION_TEXT_EN[question.id];
    if (!en) return question;
    return {
      ...question,
      title: en.title,
      helperText: en.helperText ?? question.helperText,
      options: question.options.map((o) => ({
        ...o,
        label: en.options[o.value]?.label ?? o.label,
        description: en.options[o.value]?.description ?? o.description,
      })),
      toggles: question.toggles?.map((t) => ({
        ...t,
        option: {
          ...t.option,
          label: en.toggles?.[t.key]?.label ?? t.option.label,
          description: en.toggles?.[t.key]?.description ?? t.option.description,
        },
      })),
    };
  };

  const scrollToSection = (index: number) => {
    const scroller = scrollRef.current;
    const section = sectionRefs.current[index];
    if (!scroller || !section) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    scroller.scrollTo({
      top: section.offsetTop - SCROLL_GAP,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  // 마지막 영역도 고정 제목 아래까지 올릴 수 있게 끝에 여백을 둔다
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const measure = () => {
      const last = sectionRefs.current[SECTIONS.length - 1];
      setTailPad(
        Math.max(0, scroller.clientHeight - (last?.offsetHeight ?? 0) - SCROLL_GAP),
      );
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  /**
   * 저장. 다음 영역으로 자동으로 내려가지 않는다 —
   * 여러 개 고르는 영역에서 하나만 고르고 화면이 움직이면 나머지를 고를 수 없다.
   */
  const commit = (next: TripSetup) => {
    setSetup(next);
    setFlagged(null);
  };

  const update = (
    key: keyof TripSetup,
    value: string | string[] | boolean | null,
  ) => {
    const next: TripSetup = { ...setup, [key]: value };

    // 남겨두면 화면에 안 보이는 값이 엔진으로 넘어간다
    if (key === "childWith" && !value) next.childAgeGroup = null;
    if (key === "petWith" && !value) next.petCarry = null;

    // 상세를 취소하면 동반 선택도 취소한다 (화면설계서 5·6)
    if (key === "childAgeGroup" && value === null) next.childWith = false;
    if (key === "petCarry" && value === null) next.petWith = false;

    commit(next);
  };

  /** 미선택 영역이 있으면 보내지 않고 그 문항으로 이동시킨다 (화면설계서 12) */
  const handleSubmit = () => {
    const pending = firstUnanswered(setup);

    if (pending) {
      setFlagged(pending.id);
      scrollToSection(
        SECTIONS.findIndex((section) => section.includes(pending)),
      );
      return;
    }

    setTripSetupMode("CUSTOM");
    router.push("/feed");
  };

  /** 아무것도 안 골랐으면 CF8만으로 추천, 골랐으면 모두 지우고 첫 영역으로 */
  const handleLeft = () => {
    if (untouched) {
      setTripSetupMode("QUICK");
      router.push("/feed");
      return;
    }
    setSetup(DEFAULT_TRIP_SETUP);
    setFlagged(null);
    scrollToSection(0);
  };

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/profile");
  };

  const renderQuestion = (rawQuestion: TripQuestion, sub: boolean) => {
    const question = localize(rawQuestion);
    const titleId = `${question.id}-title`;
    const invalid = flagged === question.id;
    const count = question.toggles
      ? "companion"
      : question.multiple
        ? "any"
        : "one";

    const chips = question.multiple ? (
      <CheckChipGroup
        labelledBy={titleId}
        options={question.options}
        values={(setup[question.key] as string[]) ?? []}
        onChange={(values) => update(question.key, values)}
        invalid={invalid}
      />
    ) : (
      <RadioChipGroup
        labelledBy={titleId}
        options={question.options}
        value={setup[question.key] as string | null}
        onChange={(value) => update(question.key, value)}
        onDeselect={() => update(question.key, null)}
        invalid={invalid}
        className={question.toggles ? "contents" : undefined}
      />
    );

    return (
      <div
        key={question.id}
        className={sub ? "mt-4 border-l-2 border-hair pl-4" : ""}
      >
        {sub ? (
          <h3 id={titleId} className="ds-body-1 font-semibold">
            {question.title}
          </h3>
        ) : (
          <div className="flex items-baseline justify-between gap-3">
            <h2 id={titleId} className="ds-title-1 font-bold">
              {question.title}
            </h2>
            <span className="ds-caption shrink-0 text-sub">
              {t(`count.${count}`)}
            </span>
          </div>
        )}
        {question.helperText && HELP_SHOWN.has(question.id) && (
          <p className="ds-body-2 mt-1 text-sub">{question.helperText}</p>
        )}
        {invalid && (
          <p role="alert" className="ds-body-2 mt-1 text-danger">
            {t(question.multiple ? "empty.any" : "empty.one")}
          </p>
        )}

        <div className="mt-3">
          {question.toggles ? (
            // 주 동행과 아이 · 반려동물을 한 줄로 이어 붙인다
            <div className="flex flex-wrap gap-2">
              {chips}
              <CheckChipGroup
                labelledBy={titleId}
                options={question.toggles.map((t) => t.option)}
                values={question.toggles
                  .filter((t) => setup[t.key])
                  .map((t) => t.option.value)}
                className="contents"
                onChange={(values) => {
                  const next = { ...setup };
                  for (const toggle of question.toggles ?? []) {
                    const on = values.includes(toggle.option.value);
                    (next[toggle.key] as boolean) = on;
                    if (!on && toggle.key === "childWith")
                      next.childAgeGroup = null;
                    if (!on && toggle.key === "petWith") next.petCarry = null;
                  }
                  // 주 동행 없이 아이·반려동물만 고를 수 없다
                  if (!isCompanionValid(next)) {
                    setFlagged(question.id);
                    return;
                  }
                  commit(next);
                }}
              />
            </div>
          ) : (
            chips
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader onBack={back} />

      <div className="screen shrink-0 pt-2 pb-2">
        <h1 className="ds-display">{t("title")}</h1>
        <p className="ds-body-1 mt-2 text-sub">{t("lead")}</p>
      </div>

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="screen flex flex-col gap-8 pt-6">
          {SECTIONS.map((section, sectionIndex) => (
            <section
              key={section[0].id}
              ref={(el) => {
                sectionRefs.current[sectionIndex] = el;
              }}
            >
              {section
                .filter((q) => visible(setup, q))
                .map((q) => renderQuestion(q, Boolean(q.showWhen)))}
            </section>
          ))}
        </div>
        <div aria-hidden style={{ height: tailPad }} />
      </div>

      <div className="screen pb-safe-cta flex shrink-0 items-center gap-4 border-t border-hair pt-3">
        {/* 두 문구 중 넓은 쪽으로 자리를 잡아 둔다 — 바뀔 때 버튼이 밀리지 않게 */}
        <button
          type="button"
          onClick={handleLeft}
          className="ds-body-2 grid min-h-12 shrink-0 place-items-center px-2 font-medium text-sub"
        >
          <span aria-hidden className="invisible col-start-1 row-start-1">
            {t("later")}
          </span>
          <span aria-hidden className="invisible col-start-1 row-start-1">
            {t("reset")}
          </span>
          <span className="col-start-1 row-start-1">
            {untouched ? t("later") : t("reset")}
          </span>
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className={`ds-title-2 flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-xl transition-colors ${
            complete
              ? "bg-primary text-white active:bg-primary-press"
              : "bg-surface text-sub"
          }`}
        >
          {complete ? (
            t("submitDone")
          ) : (
            <>
              {t("submit")}
              <span className="ds-body-2 font-semibold tabular-nums">
                {doneCount}/{SECTIONS.length}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export { TripSetupPage as default };
