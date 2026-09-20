"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
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

/** 펼친 영역 제목을 스크롤 영역 위에서 이만큼 띄워 멈춘다 */
const SCROLL_GAP = 12;

const visible = (setup: TripSetup, q: TripQuestion) =>
  !q.showWhen || setup[q.showWhen.key] === q.showWhen.equals;

const answered = (setup: TripSetup, q: TripQuestion) => {
  const value = setup[q.key];
  return Array.isArray(value) ? value.length > 0 : value !== null;
};

const sectionDone = (setup: TripSetup, section: TripQuestion[]) =>
  section.every((q) => !visible(setup, q) || answered(setup, q));

/**
 * S03 조건 입력 — 다섯 영역을 한 줄씩 접어 두고, 누른 영역만 펼친다.
 *
 * 선택지를 다 펼치면 칩이 26개라 화면이 무겁다. 접힌 줄에는 고른 값을 보여줘서
 * 펼치지 않고도 무엇을 골랐는지 읽힌다. 고를 때 화면은 움직이지 않는다 —
 * 여러 개 고르는 영역에서 하나만 고르고 화면이 내려가면 나머지를 고를 수 없다.
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
  /** 펼친 영역 — 한 번에 하나만 */
  const [open, setOpen] = useState<number | null>(null);
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

  /** 펼친 영역이 화면 위로 오게 — 접힌 줄이 위에 있어 펼침이 아래로 밀린다 */
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

  /**
   * 저장. 고를 때 화면은 움직이지 않는다 — 여러 개 고르는 영역에서 하나만 고르고
   * 화면이 내려가면 나머지를 고를 수 없다.
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

  /** 미선택 영역이 있으면 보내지 않고 그 영역을 펼쳐 보여준다 (화면설계서 12) */
  const handleSubmit = () => {
    const pending = firstUnanswered(setup);

    if (pending) {
      const index = SECTIONS.findIndex((section) => section.includes(pending));
      setFlagged(pending.id);
      setOpen(index);
      // 펼쳐진 뒤 높이가 잡히면 올린다
      requestAnimationFrame(() => scrollToSection(index));
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
    setOpen(null);
  };

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/profile");
  };

  /** 접힌 줄에 보여줄 값 — 고른 게 없으면 몇 개를 고르는 영역인지 */
  const summary = (section: TripQuestion[]) => {
    const labels: string[] = [];
    for (const raw of section) {
      if (!visible(setup, raw)) continue;
      const question = localize(raw);
      const value = setup[question.key];
      const picked = Array.isArray(value) ? value : value ? [value] : [];
      for (const code of picked) {
        const label = question.options.find((o) => o.value === code)?.label;
        if (label) labels.push(label);
      }
      for (const toggle of question.toggles ?? []) {
        if (setup[toggle.key]) labels.push(toggle.option.label);
      }
    }
    return labels;
  };

  /** 이 영역에서 고른 것만 지운다 — 칩을 다시 눌러 푸는 동작이 눈에 안 보여서 함께 둔다 */
  const clearSection = (section: TripQuestion[]) => {
    const next = { ...setup };
    for (const question of section) {
      (next[question.key] as string[] | string | null) = Array.isArray(
        setup[question.key],
      )
        ? []
        : null;
      for (const toggle of question.toggles ?? [])
        (next[toggle.key] as boolean) = false;
    }
    commit(next);
  };

  const countKey = (section: TripQuestion[]) =>
    section[0].toggles ? "companion" : section[0].multiple ? "any" : "one";

  const renderQuestion = (rawQuestion: TripQuestion, sub: boolean) => {
    const question = localize(rawQuestion);
    const titleId = `${question.id}-title`;
    const invalid = flagged === question.id;

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
        {sub && (
          <h3 id={titleId} className="ds-body-1 font-semibold">
            {question.title}
          </h3>
        )}
        {question.helperText && HELP_SHOWN.has(question.id) && (
          <p className="ds-caption mt-1 text-sub">{question.helperText}</p>
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

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto">
        {/* 제목은 스크롤과 함께 올라간다 — 고정하면 선택지가 보이는 영역이 좁다 */}
        <div className="px-6 pt-3 pb-5">
          <h1 className="ds-display">{t("title")}</h1>
          <p className="ds-body-1 mt-2 text-sub">{t("lead")}</p>
        </div>

        <div className="flex flex-col px-6 pb-10">
          {SECTIONS.map((section, sectionIndex) => {
            const expanded = open === sectionIndex;
            const picked = summary(section);
            const panelId = `${section[0].id}-panel`;
            return (
              <section
                key={section[0].id}
                ref={(el) => {
                  sectionRefs.current[sectionIndex] = el;
                }}
                className="border-b border-hair last:border-b-0"
              >
                <h2>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => setOpen(expanded ? null : sectionIndex)}
                    className="flex w-full items-center gap-4 py-6 text-left"
                  >
                    <span className="ds-title-1 shrink-0 font-bold">
                      {localize(section[0]).title}
                    </span>
                    <span
                      className={`ds-body-2 flex-1 truncate text-right ${
                        picked.length > 0 ? "text-ink" : "text-sub"
                      }`}
                    >
                      {picked.length > 0
                        ? picked.join(" · ")
                        : t(`count.${countKey(section)}`)}
                    </span>
                    <ChevronDown
                      size={20}
                      strokeWidth={1.8}
                      aria-hidden
                      className={`shrink-0 text-sub transition-transform duration-200 ${
                        expanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </h2>
                {expanded && (
                  <div id={panelId} className="pb-4">
                    {section
                      .filter((q) => visible(setup, q))
                      .map((q) => renderQuestion(q, Boolean(q.showWhen)))}
                    {/* 자리는 늘 잡아 둔다 — 나타났다 사라질 때 아래가 밀리지 않게 */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => clearSection(section)}
                        aria-hidden={picked.length === 0}
                        tabIndex={picked.length === 0 ? -1 : undefined}
                        className={`ds-body-2 min-h-11 px-2 font-medium text-sub underline underline-offset-4 ${
                          picked.length === 0 ? "invisible" : ""
                        }`}
                      >
                        {t("clear")}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      <div className="pb-safe-cta flex shrink-0 items-center gap-4 border-t border-hair px-6 pt-4">
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
              : "bg-surface text-sub-on-surface"
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
