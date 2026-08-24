"use client";

import { useState, useRef, useEffect } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type Locale = "ko" | "en";

const LOCALE_OPTIONS = [
  { value: "ko" as Locale, flag: "🇰🇷", label: "KO 한국어" },
  { value: "en" as Locale, flag: "🇺🇸", label: "EN English" },
];

export function LocaleDropdown() {
  const [locale, setLocale] = useLocalStorage<Locale>("cfb-locale", "ko");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-[6px] rounded-full border border-border px-[12px] py-[6px] text-[12px] font-light text-sub-text transition-all active:scale-[0.97]"
      >
        <span className="text-[14px]">
          {locale === "ko" ? "🇰🇷" : "🇺🇸"}
        </span>
        <span>{locale === "ko" ? "KO" : "EN"}</span>
        <span
          className="text-[10px] text-muted transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[140px] rounded-[12px] border border-border bg-white py-[4px] shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
          {LOCALE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setLocale(option.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-[8px] px-[14px] py-[10px] text-[12px] transition-colors ${
                locale === option.value
                  ? "font-normal text-foreground"
                  : "font-light text-sub-text"
              }`}
            >
              <span className="text-[14px]">{option.flag}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
