/**
 * 목록 로딩. 카드 형태를 그대로 따라가 목록이 생길 자리를 미리 알려준다 —
 * 문구 한 줄만 두면 화면이 어떻게 채워질지 알 수 없다.
 *
 * `prefers-reduced-motion` 은 `globals.css` 가 전역으로 처리한다.
 */
export function PlaceRowSkeleton({ withNote = false }: { withNote?: boolean }) {
  return (
    <div
      className="flex items-start gap-4 border-b border-hair px-[--gutter] py-6"
      aria-hidden
    >
      <div className="min-w-0 flex-1">
        {withNote && <div className="h-3 w-14 animate-pulse rounded bg-surface" />}
        <div className="mt-3 h-3.5 w-[90%] animate-pulse rounded bg-surface" />
        <div className="mt-2 h-3.5 w-[55%] animate-pulse rounded bg-surface" />
        <div className="mt-4 h-2.5 w-[40%] animate-pulse rounded bg-surface" />
      </div>
      <div className="size-24 shrink-0 animate-pulse rounded bg-surface" />
    </div>
  );
}
