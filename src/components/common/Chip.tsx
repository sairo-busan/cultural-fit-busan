/**
 * 선택 칩.
 * 디자인 시스템 v1 — 모서리 999px(칩·배지 예외), 선택 표시는 잉크 농도로만.
 */

type ChipProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
};

export function Chip({ label, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`ds-body-2 rounded-full border px-[16px] py-[8px] transition-all active:scale-[0.97] ${
        selected
          ? "border-ink bg-ds-surface text-ink"
          : "border-gray-300 bg-transparent text-gray-600"
      }`}
    >
      {label}
    </button>
  );
}
