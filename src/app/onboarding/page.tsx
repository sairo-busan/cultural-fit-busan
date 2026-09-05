"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useToast } from "@/contexts/ToastContext";
import { AppHeader } from "@/components/common/AppHeader";
import { QuizProgress } from "@/components/quiz/QuizProgress";
import { QuizOption } from "@/components/quiz/QuizOption";
import {
  QUIZ_QUESTIONS,
  TOTAL_QUESTIONS,
  QUIZ_INTRO,
  DEFAULT_QUIZ_ANSWERS,
} from "@/data/quiz";
import { isComplete } from "@/lib/cfp";
import { STORAGE_KEYS } from "@/lib/storage";
import type { QuizAnswers, AxisValue } from "@/types/cfp";

/** 선택 후 다음 문항으로 넘어가기까지의 지연 (선택 애니메이션 노출용) */
const ADVANCE_DELAY = 700;

export function OnboardingPage() {
  const router = useRouter();
  const { show } = useToast();
  const hasShownToast = useRef(false);

  const [currentStep, setCurrentStep] = useLocalStorage(STORAGE_KEYS.step, 1);
  const [answers, setAnswers] = useLocalStorage<QuizAnswers>(
    STORAGE_KEYS.answers,
    DEFAULT_QUIZ_ANSWERS,
  );
  const [transitioning, setTransitioning] = useState<number | null>(null);

  // 이어하기 안내 (최초 1회)
  useEffect(() => {
    if (hasShownToast.current) return;
    hasShownToast.current = true;

    if (isComplete(answers)) {
      show("이미 모두 작성했어요. 수정하거나 결과를 확인하세요.");
    } else if (currentStep > 1) {
      show("이전에 작성한 응답이 있어요. 이어서 진행합니다.");
    }
  }, [currentStep, answers, show]);

  // 문항 이동 시 전환 상태 초기화
  useEffect(() => {
    setTransitioning(null);
  }, [currentStep]);

  const stepIndex = Math.min(Math.max(currentStep, 1), TOTAL_QUESTIONS) - 1;
  const question = QUIZ_QUESTIONS[stepIndex];
  const selectedValue = answers[question.answerKey];

  const handleSelect = (value: AxisValue) => {
    setAnswers({ ...answers, [question.answerKey]: value });
    setTransitioning(value);

    setTimeout(() => {
      if (currentStep < TOTAL_QUESTIONS) {
        setCurrentStep(currentStep + 1);
      } else {
        router.push("/profile");
      }
    }, ADVANCE_DELAY);
  };

  const handlePrevious = () => {
    if (currentStep <= 1) {
      router.push("/");
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="relative flex flex-1 flex-col">
      <AppHeader
        onBack={handlePrevious}
        right={<Menu size={20} className="text-foreground" />}
      />

      <QuizProgress
        currentStep={stepIndex + 1}
        totalSteps={TOTAL_QUESTIONS}
        labels={QUIZ_QUESTIONS.map((q) => q.stepLabel)}
        onStepClick={(step) => setCurrentStep(step)}
      />

      <div className="flex-1 overflow-y-auto">
        {/* 화면 상단 첫 요소 32px · 좌우 여백 24px (DS v1) */}
        <div className="flex flex-col gap-[8px] px-[24px] pt-[32px]">
          <span className="ds-label text-gray-500">{QUIZ_INTRO.eyebrow}</span>
          <h2 className="ds-display text-ink">{question.question}</h2>
          {stepIndex === 0 && (
            <p className="ds-body-1 text-gray-600">{QUIZ_INTRO.description}</p>
          )}
        </div>

        {/* 블록 간격 32px · 카드 사이 12px */}
        <div className="flex flex-col gap-[12px] px-[24px] pt-[32px] pb-[48px]">
          {question.choices.map((choice, index) => {
            const isSelected = selectedValue === choice.value;
            const isDismissing = transitioning !== null && !isSelected;

            return (
              <div
                key={choice.value}
                className="transition-all duration-400"
                style={
                  isDismissing
                    ? {
                        opacity: 0,
                        transform: "translateX(-30px)",
                        transitionDelay: `${index * 40}ms`,
                      }
                    : undefined
                }
              >
                <QuizOption
                  label={choice.label}
                  selected={isSelected}
                  onClick={() => handleSelect(choice.value)}
                />
              </div>
            );
          })}

          <p className="ds-caption pt-[16px] text-gray-500">
            {QUIZ_INTRO.footnote}
          </p>
        </div>
      </div>
    </div>
  );
}

export { OnboardingPage as default };
