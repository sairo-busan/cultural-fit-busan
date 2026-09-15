"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/components/common/Skeleton";
import type { Cf8ProfileCopy } from "@/data/cf8Profiles";

/**
 * "이 목록은 이 기준으로 골랐다" 를 선언하는 카드.
 *
 * 카드 전체가 S02 로 가는 링크다. 코드(`CLD`)는 노출하지 않고 유형명과
 * 3축 요약만 보여준다.
 *
 * 유형은 QUICK·CUSTOM 과 무관하게 항상 있다 — 조건을 건너뛴 사람도 진단은
 * 마쳤고, 목록이 그 유형으로 정렬되기 때문이다.
 *
 * 흰 바탕에 테두리만 두르면 아래 목록 행과 무게가 같아 "머리말" 로 안 읽힌다.
 * 브랜드 틴트를 깔아 이 블록만 층을 달리한다.
 */

type TasteSummaryProps = {
  copy: Cf8ProfileCopy;
};

const CARD = "mx-[--gutter] block rounded-2xl bg-primary-tint p-4";

export function TasteSummary({ copy }: TasteSummaryProps) {
  const t = useTranslations("feed");

  const axes = [copy.atmosphere.title, copy.place.title, copy.rhythm.title];

  return (
    <Link href="/profile" className={`${CARD} transition-opacity active:opacity-70`}>
      <span className="ds-label block text-primary">{t("yourType")}</span>

      <span className="ds-headline mt-1 flex items-center justify-between gap-3">
        <span className="min-w-0">{copy.profileName}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5 shrink-0 text-primary"
          aria-hidden
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </span>

      <span className="mt-3 flex flex-wrap gap-2">
        {axes.map((axis) => (
          <span
            key={axis}
            className="ds-caption rounded-full border border-primary/30 px-3 py-1.5 font-medium text-primary"
          >
            {axis}
          </span>
        ))}
      </span>
    </Link>
  );
}

/** 진단 결과는 localStorage 라 하이드레이션 뒤에야 확정된다 — 그 전까지 자리를 잡는다 */
export function TasteSummarySkeleton() {
  return (
    <div className={CARD}>
      <Skeleton tone="tint" className="h-2.5 w-20" />
      <Skeleton tone="tint" className="mt-2.5 h-6 w-[60%]" />
      <div className="mt-3 flex gap-2">
        <Skeleton tone="tint" className="h-7 w-16 rounded-full" />
        <Skeleton tone="tint" className="h-7 w-24 rounded-full" />
        <Skeleton tone="tint" className="h-7 w-20 rounded-full" />
      </div>
    </div>
  );
}
