"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Skeleton } from "@/components/common/Skeleton";
import { ScreenTitle } from "@/components/common/TabScreen";
import {
  TasteSummary,
  TasteSummarySkeleton,
} from "@/components/profile/TasteSummary";
import { useHydrated, useStoredSnapshot } from "@/hooks/useStoredSnapshot";
import { CF8_PROFILES } from "@/data/cf8Profiles";
import { isCf8Code } from "@/lib/cfp";
import { STORAGE_KEYS, readCf8Code } from "@/lib/storage";
import { routing, type Locale } from "@/i18n/routing";

const readMode = () => localStorage.getItem(STORAGE_KEYS.tripSetupMode);

/**
 * 내 정보의 본문.
 *
 * 로그인이 없으므로 계정·알림·결제가 없다. 남는 것은 진단 결과 · 여행 조건 ·
 * 언어 셋이고, 각 줄은 "지금 값" 과 "바꾸러 가는 링크" 를 같이 가진다.
 *
 * 값이 아직 없는 줄도 그린다 — 줄이 사라지면 그런 설정이 있다는 걸 알 수 없다.
 *
 * 형제인 `FeedContent`·`SavedContent` 와 달리 스켈레톤 파일이 따로 없다.
 * 여기엔 네트워크가 없고 기다리는 것은 하이드레이션뿐이라, 화면 전체를 덮으면
 * 이미 준비된 언어·소개 절까지 회색으로 가리게 된다. 불확실한 두 값만 덮는다.
 */
export function MeContent() {
  const locale = useLocale() as Locale;
  const t = useTranslations("me");
  const pathname = usePathname();

  const hydrated = useHydrated();
  const cf8Code = useStoredSnapshot(readCf8Code, null);
  const mode = useStoredSnapshot(readMode, null);

  const copy = cf8Code && isCf8Code(cf8Code) ? CF8_PROFILES[locale][cf8Code] : null;

  return (
    <>
      <ScreenTitle>{t("title")}</ScreenTitle>

      {/* 유형은 이 화면에서 가장 큰 정보라 줄이 아니라 카드다 */}
      <div className="mt-4">
        {!hydrated ? (
          <TasteSummarySkeleton />
        ) : copy ? (
          <TasteSummary copy={copy} />
        ) : (
          <NotDiagnosed label={t("notDiagnosed")} action={t("takeQuiz")} />
        )}
      </div>

      <section className="mt-8">
        <SectionTitle>{t("travelStyle")}</SectionTitle>

        <SettingRow
          href="/trip-setup"
          label={t("tripConditions")}
          value={mode === "CUSTOM" ? t("conditionsSet") : null}
          emptyLabel={t("conditionsNone")}
          hydrated={hydrated}
        />

        <SettingRow
          href="/onboarding"
          label={t("retakeQuiz")}
          value={null}
          emptyLabel=""
          hydrated
        />
      </section>

      <section className="mt-8">
        <SectionTitle>{t("language")}</SectionTitle>

        <div className="mt-2 flex gap-2 px-[--gutter]">
          {routing.locales.map((code) => {
            const active = code === locale;

            return (
              <Link
                key={code}
                href={pathname}
                locale={code}
                aria-current={active ? "true" : undefined}
                className={`ds-title-2 inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border transition-colors ${
                  active
                    ? "border-primary bg-primary-tint text-primary"
                    : "border-line text-sub active:bg-surface"
                }`}
              >
                {t(`locale.${code}`)}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle>{t("about")}</SectionTitle>
        <p className="ds-body-2 mt-2 px-[--gutter] text-sub">{t("noAccount")}</p>
      </section>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="ds-label mx-[--gutter] border-b border-ink pb-2 text-primary">
      {children}
    </h2>
  );
}

function NotDiagnosed({ label, action }: { label: string; action: string }) {
  return (
    <Link
      href="/onboarding"
      className="mx-[--gutter] flex items-center justify-between gap-3 rounded-2xl bg-primary-tint p-4 transition-opacity active:opacity-70"
    >
      <span className="ds-title-2 text-primary">{label}</span>
      <span className="ds-caption shrink-0 font-semibold text-primary">{action} →</span>
    </Link>
  );
}

/** 값이 없어도 줄은 남긴다 — 설정의 존재 자체가 정보다 */
function SettingRow({
  href,
  label,
  value,
  emptyLabel,
  hydrated,
}: {
  href: string;
  label: string;
  value: string | null;
  emptyLabel: string;
  /** localStorage 값이 확정되기 전에는 빈 값을 확정된 것처럼 적지 않는다 */
  hydrated: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-16 items-center gap-4 border-b border-hair px-[--gutter] transition-colors active:bg-surface"
    >
      <span className="ds-title-2 shrink-0">{label}</span>
      {hydrated ? (
        <span
          className={`ds-body-2 ml-auto min-w-0 truncate text-right ${
            value ? "text-ink" : "text-sub"
          }`}
        >
          {value ?? emptyLabel}
        </span>
      ) : (
        <Skeleton className="ml-auto h-3 w-16 shrink-0" />
      )}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5 shrink-0 text-sub"
        aria-hidden
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}
