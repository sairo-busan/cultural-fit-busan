import { Skeleton } from "@/components/common/Skeleton";

/** 사진 카드가 채워질 자리. 사진 비율까지 같아야 데이터가 와도 화면이 밀리지 않는다 */
export function PlaceCardSkeleton() {
  return (
    <div className="px-[--gutter] py-4" aria-hidden>
      <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
      <Skeleton className="mt-3 h-3 w-[45%]" />
      <Skeleton className="mt-2 h-4 w-[60%]" />
      <Skeleton className="mt-2 h-3.5 w-[85%]" />
    </div>
  );
}
