"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { useRouter } from "@/i18n/navigation";
import { AppHeader } from "@/components/common/AppHeader";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useToast } from "@/contexts/ToastContext";
import { useStoredSnapshot } from "@/hooks/useStoredSnapshot";
import {
  QUIZ_QUESTIONS,
  QUIZ_TEXT,
  CHOICE_VALUES,
  TOTAL_QUESTIONS,
  DEFAULT_QUIZ_ANSWERS,
} from "@/data/quiz";
import {
  markJustDiagnosed,
  markQuizLeft,
  readCf8Code,
  saveQuizAnswers,
  takeQuizLeft,
} from "@/lib/storage";
import type { QuizAnswers } from "@/types/cfp";
import type { Locale } from "@/i18n/routing";

/** 고른 선택지를 보여준 뒤 다음 문항으로 넘어가기까지 */
const ADVANCE_DELAY = 700;

/**
 * S01 취향 진단 — 한 화면에 한 문항.
 *
 * 고르면 나머지 선택지가 왼쪽으로 밀리며 사라지고 다음 문항으로 넘어간다.
 * 답은 화면 상태로만 들고 있다가 세 번째 문항을 고를 때 한 번에 저장한다 —
 * 다시 진단 중에 나가도 이전 결과가 섞이지 않는다.
 */
export function OnboardingPage() {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const t = useTranslations("onboarding");
  const { show } = useToast();
  const hasResult = useStoredSnapshot(readCf8Code, null) !== null;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>(DEFAULT_QUIZ_ANSWERS);
  const [picked, setPicked] = useState<number | null>(null);
  const [quitOpen, setQuitOpen] = useState(false);

  const question = QUIZ_QUESTIONS[step];
  const text = QUIZ_TEXT[locale][question.id];
  const current = answers[question.answerKey];
  const answered = QUIZ_QUESTIONS.filter((q) => answers[q.answerKey] !== null).length;

  // 나갈 때 고르던 답이 있으면 다음 진입에 한 번 알린다
  const leftRef = useRef({ answered: 0, submitted: false });
  useEffect(() => {
    leftRef.current.answered = answered;
  }, [answered]);

  const toastShown = useRef(false);
  useEffect(() => {
    if (toastShown.current) return;
    toastShown.current = true;
    if (takeQuizLeft()) show(t("toast.unsaved"));
    else if (readCf8Code()) show(t("toast.retake"));
  }, [show, t]);

  useEffect(() => {
    const left = leftRef.current;
    return () => {
      if (!left.submitted && left.answered > 0) markQuizLeft();
    };
  }, []);

  const pick = (index: number) => {
    if (picked !== null) return;
    const next = { ...answers, [question.answerKey]: CHOICE_VALUES[index] };
    setAnswers(next);
    setPicked(index);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(
      () => {
        if (step < TOTAL_QUESTIONS - 1) {
          setStep(step + 1);
          setPicked(null);
          return;
        }
        leftRef.current.submitted = true;
        saveQuizAnswers(next);
        markJustDiagnosed();
        router.replace("/profile");
      },
      reduce ? 0 : ADVANCE_DELAY,
    );
  };

  const back = () => {
    if (picked !== null) return;
    if (step > 0) setStep(step - 1);
    else if (window.history.length > 1) router.back();
    else router.push("/");
  };

  const quit = hasResult ? "withResult" : "noResult";

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        onBack={back}
        right={
          <button
            type="button"
            onClick={() => setQuitOpen(true)}
            className="ds-body-2 -mr-2 min-h-12 px-2 font-medium text-sub"
          >
            {t("later")}
          </button>
        }
      />

      <div className="screen flex gap-1" aria-hidden>
        {QUIZ_QUESTIONS.map((q, i) => (
          <span
            key={q.id}
            className={`h-0.75 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-ink" : "bg-hair"}`}
          />
        ))}
      </div>

      <main className="screen flex-1 pt-8">
        <p className="ds-body-2 font-semibold text-sub">
          {t("progress", {
            current: step + 1,
            total: TOTAL_QUESTIONS,
            axis: t(`axis.${question.answerKey}`),
          })}
        </p>
        <h1 id="quiz-question" className="ds-headline mt-2">
          {text.question}
        </h1>

        <RadioGroup.Root
          key={step}
          aria-labelledby="quiz-question"
          // 고르기는 누를 때만 — 값 변경으로 받으면 이미 고른 답을 다시 눌러도 넘어가지 않고,
          // 화살표 키로 둘러보기만 해도 다음 문항으로 넘어간다
          value={current === null ? "" : String(current)}
          className={`mt-8 flex flex-col gap-2 ${picked !== null ? "pointer-events-none" : ""}`}
        >
          {text.choices.map((choice, i) => {
            const selected = picked === null ? current === CHOICE_VALUES[i] : picked === i;
            const leaving = picked !== null && picked !== i;
            return (
              <RadioGroup.Item
                key={choice.label}
                value={String(CHOICE_VALUES[i])}
                onClick={() => pick(i)}
                style={leaving ? { transitionDelay: `${i * 40}ms` } : undefined}
                className={`ds-title-2 flex min-h-15 w-full items-center rounded-2xl px-6 py-3 text-left transition-[opacity,translate,background-color,color] duration-400 ${
                  selected ? "bg-primary text-white" : "bg-surface text-ink"
                } ${leaving ? "-translate-x-7.5 opacity-0" : ""}`}
              >
                {choice.label}
              </RadioGroup.Item>
            );
          })}
        </RadioGroup.Root>
      </main>

      <ConfirmDialog
        open={quitOpen}
        title={t(`quit.${quit}.title`)}
        body={t(`quit.${quit}.body`, { remaining: TOTAL_QUESTIONS - answered })}
        primaryLabel={t(`quit.${quit}.keep`)}
        secondaryLabel={t(`quit.${quit}.leave`)}
        onPrimary={() => setQuitOpen(false)}
        onSecondary={() => {
          setQuitOpen(false);
          router.push("/feed");
        }}
        onClose={() => setQuitOpen(false)}
      />
    </div>
  );
}

export { OnboardingPage as default };
