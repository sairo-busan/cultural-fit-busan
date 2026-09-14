/**
 * 로딩 자리를 잡는 회색 덩어리.
 *
 * 크기는 쓰는 쪽이 정한다 — 채워질 글의 실제 폭·높이에 맞춰야 자리가 안 밀린다.
 * 배경색은 `tone` 으로만 고른다. `className` 으로 덮으려 하면 어느 쪽이 이길지
 * 클래스 차례가 아니라 Tailwind 출력 순서가 정해서 예측할 수 없다.
 *
 * `prefers-reduced-motion` 은 `globals.css` 가 전역으로 처리한다.
 */

const TONE = {
  /** 흰 바탕 위 */
  plain: "bg-surface",
  /** 틴트 카드 안 — 회색을 쓰면 카드 밖에서 온 것처럼 뜬다 */
  tint: "bg-primary/10",
} as const;

export function Skeleton({
  className,
  tone = "plain",
}: {
  className: string;
  tone?: keyof typeof TONE;
}) {
  return (
    <div className={`animate-pulse rounded ${TONE[tone]} ${className}`} aria-hidden />
  );
}
