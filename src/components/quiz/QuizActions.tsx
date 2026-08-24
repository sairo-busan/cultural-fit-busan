type QuizActionsProps = {
  onPrevious: () => void;
  onNext: () => void;
  nextLabel?: string;
};

export function QuizActions({ onPrevious, onNext, nextLabel = "다음" }: QuizActionsProps) {
  return (
    <div className="flex w-full gap-[12px] px-[20px] py-[12px] shadow-[0_-1px_8px_rgba(0,0,0,0.04)]">
      <button
        type="button"
        onClick={onPrevious}
        className="flex h-[54px] flex-1 items-center justify-center rounded-[12px] border border-border bg-white text-[13px] font-light text-sub-text transition-all active:scale-[0.98]"
        style={{ letterSpacing: "1.3px" }}
      >
        이전
      </button>
      <button
        type="button"
        onClick={onNext}
        className="flex h-[54px] flex-1 items-center justify-center rounded-[12px] bg-foreground text-[13px] font-light text-white transition-all active:scale-[0.98]"
        style={{ letterSpacing: "1.3px" }}
      >
        {nextLabel}
      </button>
    </div>
  );
}
