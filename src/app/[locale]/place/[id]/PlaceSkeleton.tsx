import { Skeleton } from "@/components/common/Skeleton";

/**
 * 장소 상세가 채워질 자리 — 사진 · 머리 · 그리드 · 첫 섹션.
 *
 * 사진은 화면 끝까지 채우므로 여백 밖에 둔다. 사진 비율(4:3)을 먼저 잡아야
 * 도착했을 때 아래 글이 밀리지 않는다.
 */
export function PlaceSkeleton() {
  return (
    <div aria-hidden>
      <div className="aspect-[4/3] w-full animate-pulse bg-surface" />

      <div className="screen">
        <Skeleton className="mt-6 h-3 w-12" />
        <Skeleton className="mt-3 h-7 w-2/3" />
        <Skeleton className="mt-3 h-4 w-4/5" />
        <Skeleton className="mt-3 h-3.5 w-1/2" />

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-hair pt-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i}>
              <Skeleton className="h-2.5 w-14" />
              <Skeleton className="mt-2 h-3.5 w-24" />
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-hair pt-6">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-4 h-3.5 w-full" />
          <Skeleton className="mt-2 h-3.5 w-full" />
          <Skeleton className="mt-2 h-3.5 w-3/5" />
        </div>
      </div>
    </div>
  );
}
