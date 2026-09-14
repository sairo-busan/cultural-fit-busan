"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * 하단 탭 — 추천 · 저장 · 내 정보.
 *
 * `시작`(S00)을 뺀 이유는 `docs/decisions/하단탭_3개_구성.md` 에 있다 —
 * 진단을 마친 사람에게 S00 의 두 버튼은 갈 곳이 없다.
 *
 * 아이콘은 뜻이 겹치지 않게 나눈다. 나침반은 "당신 기준의 방향", 핀은
 * "이 한 지점"(S20 지도 버튼), 접힌 지도는 S33 루트 지도 모드로 비워둔다.
 */

const TABS = [
  {
    key: "forYou",
    href: "/feed",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z" />
      </>
    ),
  },
  {
    key: "saved",
    href: "/saved",
    icon: <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />,
  },
  {
    key: "me",
    href: "/me",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
      </>
    ),
  },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-hair bg-page pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto flex max-w-screen-sm">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 ${
                active ? "font-bold text-primary" : "font-medium text-sub"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={active ? 2.2 : 1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
                aria-hidden
              >
                {tab.icon}
              </svg>
              <span className="ds-caption">{t(tab.key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
