import { Link } from "@/i18n/navigation";

/** 액션은 다른 화면으로 가거나(`actionHref`) 이 자리에서 다시 시도한다(`onAction`) */
export function EmptyState({
  title,
  body,
  actionHref,
  onAction,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref?: string;
  onAction?: () => void;
  actionLabel: string;
}) {
  const style =
    "ds-title-2 mt-2 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 text-white transition-colors active:bg-primary-press";

  return (
    <div className="flex flex-col items-center gap-4 px-[--gutter] py-12 text-center">
      <p className="ds-title-1">{title}</p>
      <p className="ds-body-2 max-w-[30ch] text-sub">{body}</p>
      {actionHref ? (
        <Link href={actionHref} className={style}>
          {actionLabel}
        </Link>
      ) : (
        <button type="button" onClick={onAction} className={style}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
