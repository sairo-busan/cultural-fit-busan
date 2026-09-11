"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStoredState } from "@/hooks/useStoredState";
import { AppHeader } from "@/components/common/AppHeader";
import {
  RadioChipGroup,
  CheckChipGroup,
} from "@/components/common/ChoiceChipGroup";
import {
  TRIP_SETUP_COPY,
  DEFAULT_TRIP_SETUP,
  visibleQuestions,
  summaryLabels,
  firstUnanswered,
  isCompanionValid,
  isUntouched,
} from "@/data/tripSetup";
import { STORAGE_KEYS, setTripSetupMode } from "@/lib/storage";
import type { TripSetup } from "@/types/trip";

export function TripSetupPage() {
  const router = useRouter();
  const [setup, setSetup] = useStoredState<TripSetup>(
    STORAGE_KEYS.tripSetup,
    DEFAULT_TRIP_SETUP,
  );

  /** 미선택으로 지적된 문항 id — 추천 받기를 누른 뒤에만 표시한다 */
  const [flagged, setFlagged] = useState<string | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const questions = visibleQuestions(setup);
  const summary = summaryLabels(setup);
  const canSkip = isUntouched(setup);

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

    setSetup(next);
    setFlagged(null);
  };

  /** 미선택 영역이 있으면 보내지 않고 그 문항으로 이동시킨다 (화면설계서 12) */
  const handleSubmit = () => {
    const pending = firstUnanswered(setup);

    if (pending) {
      setFlagged(pending.id);
      sectionRefs.current[pending.id]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    setTripSetupMode("CUSTOM");
    router.push("/feed");
  };

  /** 아무것도 안 고른 상태에서만 누를 수 있다. CF8은 유지한 채 피드로 */
  const handleSkip = () => {
    setTripSetupMode("QUICK");
    router.push("/feed");
  };

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader onBack={() => router.push("/profile")} />

      <div className="flex items-center gap-3 bg-ds-surface px-6 py-3">
        <p
          className={`ds-body-2 flex-1 truncate ${
            summary.length > 0 ? "text-ink" : "text-gray-600"
          }`}
        >
          {summary.length > 0
            ? summary.join(" · ")
            : TRIP_SETUP_COPY.emptySummary}
        </p>
        {summary.length > 0 && (
          <button
            type="button"
            onClick={() => setSetup(DEFAULT_TRIP_SETUP)}
            className="ds-caption -my-2 shrink-0 py-2 text-gray-600 underline underline-offset-2"
          >
            {TRIP_SETUP_COPY.clearAll(summary.length)}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-2 px-6 pt-8">
          <h1 className="ds-headline text-ink">{TRIP_SETUP_COPY.title}</h1>
          <p className="ds-body-1 text-gray-600">
            {TRIP_SETUP_COPY.description}
          </p>
        </div>

        <div className="flex flex-col gap-8 px-6 pt-8 pb-8">
          {questions.map((question) => {
            const titleId = `${question.id}-title`;
            const invalid = flagged === question.id;

            return (
              <div
                key={question.id}
                ref={(el) => {
                  sectionRefs.current[question.id] = el;
                }}
                className={
                  question.showWhen
                    ? "-mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 px-4 py-4"
                    : "flex flex-col gap-3"
                }
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <p id={titleId} className="ds-title-1 text-ink">
                      {question.title}
                    </p>
                    {!question.multiple && !question.toggles && (
                      <span className="ds-caption text-gray-600">
                        {TRIP_SETUP_COPY.singleHint}
                      </span>
                    )}
                  </div>
                  {question.helperText && (
                    <p className="ds-body-2 text-gray-600">
                      {question.helperText}
                    </p>
                  )}
                  {invalid && (
                    <p role="alert" className="ds-body-2 text-ds-error">
                      {TRIP_SETUP_COPY.incompleteHint}
                    </p>
                  )}
                </div>

                {question.multiple ? (
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
                  />
                )}

                {question.toggles && (
                  <CheckChipGroup
                    labelledBy={titleId}
                    options={question.toggles.map((t) => t.option)}
                    values={question.toggles
                      .filter((t) => setup[t.key])
                      .map((t) => t.option.value)}
                    onChange={(values) => {
                      const next = { ...setup };
                      for (const toggle of question.toggles ?? []) {
                        const on = values.includes(toggle.option.value);
                        (next[toggle.key] as boolean) = on;
                        if (!on && toggle.key === "childWith")
                          next.childAgeGroup = null;
                        if (!on && toggle.key === "petWith")
                          next.petCarry = null;
                      }
                      // 주 동행 없이 아이·반려동물만 고를 수 없다
                      if (!isCompanionValid(next)) {
                        setFlagged(question.id);
                        return;
                      }
                      setSetup(next);
                      setFlagged(null);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 px-6 pt-4 pb-safe-cta">
        <p className="ds-caption text-center text-gray-600">
          {TRIP_SETUP_COPY.fillNotice}
        </p>
        <div className="flex gap-3">
          {canSkip && (
            <button
              type="button"
              onClick={handleSkip}
              className="ds-title-2 flex h-13 flex-1 items-center justify-center rounded-xl border border-gray-300 text-ink transition-all active:scale-[0.98]"
            >
              {TRIP_SETUP_COPY.skipCta}
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            className="ds-title-2 flex h-13 flex-1 items-center justify-center rounded-xl bg-ink text-white transition-all active:scale-[0.98]"
          >
            {TRIP_SETUP_COPY.primaryCta}
          </button>
        </div>
      </div>
    </div>
  );
}

export { TripSetupPage as default };
