"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useToast } from "@/contexts/ToastContext";
import { AppHeader } from "@/components/common/AppHeader";
import { Menu } from "lucide-react";
import { QuizProgress } from "@/components/quiz/QuizProgress";
import { QuizOption } from "@/components/quiz/QuizOption";
import {
  QUIZ_STEPS,
  TOTAL_STEPS,
  HARD_FILTER_CANNOT_EAT,
  HARD_FILTER_VEGAN,
  HARD_FILTER_DINING,
  DEFAULT_QUIZ_ANSWERS,
  DEFAULT_HARD_FILTER,
} from "@/data/quiz";
import type {
  QuizAnswers,
  HardFilter,
  CannotEat,
  VeganStatus,
  DiningPreference,
} from "@/types/cfp";

const ANSWER_KEYS = [
  "companion",
  "walkingDistance",
  "atmosphere",
  "placeType",
  "pace",
  "palate",
] as const;

const SHEET_TOP = 100;
const DISMISS_THRESHOLD = 120;

// 바텀시트 캐러셀 페이지 정의
const SHEET_PAGES = [
  {
    title: "못 드시는 게 있으면\n알려주세요",
    description: "해당하는 곳은 추천에서 아예 빼드립니다. 없으면 건너뛰셔도 됩니다.",
    groupTitle: "못 먹는 것",
    badge: "복수 선택",
    groupDescription: "해당하는 메뉴가 주력인 곳은 목록에서 빠집니다",
  },
  {
    title: "못 드시는 게 있으면\n알려주세요",
    description: "해당하는 곳은 추천에서 아예 빼드립니다.",
    groupTitle: "비건 여부",
    badge: "하나만",
    groupDescription: "채식 옵션이 없는 곳은 빠집니다",
  },
  {
    title: "어디서 드실래요",
    description: "좌판·포장마차를 포함할지 정합니다.",
    groupTitle: "식사 장소",
    badge: "하나만",
    groupDescription: "좌판·포장마차를 포함할지 정합니다",
  },
] as const;

