"use client";

import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/common/Skeleton";
import { ScreenTitle } from "@/components/common/TabScreen";
import { PlaceRowSkeleton } from "@/components/place/PlaceRowSkeleton";

/**
 * 저장 목록이 채워질 자리.
 *
 * 정렬·필터 줄까지 자리를 잡아 둔다. 이 둘은 목록이 무엇인지 알아야 그릴 수
 * 있어서(칩은 저장된 지역에서 만든다) 늦게 도착하는데, 비워 두면 목록이 뜨는
 * 순간 두 줄이 끼어들며 전체가 밀린다.
 */
export function SavedSkeleton() {
  const t = useTranslations("saved");

  return (
    <>
      <ScreenTitle aside={<Skeleton className="h-3 w-10 shrink-0" />}>
        {t("title")}
      </ScreenTitle>

      <Skeleton className="mx-[--gutter] mt-4 h-12 rounded-xl" />

      <div className="mt-3 flex gap-2 px-[--gutter]">
        <Skeleton className="h-10 w-16 rounded-full" />
        <Skeleton className="h-10 w-20 rounded-full" />
        <Skeleton className="h-10 w-20 rounded-full" />
      </div>

      <div className="mt-4">
        {[0, 1].map((i) => (
          <PlaceRowSkeleton key={i} withNote />
        ))}
      </div>
    </>
  );
}
