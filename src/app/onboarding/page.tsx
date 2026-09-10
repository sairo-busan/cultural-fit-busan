"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { AppHeader } from "@/components/common/AppHeader";
import { RadioChipGroup } from "@/components/common/ChoiceChipGroup";
import { QuizProgress } from "@/components/quiz/QuizProgress";
import {
  QUIZ_QUESTIONS,
  TOTAL_QUESTIONS,
  QUIZ_INTRO,
  DEFAULT_QUIZ_ANSWERS,
} from "@/data/quiz";
import { isComplete } from "@/lib/cfp";
import { STORAGE_KEYS } from "@/lib/storage";
import type { QuizAnswers, AxisValue } from "@/types/cfp";

/**
 * S01 취향 진단.
 *
 * 3문항을 한 화면에 둔다 — 피그마 `S01`(1007:1661)과 화면설계서 slide1 기준.
 * 이전에는 문항당 1화면이었는데, 2지선다로 바뀌면서 화면 하나에 선택지 두 개만
 * 남아 허전했다.
 *
 * 상단 단계 표시는 첫 미응답 문항을 가리킨다. 누르면 그 문항으로 스크롤한다.
 */
export function OnboardingPage() {
  const router = useRouter();
  const [answers, setAnswers] = useLocalStorage<QuizAnswers>(
    STORAGE_KEYS.answers,
    DEFAULT_QUIZ_ANSWERS,
  );
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollTo = (id: string) =>
    sectionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

  const pendingIndex = QUIZ_QUESTIONS.findIndex(
    (q) => answers[q.answerKey] === null,
  );
  const currentStep = pendingIndex === -1 ? TOTAL_QUESTIONS : pendingIndex + 1;

  /** 미응답이 있으면 결과로 보내지 않고 그 문항으로 이동시킨다 */
  const handleSubmit = () => {
    if (pendingIndex !== -1) {
      scrollTo(QUIZ_QUESTIONS[pendingIndex].id);
      return;
    }
    router.push("/profile");
  };

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        onBack={() => router.push("/")}
        right={
          <button
            type="button"
            onClick={() => router.push("/feed")}
            className="ds-caption text-gray-600"
          >
            {QUIZ_INTRO.skipLabel}
          </button>
        }
      />

      <QuizProgress
        currentStep={currentStep}
        totalSteps={TOTAL_QUESTIONS}
        labels={QUIZ_QUESTIONS.map((q) => q.stepLabel)}
        onStepClick={(step) => scrollTo(QUIZ_QUESTIONS[step - 1].id)}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-2 px-6 pt-6">
          <span className="ds-label text-gray-600">{QUIZ_INTRO.eyebrow}</span>
          <h1 className="ds-display text-ink">{QUIZ_INTRO.title}</h1>
          <p className="ds-body-1 text-gray-600">{QUIZ_INTRO.description}</p>
        </div>

        <div className="flex flex-col gap-3 px-6 pt-8 pb-8">
          {QUIZ_QUESTIONS.map((question) => {
            const titleId = `${question.id}-title`;
            const value = answers[question.answerKey];

            return (
              <div
                key={question.id}
                ref={(el) => {
                  sectionRefs.current[question.id] = el;
                }}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 px-5 py-5"
              >
                <div className="flex flex-col gap-2">
                  <span className="ds-caption text-gray-600">
                    {question.stepLabel}
                  </span>
                  <p id={titleId} className="ds-title-1 text-ink">
                    {question.question}
                  </p>
                </div>

                <RadioChipGroup
                  variant="row"
                  labelledBy={titleId}
                  options={question.choices.map((choice) => ({
                    value: String(choice.value),
                    label: choice.label,
                    description: choice.description,
                  }))}
                  value={value === null ? null : String(value)}
                  onChange={(next) =>
                    setAnswers({
                      ...answers,
                      [question.answerKey]: Number(next) as AxisValue,
                    })
                  }
                />
              </div>
            );
          })}

          <p className="ds-caption pt-2 text-gray-600">{QUIZ_INTRO.footnote}</p>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 px-6 pt-4 pb-safe-cta">
        {!isComplete(answers) && (
          <p className="ds-caption text-center text-gray-600">
            {QUIZ_INTRO.submitHint}
          </p>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          className="ds-title-2 flex h-13 w-full items-center justify-center rounded-xl bg-ink text-white transition-all active:scale-[0.98]"
        >
          {QUIZ_INTRO.submitLabel}
        </button>
      </div>
    </div>
  );
}

export { OnboardingPage as default };