export function OnboardingPage() {
  const router = useRouter();
  const { show } = useToast();
  const hasShownToast = useRef(false);
  const [currentStep, setCurrentStep] = useLocalStorage("cfb-quiz-step", 1);
  const [answers, setAnswers] = useLocalStorage<QuizAnswers>(
    "cfb-quiz-answers",
    DEFAULT_QUIZ_ANSWERS,
  );
  const [hardFilter, setHardFilter] = useLocalStorage<HardFilter>(
    "cfb-hard-filter",
    DEFAULT_HARD_FILTER,
  );

  const isHardFilterStep = currentStep > TOTAL_STEPS;

  useEffect(() => {
    if (hasShownToast.current) return;
    hasShownToast.current = true;

    const allAnswered = Object.values(answers).every((v) => v !== null);

    if (currentStep > TOTAL_STEPS && allAnswered) {
      show("이미 모두 작성했어요. 수정하거나 결과를 확인하세요.");
    } else if (currentStep > 1) {
      show("이전에 작성한 응답이 있어요. 이어서 진행합��다.");
    }
  }, [currentStep, answers, show]);

  const quizStep = !isHardFilterStep ? QUIZ_STEPS[currentStep - 1] : null;
  const currentAnswerKey = !isHardFilterStep
    ? ANSWER_KEYS[currentStep - 1]
    : null;
  const selectedValue = currentAnswerKey ? answers[currentAnswerKey] : null;
  const [transitioning, setTransitioning] = useState<string | null>(null);

  // 바텀시트 상태
  const [sheetClosing, setSheetClosing] = useState(false);
  const [sheetPage, setSheetPage] = useState(0); // 0, 1, 2
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);

  // step 변경 시 상태 초기화
  useEffect(() => {
    setTransitioning(null);
    setSheetClosing(false);
    setSheetPage(0);
    setSlideDirection(null);
    setDragOffset(0);
  }, [currentStep]);

  // 현재 시트 페이지에서 선택이 있는지 체크
  const currentPageHasSelection = (() => {
    switch (sheetPage) {
      case 0:
        return hardFilter.cannotEat.length > 0;
      case 1:
        return hardFilter.veganStatus !== null;
      case 2:
        return hardFilter.diningPreference !== null;
      default:
        return false;
    }
  })();

  const handleSelectAnswer = (value: string) => {
    if (currentAnswerKey) {
      setAnswers({ ...answers, [currentAnswerKey]: value });
      setTransitioning(value);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 900);
    }
  };

  const handlePrevious = () => {
    if (currentStep === 1) {
      router.push("/");
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    router.push("/profile");
  };

  // 시트 캐러셀 다음 페이지
  const handleSheetNext = () => {
    if (sheetPage < 2) {
      setSlideDirection("left");
      setTimeout(() => {
        setSheetPage(sheetPage + 1);
        setSlideDirection(null);
      }, 250);
    } else {
      handleComplete();
    }
  };

  // 바텀시트 닫기 → step 6으로 돌아감
  const handleCloseSheet = useCallback(() => {
    setSheetClosing(true);
    setTimeout(() => {
      setCurrentStep(TOTAL_STEPS);
    }, 300);
  }, [setCurrentStep]);

  // Handle line 드래그
  const handleTouchStart = (event: React.TouchEvent) => {
    dragStartY.current = event.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (!isDragging.current) return;
    const deltaY = event.touches[0].clientY - dragStartY.current;
    setDragOffset(Math.max(0, deltaY));
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (dragOffset > DISMISS_THRESHOLD) {
      handleCloseSheet();
    } else {
      setDragOffset(0);
    }
  };

  const toggleCannotEat = (value: CannotEat) => {
    const current = hardFilter.cannotEat;
    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    setHardFilter({ ...hardFilter, cannotEat: updated });
  };

  // 바텀시트 뒤에 보여줄 step 6 콘텐츠
  const lastQuizStep = QUIZ_STEPS[TOTAL_STEPS - 1];
  const currentSheetPage = SHEET_PAGES[sheetPage];

  return (
    <div className="relative flex flex-1 flex-col">
      <AppHeader
        onBack={handlePrevious}
        right={<Menu size={20} className="text-foreground" />}
      />

      {/* Progress */}
      <QuizProgress
        currentStep={isHardFilterStep ? TOTAL_STEPS : currentStep}
        totalSteps={TOTAL_STEPS}
        onStepClick={(step) => setCurrentStep(step)}
      />

      {/* 스크롤 가능 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto">
        {/* 퀴즈 Step 1-6 */}
        {quizStep && (
          <>
            <div className="flex flex-col gap-[14px] px-[24px] pt-[46px]">
              <span
                className="w-fit rounded-full bg-[#f0f1f3] px-[12px] py-[5px] text-[9.5px] font-normal uppercase text-muted"
                style={{ letterSpacing: "2.47px" }}
              >
                {quizStep.categoryLabel}
              </span>
              <h2
                className="whitespace-pre-line text-[31px] font-thin text-foreground"
                style={{ lineHeight: 1.45, letterSpacing: "-1.395px" }}
              >
                {quizStep.title}
              </h2>
              <p
                className="text-[13px] font-light text-muted"
                style={{ lineHeight: 1.9 }}
              >
                {quizStep.description}
              </p>
            </div>

            <div className="flex flex-col gap-[12px] px-[24px] pt-[36px]">
              {quizStep.options.map((option, index) => {
                const isSelected = selectedValue === option.value;
                const isDismissing = transitioning !== null && !isSelected;
                return (
                  <div
                    key={option.value}
                    className="transition-all duration-400"
                    style={{
                      ...(isDismissing
                        ? {
                            opacity: 0,
                            transform: "translateX(-30px)",
                            transitionDelay: `${index * 40}ms`,
                          }
                        : {}),
                    }}
                  >
                    <QuizOption
                      label={option.label}
                      description={option.description}
                      selected={isSelected}
                      onClick={() => handleSelectAnswer(option.value)}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* 바텀시트 뒤에 보이는 step 6 콘텐츠 (비활성) */}
        {isHardFilterStep && (
          <div className="pointer-events-none opacity-40">
            <div className="flex flex-col gap-[14px] px-[24px] pt-[46px]">
              <span
                className="w-fit rounded-full bg-[#f0f1f3] px-[12px] py-[5px] text-[9.5px] font-normal uppercase text-muted"
                style={{ letterSpacing: "2.47px" }}
              >
                {lastQuizStep.categoryLabel}
              </span>
              <h2
                className="whitespace-pre-line text-[31px] font-thin text-foreground"
                style={{ lineHeight: 1.45, letterSpacing: "-1.395px" }}
              >
                {lastQuizStep.title}
              </h2>
            </div>
          </div>
        )}
      </div>

      {/* ── 바텀시트 오버레이 (step 7 캐러셀) ── */}
      {isHardFilterStep && (
        <>
          {/* 배경 dim — 클릭 시 step 6으로 돌아감 */}
          <div
            className={`absolute inset-0 z-40 bg-black/20 transition-opacity duration-300 ${
              sheetClosing ? "opacity-0" : "animate-fade-in"
            }`}
            onClick={handleCloseSheet}
          />

          {/* 시트 본체 */}
          <div
            className={`absolute inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[20px] bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.1)] ${
              sheetClosing ? "" : "animate-sheet-up"
            }`}
            style={{
              top: `${SHEET_TOP}px`,
              transform: sheetClosing
                ? "translateY(100%)"
                : `translateY(${dragOffset}px)`,
              transition: sheetClosing
                ? "transform 0.3s cubic-bezier(0.4, 0, 1, 1)"
                : isDragging.current
                  ? "none"
                  : "transform 0.3s cubic-bezier(0.2, 0, 0, 1)",
            }}
          >
            {/* Handle line — 드래그 영역 */}
            <div
              className="flex cursor-grab justify-center pt-[12px] pb-[4px] active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="h-[4px] w-[36px] rounded-full bg-[#dcdee0]" />
            </div>

            {/* 캐러셀 콘텐츠 */}
            <div className="flex-1 overflow-hidden">
              <div
                className={`h-full overflow-y-auto transition-all duration-250 ${
                  slideDirection === "left"
                    ? "translate-x-[-100%] opacity-0"
                    : ""
                }`}
                key={sheetPage}
              >
                {/* 제목 영역 */}
                <div className="flex flex-col gap-[13px] px-[24px] pt-[14px]">
                  <span
                    className="w-fit rounded-full bg-[#f0f1f3] px-[12px] py-[5px] text-[9.5px] font-normal uppercase text-muted"
                    style={{ letterSpacing: "2.47px" }}
                  >
                    음식 · 추가 정보
                  </span>
                  <h2
                    className="whitespace-pre-line text-[29px] font-thin text-foreground"
                    style={{ lineHeight: 1.45, letterSpacing: "-1.305px" }}
                  >
                    {currentSheetPage.title}
                  </h2>
                  <p
                    className="text-[12.5px] font-light text-muted"
                    style={{ lineHeight: 1.85 }}
                  >
                    {currentSheetPage.description}
                  </p>
                </div>

                {/* 옵션 그룹 */}
                <div className="flex flex-col gap-[9px] px-[24px] pt-[24px]">
                  <div className="flex flex-col gap-[5px] pb-[6px]">
                    <div className="flex items-center gap-[8px]">
                      <span
                        className="text-[15px] font-normal text-foreground"
                        style={{ letterSpacing: "-0.3px" }}
                      >
                        {currentSheetPage.groupTitle}
                      </span>
                      <span className="rounded-full bg-[#f0f1f3] px-[8px] py-[3px] text-[10px] font-light text-muted">
                        {currentSheetPage.badge}
                      </span>
                    </div>
                    <p
                      className="text-[11.5px] font-light text-muted"
                      style={{ lineHeight: 1.75 }}
                    >
                      {currentSheetPage.groupDescription}
                    </p>
                  </div>

                  {/* Page 0: 못 먹는 것 */}
                  {sheetPage === 0 &&
                    HARD_FILTER_CANNOT_EAT.map((option) => (
                      <QuizOption
                        key={option.value}
                        label={option.label}
                        description={option.description}
                        selected={hardFilter.cannotEat.includes(
                          option.value as CannotEat,
                        )}
                        onClick={() =>
                          toggleCannotEat(option.value as CannotEat)
                        }
                      />
                    ))}

                  {/* Page 1: 비건 여부 */}
                  {sheetPage === 1 &&
                    HARD_FILTER_VEGAN.map((option) => (
                      <QuizOption
                        key={option.value}
                        label={option.label}
                        description={option.description}
                        selected={hardFilter.veganStatus === option.value}
                        onClick={() =>
                          setHardFilter({
                            ...hardFilter,
                            veganStatus: option.value as VeganStatus,
                          })
                        }
                      />
                    ))}

                  {/* Page 2: 식사 장소 */}
                  {sheetPage === 2 &&
                    HARD_FILTER_DINING.map((option) => (
                      <QuizOption
                        key={option.value}
                        label={option.label}
                        description={option.description}
                        selected={hardFilter.diningPreference === option.value}
                        onClick={() =>
                          setHardFilter({
                            ...hardFilter,
                            diningPreference: option.value as DiningPreference,
                          })
                        }
                      />
                    ))}
                </div>

                {/* Notice — 마지막 페이지에만 */}
                {sheetPage === 2 && (
                  <div className="flex items-start gap-[9px] px-[24px] pt-[26px] pb-[20px]">
                    <span className="mt-[6px] size-[6px] shrink-0 rounded-full bg-[#368fff]" />
                    <p
                      className="flex-1 text-[11.5px] font-light text-[#163c8c]"
                      style={{ lineHeight: 1.75 }}
                    >
                      부산은 회와 해산물 음식이 많아 선택에 따라 결과가 크게
                      달라집니다
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 하단 버튼 + 건너뛰기 */}
            <div className="flex flex-col items-center gap-[12px] px-[20px] pt-[12px] pb-[16px] shadow-[0_-1px_8px_rgba(0,0,0,0.04)]">
              <button
                type="button"
                onClick={handleSheetNext}
                disabled={!currentPageHasSelection}
                className={`flex h-[54px] w-full items-center justify-center rounded-[12px] text-[13px] font-light transition-all active:scale-[0.98] ${
                  currentPageHasSelection
                    ? "bg-foreground text-white"
                    : "bg-[#f0f1f3] text-muted"
                }`}
                style={{ letterSpacing: "1.3px" }}
              >
                {sheetPage === 2 ? "완료" : "다음"}
              </button>
              <button
                type="button"
                onClick={handleComplete}
                className="text-[12px] font-light text-muted transition-colors active:text-foreground"
              >
                건너뛰기
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export { OnboardingPage as default };
