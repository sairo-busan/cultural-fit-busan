"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode, type RefObject } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { secureImageUrl } from "@/lib/placeDisplay";

/**
 * 옆으로 넘기는 사진 목록. S20 상세와 S10 카드가 함께 쓴다.
 *
 * 사진이 없으면 기본 그림을 둔다. `children` 은 사진 위에 얹는 버튼 자리이고,
 * 사진과 화살표 사이에 그려 탭 순서가 사진 → 얹은 버튼 → 화살표가 된다.
 *
 * 몇 번째 사진인지는 번호가 아니라 하단 중앙의 점으로 보인다. 오른쪽 아래 번호는
 * 관광공사 워터마크를 가렸다.
 */

type PhotoSwipeProps = {
  images: string[];
  name: string;
  sizes: string;
  className: string;
  children?: ReactNode;
  /** 목록 카드처럼 사진이 여러 개 이어지는 곳 — 마우스를 올린 사진에만 화살표를 그린다 */
  hoverArrows?: boolean;
};

export function PhotoSwipe({ images, name, sizes, className, children, hoverArrows = false }: PhotoSwipeProps) {
  const t = useTranslations("placeDetail");
  const scroller = useRef<HTMLDivElement>(null);

  const hasMany = images.length > 1;

  return (
    // 포커스 테두리는 사진 위에 겹쳐 그린다. 전역 테두리는 바깥쪽이라 화면 끝에서 잘린다
    <div className={`group/photo relative ${className} has-[[role=region]:focus-visible]:after:pointer-events-none has-[[role=region]:focus-visible]:after:rounded-[inherit] has-[[role=region]:focus-visible]:after:absolute has-[[role=region]:focus-visible]:after:inset-0 has-[[role=region]:focus-visible]:after:shadow-[inset_0_0_0_3px_#fff,inset_0_0_0_5px_var(--ink)] has-[[role=region]:focus-visible]:after:content-['']`}>
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

      {hasMany && <GalleryControls scroller={scroller} total={images.length} hoverArrows={hoverArrows} />}
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

/** 한 번에 보이는 점 수. 넘기면 점 줄이 흘러 지금 사진의 점이 가운데로 온다 */
const MAX_DOTS = 5;

/**
 * 사진 위치 점과 좌우 화살표. 스크롤 위치를 여기서만 상태로 들고 있어서,
 * 사진을 넘겨도 다시 그려지는 것은 이 두 요소뿐이다 — 사진 목록은 그대로다.
 */
function GalleryControls({
  scroller,
  total,
  hoverArrows,
}: {
  scroller: RefObject<HTMLDivElement | null>;
  total: number;
  hoverArrows: boolean;
}) {
  const t = useTranslations("placeDetail");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => setIndex(photoIndex(el));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scroller]);

  // 카드가 링크라서 화살표 클릭이 상세 이동으로 번지면 안 된다
  const go = (event: MouseEvent, to: number) => {
    event.preventDefault();
    if (scroller.current) scrollToPhoto(scroller.current, to, total);
  };
  const arrow = `absolute top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-ink/65 text-white pointer-fine:grid ${
    hoverArrows
      ? "opacity-0 transition-opacity group-focus-within/photo:opacity-100 group-hover/photo:opacity-100"
      : ""
  }`;

  // 점은 사진 수만큼 한 줄로 그리고, 줄을 옮겨 5개 창에 보이는 범위를 맞춘다.
  // 창 밖으로 나가는 점은 작아지며 사라지고 들어오는 점은 커지며 나타나, 줄이 흐르듯 보인다.
  // 한 칸 = 점 6px + 간격 6px = 0.75rem
  const from = Math.min(Math.max(index - 2, 0), Math.max(total - MAX_DOTS, 0));
  const shown = Math.min(total, MAX_DOTS);
  const dots = Array.from({ length: total }, (_, k) => {
    const pos = k - from;
    const inside = pos >= 0 && pos < shown;
    // 창 끝에 있고 그 너머에 사진이 더 있으면 작게
    const edge = (pos === 0 && from > 0) || (pos === shown - 1 && from + shown < total);
    const scale = !inside ? "scale-0" : edge ? "scale-67" : "scale-100";
    return (
      <span
        key={k}
        className={`size-1.5 shrink-0 rounded-full bg-white transition-[opacity,scale] duration-300 motion-reduce:transition-none ${scale} ${k === index ? "opacity-100" : "opacity-60"}`}
      />
    );
  });

  return (
    <>
      {/* 마우스 · 트랙패드에서만. 터치 기기에서는 스와이프가 있고 목업에도 없다 */}
      {index > 0 && (
        <button type="button" onClick={(e) => go(e, index - 1)} aria-label={t("prevPhoto")} className={`${arrow} left-3`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className="size-5" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
      {index < total - 1 && (
        <button type="button" onClick={(e) => go(e, index + 1)} aria-label={t("nextPhoto")} className={`${arrow} right-3`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className="size-5" aria-hidden>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}
      <span
        className="pointer-events-none absolute bottom-3 left-1/2 h-1.5 -translate-x-1/2 drop-shadow-[0_0_3px_rgba(0,0,0,0.6)]"
        style={{ width: `calc(${shown} * 0.75rem - 0.375rem)` }}
        aria-hidden
      >
        <span
          className="flex gap-1.5 transition-[translate] duration-300 motion-reduce:transition-none"
          style={{ translate: `calc(${from} * -0.75rem)` }}
        >
          {dots}
        </span>
      </span>
      <span className="sr-only">{t("photoCount", { n: index + 1, total })}</span>
    </>
  );
}
