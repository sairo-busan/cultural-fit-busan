"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Toast, type ToastAction } from "@/components/ui/Toast";

export type ToastOptions = {
  duration?: number;
  /** 갈 곳이 있을 때. 누르면 토스트가 바로 닫힌다 */
  action?: ToastAction;
};

type ToastItem = ToastOptions & {
  id: string;
  message: string;
};

type ToastContextValue = {
  show: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((message: string, options?: ToastOptions) => {
    const id = `toast-${Date.now()}`;
    // 한 번에 하나만 띄운다 — 목록을 훑으며 연달아 저장하면 쌓여서 화면을 덮는다
    setToasts([{ id, message, ...options }]);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* 하단 탭(56px) 위로 띄운다. 기기 제스처 바 높이는 따로 더한다 */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(68px+env(safe-area-inset-bottom,0px))] z-50 flex flex-col items-center gap-2 px-6">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            action={toast.action}
            duration={toast.duration}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast는 ToastProvider 내부에서만 사용 가능합니다");
  }
  return context;
}
