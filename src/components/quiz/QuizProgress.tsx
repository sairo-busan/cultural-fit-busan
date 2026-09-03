/**
 * S01 진행 표시.
 * 디자인 시스템 v1 — 색을 쓰지 않고 잉크 농도로만 상태를 구분한다.
 */

type QuizProgressProps = {
  currentStep: number;
  totalSteps: number;
  /** 단계 라벨 (예: "1단계 · 분위기") */
  labels?: string[];
  onStepClick?: (step: number) => void;
};

export function QuizProgress({
  currentStep,
  totalSteps,
  labels,
  onStepClick,
}: QuizProgressProps) {
  return (
    <div className="flex w-full gap-[8px] px-[24px] pt-[12px]">
      {Array.from({ length: totalSteps }, (_, index) => {
        const isDone = index < currentStep - 1;
        const isCurrent = index === currentStep - 1;

        return (
          <button
            key={index}
            type="button"
            onClick={() => onStepClick?.(index + 1)}
            className="flex flex-1 flex-col gap-[8px] pb-[12px] text-left"
            aria-label={labels?.[index] ?? `${index + 1}단계`}
            aria-current={isCurrent ? "step" : undefined}
          >
            <div
              className={`h-[3px] w-full rounded-full transition-colors duration-300 ${
                isCurrent || isDone ? "bg-ink" : "bg-gray-300"
              }`}
            />
            {labels?.[index] && (
              <span
                className={`ds-caption truncate ${
                  isCurrent ? "text-ink" : "text-gray-500"
                }`}
              >
                {labels[index]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
