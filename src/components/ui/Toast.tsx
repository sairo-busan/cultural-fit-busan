"use client";

import { useEffect, useState } from "react";

/**
 * 잠깐 떴다 사라지는 알림.
 *
 * 질문을 담지 않는다 — 몇 초 뒤 없어지므로 답할 틈이 없다. 할 일이 있으면
 * 서술 + 버튼 하나로 준다("저장한 곳에 담았어요 · 보기").
 *
 * 액션이 링크가 아니라 버튼인 이유 — 이동과 되돌리기를 한 모양으로 두기
 * 위해서다. 둘을 나누면 타입도 렌더도 두 갈래가 된다.
 */

export type ToastAction = {
  label: string;
  onAct: () => void;
};

type ToastProps = {
  id: string;
  message: string;
  action?: ToastAction;
  duration?: number;
  onClose: (id: string) => void;
};

export function Toast({
  id,
  message,
  action,
  duration = 3000,
  onClose,
}: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div
      role="status"
      className={`pointer-events-auto flex max-w-sm items-center gap-4 rounded-xl bg-ink/92 px-5 py-3 backdrop-blur-sm transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      }`}
    >
      <p className="ds-body-2 min-w-0 flex-1 text-white">{message}</p>

      {action && (
        <button
          type="button"
          onClick={() => {
            action.onAct();
            onClose(id);
          }}
          className="ds-caption -my-2 -mr-2 shrink-0 px-2 py-2 font-bold text-white underline underline-offset-4"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
