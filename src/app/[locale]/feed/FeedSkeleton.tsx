"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/common/Skeleton";
import { ListHeader, ScreenTitle } from "@/components/common/TabScreen";
import { TasteSummarySkeleton } from "@/components/profile/TasteSummary";
import { PlaceCardSkeleton } from "@/components/place/PlaceCardSkeleton";

/**
 * 추천 피드가 채워질 자리.
 *
 * 본문과 같은 순서·같은 높이로 쌓는다 — 유형 카드 · 조건 줄(날씨 · 정렬) ·
 * 목록. 하나라도 빠뜨리면 데이터가 도착할 때 그만큼 화면이 밀린다.
 *
 * 제목과 정렬 기준은 정적 문구라 회색 덩어리가 아니라 실제 글로 그린다.
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

      <ListHeader aside={t("sortByMatch")}>
        <Skeleton className="size-4 rounded-full" />
        <Skeleton className="h-3 w-6" />
        <Skeleton className="h-3 w-28" />
      </ListHeader>

      <div className="mt-2">
        {[0, 1, 2].map((i) => (
          <PlaceCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
