type AxisSliderProps = {
  /** 생략 가능 — S02는 카드 제목이 라벨 역할을 한다 */
  label?: string;
  left: string;
  right: string;
  /** CF8 축 값 — -2 ~ +2 (S01 선택지 단계) */
  value: number;
};

export function AxisSlider({ label, left, right, value }: AxisSliderProps) {
  // -2 → 0%, 0 → 50%, +2 → 100%
  const clamped = Math.max(-2, Math.min(2, value));
  const position = ((clamped + 2) / 4) * 100;

  return (
    <div className="flex flex-col gap-[8px]">
      {label && <span className="ds-caption text-gray-500">{label}</span>}
      <div className="flex items-center gap-[12px]">
        <span className="ds-body-2 w-[52px] shrink-0 text-ink">{left}</span>
        <div className="relative flex-1 h-[10px]">
          <div className="absolute top-1/2 left-0 right-0 h-[3px] -translate-y-1/2 rounded-full bg-gray-300" />
          <div
            className="absolute top-1/2 size-[11px] rounded-full bg-ink transition-all duration-300"
            style={{ left: `${position}%`, transform: "translate(-50%, -50%)" }}
          />
        </div>
        <span className="ds-body-2 w-[52px] shrink-0 text-right text-gray-500">
          {right}
        </span>
      </div>
    </div>
  );
}
