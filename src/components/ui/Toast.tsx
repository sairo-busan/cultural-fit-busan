"use client";

import { useEffect, useState } from "react";

type ToastProps = {
  id: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
};

export function Toast({ id, message, duration = 3000, onClose }: ToastProps) {
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
      className={`pointer-events-auto rounded-[12px] bg-foreground/90 backdrop-blur-sm px-[20px] py-[14px] transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-[20px] opacity-0"
      }`}
    >
      <p
        className="text-[12.5px] font-light text-white"
        style={{ lineHeight: 1.6 }}
      >
        {message}
      </p>
    </div>
  );
}
