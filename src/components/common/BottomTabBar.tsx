"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type TabItem = {
  label: string;
  href: string;
  matchPrefix: string;
};

const TABS: TabItem[] = [
  { label: "주변", href: "/feed", matchPrefix: "/feed" },
  { label: "탐색", href: "/search", matchPrefix: "/search" },
  { label: "저장", href: "/saved", matchPrefix: "/saved" },
  { label: "내 정보", href: "/profile", matchPrefix: "/profile" },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background">
      <div className="mx-auto flex max-w-screen-sm">
        {TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.matchPrefix);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 flex-col items-center py-3"
            >
              {/* 활성 인디케이터 */}
              <span
                className={`mb-1.5 h-1.5 w-1.5 rounded-full ${
                  isActive ? "bg-accent" : "bg-transparent"
                }`}
              />
              <span
                className={`text-[11px] ${
                  isActive
                    ? "font-normal text-foreground"
                    : "font-light text-muted"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
