type QuizOptionProps = {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
};

export function QuizOption({ label, description, selected, onClick }: QuizOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col gap-[10px] rounded-[12px] px-[22px] py-[24px] text-left transition-all duration-200 active:scale-[0.98] ${
        selected
          ? "border border-[#35363a]"
          : "border border-border"
      }`}
    >
      <div className="flex w-full items-center gap-[12px]">
        <span className="flex-1 text-[17px] font-normal text-foreground" style={{ letterSpacing: "-0.51px" }}>
          {label}
        </span>
        {selected && (
          <span className="size-[8px] rounded-full bg-[#368fff]" />
        )}
      </div>
      {description && (
        <p className="text-[12.5px] font-light text-muted" style={{ lineHeight: 1.75 }}>
          {description}
        </p>
      )}
    </button>
  );
}
