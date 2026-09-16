"use client";

import { useEffect, useRef } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  body: string;
  /** 계속하는 쪽 — 잉크 버튼 */
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  /** Esc · 배경 누름 */
  onClose: () => void;
};

/**
 * 확인 모달. 브라우저 기본 `<dialog>` 를 쓴다 — `showModal()` 이 포커스 가두기 ·
 * Esc 닫기 · 뒤 화면 비활성을 해 준다.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  onClose,
}: ConfirmDialogProps) {
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
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto w-[calc(100%-2.5rem)] max-w-sm rounded-2xl bg-page p-6 text-ink backdrop:bg-ink/40"
    >
      <h2 id="confirm-title" className="ds-title-1">
        {title}
      </h2>
      <p className="ds-body-2 mt-2 text-sub">{body}</p>
      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          autoFocus
          onClick={onPrimary}
          className="ds-title-2 min-h-12 rounded-xl bg-primary text-white transition-colors active:bg-primary-press"
        >
          {primaryLabel}
        </button>
        <button
          type="button"
          onClick={onSecondary}
          className="ds-body-2 min-h-12 rounded-xl font-semibold text-sub active:bg-surface"
        >
          {secondaryLabel}
        </button>
      </div>
    </dialog>
  );
}
