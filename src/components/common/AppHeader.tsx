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
    // 상단 여백은 기기 상태바 높이를 따른다 (Capacitor Android 노치 대응).
    // pt-safe-header 가 env(safe-area-inset-top) 이고, 웹에서는 0이라 기본 여백을 더한다.
    <div className="pt-safe-header flex items-center justify-between px-5 pb-3">
      <div className="flex items-center">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex size-8 items-center justify-center -ml-1.5 transition-all active:scale-[0.95]"
            aria-label="뒤로 가기"
          >
            <ChevronLeft size={22} strokeWidth={1.5} />
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center -ml-1.5 transition-all active:scale-[0.95]"
            aria-label="닫기"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        )}
        {logo && (
          <Link
            href="/"
            className="ds-title-1 font-serif tracking-tight text-ink"
          >
            Cultural Fit Busan
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {right}
        {onMenu && (
          <button
            type="button"
            onClick={onMenu}
            className="flex size-8 items-center justify-center transition-all active:scale-[0.95]"
            aria-label="메뉴"
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}
