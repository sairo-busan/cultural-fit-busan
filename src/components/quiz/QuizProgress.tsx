type QuizProgressProps = {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
};

const TOTAL_SEGMENTS = 6;

export function QuizProgress({ currentStep, totalSteps, onStepClick }: QuizProgressProps) {
  const getSegmentStyle = (index: number) => {
    if (index < currentStep - 1) return "bg-[#368fff]"; // 완료
    if (index === currentStep - 1) return "bg-[#368fff] scale-y-150"; // 현재
    return "bg-[#e8e9ea]"; // 미완료
  };

  return (
    <div className="flex items-center gap-[12px] px-[24px] pt-[10px] w-full">
      <p
        className="font-serif text-[13px] font-normal text-muted whitespace-nowrap"
        style={{ letterSpacing: "1.04px" }}
      >
        STEP {String(currentStep).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
      </p>
      <div className="flex flex-1 gap-[4px] items-center">
        {Array.from({ length: TOTAL_SEGMENTS }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onStepClick?.(index + 1)}
            className="flex-1 py-[10px]"
            aria-label={`Step ${index + 1}`}
          >
            <div
              className={`h-[3px] w-full rounded-full transition-all duration-300 ${getSegmentStyle(index)}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
