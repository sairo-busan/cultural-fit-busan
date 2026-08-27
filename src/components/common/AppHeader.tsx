"use client";

import Link from "next/link";
import { ChevronLeft, Menu, X } from "lucide-react";

type AppHeaderProps = {
  onBack?: () => void;
  onClose?: () => void;
  onMenu?: () => void;
  logo?: boolean;
  right?: React.ReactNode;
};

export function AppHeader({ onBack, onClose, onMenu, logo, right }: AppHeaderProps) {
  return (
    <div className="flex items-center justify-between px-[20px] pt-[56px] pb-[12px]">
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
      <div className="flex items-center gap-[16px]">
        {right}
        {onMenu && (
          <button
            type="button"
            onClick={onMenu}
            className="flex size-[32px] items-center justify-center transition-all active:scale-[0.95]"
            aria-label="메뉴"
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}
