"use client";

import { useEffect, useRef } from "react";

export type MenuItem = {
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
  /** 되돌릴 수 없는 일 — 위험색 */
  danger?: boolean;
};

/**
 * ⋯ 메뉴 바텀시트. `ConfirmDialog` 처럼 브라우저 `<dialog>` 를 써서
 * 포커스 가두기 · Esc 닫기 · 뒤 화면 비활성을 맡긴다.
 */
export function MenuSheet({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: MenuItem[];
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label="메뉴"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="mx-auto mt-auto mb-0 w-full max-w-screen-sm rounded-t-[20px] bg-page px-5 pt-2.5 pb-safe-cta text-ink backdrop:bg-ink/40"
    >
      <div aria-hidden className="mx-auto mb-2 h-1 w-9 rounded-full bg-line" />
      <ul>
        {items.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              onClick={() => {
                onClose();
                item.onSelect();
              }}
              className={`ds-body-1 flex min-h-13 w-full items-center gap-3 text-left ${
                item.danger ? "text-danger" : "text-ink"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </dialog>
  );
}
