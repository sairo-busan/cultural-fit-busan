"use client";

import { useLocalStorage } from "@/hooks/useLocalStorage";

type Locale = "ko" | "en";

export function LocaleToggle() {
  const [locale, setLocale] = useLocalStorage<Locale>("cfb-locale", "ko");

  return (
    <div className="flex overflow-hidden rounded-full border border-border">
      <button
        type="button"
        onClick={() => setLocale("ko")}
        className={`flex items-center gap-[4px] px-[10px] py-[5px] text-[11px] transition-all ${
          locale === "ko"
            ? "bg-foreground font-normal text-white"
            : "bg-white font-light text-muted"
        }`}
      >
        <span className="text-[13px]">🇰🇷</span>
        <span>KO</span>
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`flex items-center gap-[4px] px-[10px] py-[5px] text-[11px] transition-all ${
          locale === "en"
            ? "bg-foreground font-normal text-white"
            : "bg-white font-light text-muted"
        }`}
      >
        <span className="text-[13px]">🇺🇸</span>
        <span>EN</span>
      </button>
    </div>
  );
}
