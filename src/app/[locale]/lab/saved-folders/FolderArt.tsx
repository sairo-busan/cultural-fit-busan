import Image from "next/image";
import { secureImageUrl } from "@/lib/placeDisplay";
import styles from "./FolderArt.module.css";

/** 폴더 그림. 앞면 뒤로 장소 사진이 비친다. 크기는 격자 · 제목(title) · 시트 행(small) 세 가지 */
export function FolderArt({
  empty = false,
  open = false,
  size,
  photos = [],
}: {
  empty?: boolean;
  open?: boolean;
  size?: "title" | "small";
  photos?: string[];
}) {
  const className = [
    styles.art,
    empty && styles.empty,
    open && styles.open,
    size && styles[size],
    photos.length > 0 && styles.hasPhotos,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} aria-hidden>
      <div className={styles.tab} />
      <div className={styles.back} />
      <div className={styles.paper} />
      {photos.map((src, i) => (
        <span key={src} className={`${styles.photo} ${i === 0 ? styles.photo0 : styles.photo1}`}>
          <Image src={secureImageUrl(src)} alt="" fill sizes="72px" />
        </span>
      ))}
      <div className={styles.front} />
    </div>
  );
}
