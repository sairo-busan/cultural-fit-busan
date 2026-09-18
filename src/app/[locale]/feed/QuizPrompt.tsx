"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/common/Skeleton";
import { Link } from "@/i18n/navigation";

/**
 * 진단 전 추천 탭에서 유형 카드 자리에 놓는 박스.
 *
 * 유형 카드와 같은 자리 · 모서리 · 바탕이라 진단을 마치면 그 자리가 유형 카드로
 * 바뀐다. 검은 면은 버튼 크기로만 둬서 아래 사진 목록보다 앞서지 않게 한다.
 */

const BOX = "mx-[--gutter] block rounded-2xl bg-primary-tint px-6 py-4";

export function QuizPrompt() {
  const t = useTranslations("feed.needQuiz");

  return (
    <div className={BOX}>
      <p className="ds-title-1">{t("title")}</p>
      <p className="ds-body-2 mt-1 text-sub-on-surface">{t("body")}</p>
      <Link
        href="/onboarding"
        className="ds-title-2 mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-primary text-white transition-colors active:bg-primary-press"
      >
        {t("action")}
      </Link>
    </div>
  );
}

export function QuizPromptSkeleton() {
  return (
    <div className={BOX}>
      <Skeleton tone="tint" className="h-5 w-[55%]" />
      <Skeleton tone="tint" className="mt-2.5 h-3.5 w-[85%]" />
      <Skeleton tone="tint" className="mt-4 h-12 w-full rounded-xl" />
    </div>
  );
}
