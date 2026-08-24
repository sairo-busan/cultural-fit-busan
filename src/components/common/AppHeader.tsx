"use client";

import Link from "next/link";
import { ChevronLeft, X } from "lucide-react";

type AppHeaderProps = {
  onBack?: () => void;
  onClose?: () => void;
  logo?: boolean;
  right?: React.ReactNode;
};

export function AppHeader({ onBack, onClose, logo, right }: AppHeaderProps) {
  return (
    <div className="flex items-center justify-between px-[20px] py-[16px]">
      <div className="flex items-center">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex size-[32px] items-center justify-center -ml-[6px] transition-all active:scale-[0.95]"
            aria-label="뒤로 가기"
          >
            <ChevronLeft size={22} strokeWidth={1.5} />
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex size-[32px] items-center justify-center -ml-[6px] transition-all active:scale-[0.95]"
            aria-label="닫기"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        )}
        {logo && (
          <Link
            href="/"
            className="font-serif text-[16px] font-normal text-foreground"
            style={{ letterSpacing: "-0.32px" }}
          >
            Cultural Fit Busan
          </Link>
        )}
      </div>
      {right && <div className="flex items-center gap-[16px]">{right}</div>}
    </div>
  );
}
