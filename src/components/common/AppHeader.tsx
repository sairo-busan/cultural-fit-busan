"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ChevronLeft, Menu, X } from "lucide-react";

/**
 * 아이콘만 있는 버튼 — 보이는 아이콘은 32px 이고 누르는 영역만 44px 로 넓힌다
 * (WCAG 2.5.8). 실제 크기를 키우면 헤더가 56 을 넘는다.
 */
const ICON_BUTTON =
  "relative flex size-8 items-center justify-center transition-all active:scale-[0.95] before:absolute before:-inset-1.5 before:content-['']";

type AppHeaderProps = {
  onBack?: () => void;
  onClose?: () => void;
  onMenu?: () => void;
  logo?: boolean;
  right?: React.ReactNode;
};

export function AppHeader({ onBack, onClose, onMenu, logo, right }: AppHeaderProps) {
  const t = useTranslations("nav");

  return (
    // 상단 여백은 기기 상태바 높이를 따른다 (Capacitor Android 노치 대응).
    // pt-safe-header 가 env(safe-area-inset-top) 이고, 웹에서는 0이라 기본 여백을 더한다.
    <div className="pt-safe-header flex items-center justify-between px-5 pb-3">
      <div className="flex min-h-8 items-center">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className={`${ICON_BUTTON} -ml-1.5`}
            aria-label={t("back")}
          >
            <ChevronLeft size={22} strokeWidth={1.5} />
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={`${ICON_BUTTON} -ml-1.5`}
            aria-label={t("close")}
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        )}
        {logo && (
          <Link
            href="/feed"
            className="ds-title-2 font-bold tracking-wider text-ink"
          >
            SAIRO
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {right}
        {onMenu && (
          <button
            type="button"
            onClick={onMenu}
            className={ICON_BUTTON}
            aria-label={t("menu")}
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}
