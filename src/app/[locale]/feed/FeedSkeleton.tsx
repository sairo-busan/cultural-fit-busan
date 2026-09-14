"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/common/Skeleton";
import { ScreenTitle, SectionHeader } from "@/components/common/TabScreen";
import { TasteSummarySkeleton } from "@/components/profile/TasteSummary";
import { PlaceRowSkeleton } from "@/components/place/PlaceRowSkeleton";

/**
 * 추천 피드가 채워질 자리.
 *
 * 본문과 같은 순서·같은 높이로 쌓는다 — 유형 카드 · 날씨 한 줄 · 섹션 머리 ·
 * 목록. 하나라도 빠뜨리면 데이터가 도착할 때 그만큼 화면이 밀린다.
 *
 * 제목과 섹션 머리는 정적 문구라 회색 덩어리가 아니라 실제 글로 그린다.
 * 바로 읽을 수 있는 것을 가릴 이유가 없다.
 */
export function FeedSkeleton() {
  const t = useTranslations("feed");

  return (
    <>
      <ScreenTitle>{t("title")}</ScreenTitle>

      <div className="mt-4">
        <TasteSummarySkeleton />
      </div>

      <div className="mt-4 flex items-center gap-2 px-[--gutter]">
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="h-3.5 w-8" />
        <Skeleton className="h-3 w-28" />
      </div>

      <SectionHeader aside={t("sortByMatch")}>{t("sectionTitle")}</SectionHeader>

      <div className="mt-2">
        {[0, 1, 2].map((i) => (
          <PlaceRowSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
