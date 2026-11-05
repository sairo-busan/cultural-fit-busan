import styles from "./FolderArt.module.css";

/** 폴더 그림. 크기는 격자 · 제목(title) · 시트 행(small) 세 가지 */
export function FolderArt({
  empty = false,
  open = false,
  size,
}: {
  empty?: boolean;
  open?: boolean;
  size?: "title" | "small";
}) {
  const className = [
    styles.art,
    empty && styles.empty,
    open && styles.open,
    size && styles[size],
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} aria-hidden>
      <div className={styles.tab} />
      <div className={styles.back} />
      <div className={styles.paper} />
      <div className={styles.front} />
    </div>
  );
}
