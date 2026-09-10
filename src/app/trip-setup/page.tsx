"use client";

import { useRouter } from "next/navigation";
import { useLocalStorage } from "@/hooks/useLocalStorage";
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
} from "@/data/tripSetup";
import { STORAGE_KEYS, setTripSetupMode } from "@/lib/storage";
import type { TripSetup } from "@/types/trip";

export function TripSetupPage() {
  const router = useRouter();
  const [setup, setSetup] = useLocalStorage<TripSetup>(
    STORAGE_KEYS.tripSetup,
    DEFAULT_TRIP_SETUP,
  );

  const questions = visibleQuestions(setup);
  const summary = summaryLabels(setup);

  const update = (
    key: keyof TripSetup,
    value: string | string[] | null,
  ) => {
    const next: TripSetup = { ...setup, [key]: value };

    // 트리거가 풀리면 딸린 조건부 답을 비운다 (화면설계서 §C).
    // 남겨두면 화면에 안 보이는 값이 엔진으로 넘어간다.
    if (key === "companion_type") {
      const picked = (value ?? []) as string[];
      if (!picked.includes("CHILD")) next.child_age_group = null;
      if (!picked.includes("PET")) next.pet_carry = null;
    }

    setSetup(next);
  };

  const handleSubmit = () => {
    setTripSetupMode("CUSTOM");
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

            return (
              <div
                key={question.id}
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
                    {!question.multiple && (
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
                </div>

                {question.multiple ? (
                  <CheckChipGroup
                    labelledBy={titleId}
                    options={question.options}
                    values={(setup[question.key] as string[]) ?? []}
                    onChange={(values) => update(question.key, values)}
                  />
                ) : (
                  <RadioChipGroup
                    labelledBy={titleId}
                    options={question.options}
                    value={setup[question.key] as string | null}
                    onChange={(value) => update(question.key, value)}
                    onDeselect={() => update(question.key, null)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 px-6 pt-4 pb-safe-cta">
        <p className="ds-caption text-center text-gray-600">
          {TRIP_SETUP_COPY.optionalNotice}
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          className="ds-title-2 flex h-13 w-full items-center justify-center rounded-xl bg-ink text-white transition-all active:scale-[0.98]"
        >
          {TRIP_SETUP_COPY.primaryCta}
        </button>
      </div>
    </div>
  );
}

export { TripSetupPage as default };
