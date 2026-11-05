"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

/** 바텀시트. 그리는 동안 열려 있다 — 닫으려면 부모가 그리지 않으면 된다 */
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const t = useTranslations("nav");

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="mx-auto mt-auto mb-0 max-h-[92dvh] w-full max-w-screen-sm overflow-y-auto rounded-t-3xl bg-page px-5 pt-2 pb-safe-cta text-ink backdrop:bg-ink/35"
    >
      <div aria-hidden className="mx-auto mb-2 h-1 w-9 rounded-full bg-line" />
      <div className="flex items-center justify-between gap-2">
        <h2 className="ds-title-1 min-w-0 break-words">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="-mr-2.5 grid size-11 shrink-0 place-items-center"
        >
          <X size={22} strokeWidth={1.5} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

/** 되돌리기 어려운 일을 묻는 시트 */
export function ConfirmSheet({
  title,
  body,
  note,
  actionLabel,
  cancelLabel,
  onAction,
  onClose,
}: {
  title: string;
  body: string;
  note?: string;
  actionLabel: string;
  cancelLabel: string;
  onAction: () => void;
  onClose: () => void;
}) {
  return (
    <Sheet title={title} onClose={onClose}>
      <p className="ds-body-1 mt-4 break-words">{body}</p>
      {note && <p className="ds-body-2 mt-2 text-sub">{note}</p>}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="ds-title-2 min-h-12 flex-1 rounded-xl bg-surface text-ink"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onAction}
          className="ds-title-2 min-h-12 flex-1 rounded-xl bg-danger text-white active:opacity-90"
        >
          {actionLabel}
        </button>
      </div>
    </Sheet>
  );
}
