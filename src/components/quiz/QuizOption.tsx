/**
 * S01 선택지 카드.
 * 디자인 시스템 v1 — Title 2(15px Medium) · 리스트 카드 안쪽 20px ·
 * 행 최소 높이 64px · 모서리 12px · 선택 표시는 잉크 농도로만.
 */

type QuizOptionProps = {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  children?: React.ReactNode;
};

export function QuizOption({
  label,
  description,
  selected,
  onClick,
  children,
}: QuizOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-[64px] w-full flex-col gap-[8px] rounded-[12px] px-[20px] py-[16px] text-left transition-all duration-200 active:scale-[0.98] ${
        selected
          ? "border border-ink bg-ds-surface"
          : "border border-gray-200 bg-transparent"
      }`}
    >
      <div className="flex w-full items-center gap-[12px]">
        <span className="ds-title-2 flex-1 text-ink">{label}</span>
        <span
          className={`flex size-[20px] shrink-0 items-center justify-center rounded-full border transition-colors ${
            selected ? "border-ink" : "border-gray-300"
          }`}
        >
          {selected && <span className="size-[9px] rounded-full bg-ink" />}
        </span>
      </div>
      {description && <p className="ds-caption text-gray-600">{description}</p>}
      {children}
    </button>
  );
}
