type AxisSliderProps = {
  label: string;
  left: string;
  right: string;
  value: number; // 1-5 척도
};

export function AxisSlider({ label, left, right, value }: AxisSliderProps) {
  // value 1~5 → 0~100% 위치
  const position = ((value - 1) / 4) * 100;

  return (
    <div className="flex flex-col gap-[8px]">
      <span
        className="text-[11px] font-light text-muted"
        style={{ letterSpacing: "0.44px" }}
      >
        {label}
      </span>
      <div className="flex items-center gap-[12px]">
        <span
          className="w-[36px] shrink-0 text-[17px] font-normal text-foreground"
          style={{ letterSpacing: "-0.51px" }}
        >
          {left}
        </span>
        <div className="relative flex-1 h-[10px]">
          <div className="absolute top-1/2 left-0 right-0 h-[1.5px] -translate-y-1/2 bg-border" />
          <div
            className="absolute top-1/2 size-[10px] rounded-full bg-[#368fff]"
            style={{ left: `${position}%`, transform: "translate(-50%, -50%)" }}
          />
        </div>
        <span
          className="w-[36px] shrink-0 text-right text-[15px] font-light text-muted"
          style={{ letterSpacing: "-0.3px" }}
        >
          {right}
        </span>
      </div>
    </div>
  );
}
