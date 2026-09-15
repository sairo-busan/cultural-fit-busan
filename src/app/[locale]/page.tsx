"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useHydrated, useStoredSnapshot } from "@/hooks/useStoredSnapshot";
import { readCf8Code } from "@/lib/storage";

const STEPS = ["quiz", "character", "places"] as const;
/** 기본 언어가 한국어라 앞에 둔다 */
const LOCALE_ORDER = ["ko", "en"] as const;

/**
 * S00 시작 — 앱을 처음 연 사람만 본다.
 *
 * 진단 기록이 있으면 추천 탭으로 넘긴다. 정적 export 라 서버에서 가를 수 없어,
 * 기록을 읽기 전에는 아무것도 그리지 않고 읽은 뒤 페이드인한다 — 넘어가는 사람에게 랜딩이 스치지 않는다.
 */
export function LandingPage() {
  const t = useTranslations("landing");
  const tLocale = useTranslations("me.locale");
  const locale = useLocale();
  const router = useRouter();
  const hydrated = useHydrated();
  const cf8Code = useStoredSnapshot(readCf8Code, null);

  useEffect(() => {
    if (cf8Code) router.replace("/feed");
  }, [cf8Code, router]);

  if (!hydrated || cf8Code) return <div className="flex-1" />;

  return (
    <div className="animate-fade-in flex flex-1 flex-col">
      <header className="screen pt-safe-header flex items-center justify-between pb-3">
        <span className="ds-title-2 tracking-wider">SAIRO</span>
        <nav aria-label={t("language")} className="flex rounded-full bg-surface p-1">
          {LOCALE_ORDER.map((code) => {
            const active = code === locale;
            return (
              <Link
                key={code}
                href="/"
                locale={code}
                lang={code}
                aria-current={active ? "true" : undefined}
                className={`ds-caption inline-flex min-h-11 items-center rounded-full px-4 font-semibold transition-colors ${
                  active ? "bg-primary text-white" : "text-sub"
                }`}
              >
                {tLocale(code)}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="screen flex-1">
        <p className="ds-body-2 mt-8 font-semibold text-sub">{t("eyebrow")}</p>
        <h1 className="ds-display mt-2 whitespace-pre-line">{t("title")}</h1>
        <p className="ds-body-1 mt-3 text-sub">{t("lead")}</p>

        <ol className="mt-12">
          {STEPS.map((step, i) => (
            <li key={step} className="relative flex gap-3 pb-6 last:pb-0">
              {i < STEPS.length - 1 && (
                <span aria-hidden className="absolute top-8 bottom-1 left-3.5 w-0.5 -translate-x-1/2 bg-hair" />
              )}
              <span
                aria-hidden
                className="ds-caption grid size-7 shrink-0 place-items-center rounded-full bg-surface font-bold text-sub"
              >
                {i + 1}
              </span>
              <div className="pt-0.5">
                <p className="ds-title-2">{t(`steps.${step}.title`)}</p>
                <p className="ds-body-2 mt-0.5 text-sub">{t(`steps.${step}.body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </main>

      <footer className="screen pb-safe-cta flex flex-col items-center gap-1 pt-4">
        <Link
          href="/onboarding"
          className="ds-title-2 flex min-h-12 w-full items-center justify-center rounded-xl bg-primary text-white transition-colors active:bg-primary-press"
        >
          {t("start")}
        </Link>
        <Link
          href="/feed"
          className="ds-body-2 inline-flex min-h-12 items-center px-4 font-semibold underline underline-offset-4"
        >
          {t("browse")}
        </Link>
      </footer>
    </div>
  );
}

export { LandingPage as default };
