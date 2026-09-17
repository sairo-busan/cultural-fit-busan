"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { secureImageUrl } from "@/lib/placeDisplay";

/**
 * 옆으로 넘기는 사진 목록. S20 상세와 S10 카드가 함께 쓴다.
 *
 * 사진이 없으면 기본 그림을 둔다. `children` 은 사진 위에 얹는 버튼 자리이고,
 * 사진과 화살표 사이에 그려 탭 순서가 사진 → 얹은 버튼 → 화살표가 된다.
 */

type PhotoSwipeProps = {
  images: string[];
  name: string;
  sizes: string;
  className: string;
  children?: ReactNode;
};

export function PhotoSwipe({ images, name, sizes, className, children }: PhotoSwipeProps) {
  const t = useTranslations("placeDetail");
  const scroller = useRef<HTMLDivElement>(null);

  const hasMany = images.length > 1;

  return (
    // 포커스 테두리는 사진 위에 겹쳐 그린다. 전역 테두리는 바깥쪽이라 화면 끝에서 잘린다
    <div className={`relative ${className} has-[[role=region]:focus-visible]:after:pointer-events-none has-[[role=region]:focus-visible]:after:absolute has-[[role=region]:focus-visible]:after:inset-0 has-[[role=region]:focus-visible]:after:shadow-[inset_0_0_0_3px_#fff,inset_0_0_0_5px_var(--ink)] has-[[role=region]:focus-visible]:after:content-['']`}>
      {images.length > 0 ? (
        <div
          ref={scroller}
          tabIndex={hasMany ? 0 : undefined}
          role="region"
          aria-label={t("photos", { name })}
          className="flex size-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] focus-visible:outline-none! [&::-webkit-scrollbar]:hidden"
          onKeyDown={(e) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
            e.preventDefault();
            const el = e.currentTarget;
            scrollToPhoto(el, photoIndex(el) + (e.key === "ArrowRight" ? 1 : -1), images.length);
          }}
        >
          {images.map((src, i) => (
            <div key={src} className="relative size-full shrink-0 snap-center">
              <Image
                src={secureImageUrl(src)}
                alt={i === 0 ? name : ""}
                fill
                sizes={sizes}
                className="object-cover"
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
              />
            </div>
          ))}
        </div>
      ) : (
        <Image src="/placeholder/place-4x3.svg" alt="" fill sizes={sizes} className="object-cover" />
      )}

      {children}

      {hasMany && <GalleryControls scroller={scroller} total={images.length} />}
    </div>
  );
}

/** 지금 보이는 사진 번호 */
function photoIndex(el: HTMLElement): number {
  return Math.round(el.scrollLeft / el.clientWidth);
}

/** 스와이프가 없는 입력(키보드 · 마우스)을 위한 한 장씩 넘기기 */
function scrollToPhoto(el: HTMLElement, to: number, total: number) {
  const target = Math.min(total - 1, Math.max(0, to));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollTo({ left: target * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
}

/**
 * 사진 번호와 좌우 화살표. 스크롤 위치를 여기서만 상태로 들고 있어서,
 * 사진을 넘겨도 다시 그려지는 것은 이 두 요소뿐이다 — 사진 목록은 그대로다.
 */
function GalleryControls({ scroller, total }: { scroller: RefObject<HTMLDivElement | null>; total: number }) {
  const t = useTranslations("placeDetail");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => setIndex(photoIndex(el));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scroller]);

  const go = (to: number) => scroller.current && scrollToPhoto(scroller.current, to, total);
  const arrow =
    "absolute top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-ink/65 text-white pointer-fine:grid";

  return (
    <>
      {/* 마우스 · 트랙패드에서만. 터치 기기에서는 스와이프가 있고 목업에도 없다 */}
      {index > 0 && (
        <button type="button" onClick={() => go(index - 1)} aria-label={t("prevPhoto")} className={`${arrow} left-3`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className="size-5" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
      {index < total - 1 && (
        <button type="button" onClick={() => go(index + 1)} aria-label={t("nextPhoto")} className={`${arrow} right-3`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className="size-5" aria-hidden>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}
      <span className="absolute right-3 bottom-3 rounded-full bg-ink/65 px-3 py-1 text-[11px] font-semibold text-white tabular-nums">
        {t("photoCount", { n: index + 1, total })}
      </span>
    </>
  );
}
