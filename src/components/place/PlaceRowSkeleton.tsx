import { Skeleton } from "@/components/common/Skeleton";

/** 저장 목록이 채워질 자리. 행 높이가 본문과 같아야 목록이 뜰 때 밀리지 않는다 */
export function PlaceRowSkeleton() {
  return (
    <div className="flex items-start gap-4 px-[--gutter] py-4" aria-hidden>
      <Skeleton className="size-22 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-3 w-[55%]" />
        <Skeleton className="mt-2 h-4 w-[70%]" />
        <Skeleton className="mt-2 h-3.5 w-[90%]" />
      </div>
    </div>
  );
}
