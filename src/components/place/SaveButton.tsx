"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * 저장 토글.
 *
 * 색은 **바탕이 정한다**. 사진 밝기마다 색을 달리하면 같은 저장 상태가 행마다
 * 제각각 보이므로, 사진 위는 `PlaceCard` 가 깐 스크림 덕에 밝기와 무관하게
 * 언제나 흰색이다. 사진이 없는 밝은 자리만 먹색으로 간다.
 *
 * 경우는 둘뿐이고 둘 다 확정적이다 — 사진마다 갈리지 않는다.
 *
 * 저장/해제는 채움과 테두리로 가른다. 밝기가 아니라 형태로 가르면 스크림이
 * 옅어지는 자리에서도 상태가 읽힌다.
 *
 * 눈에 보이는 아이콘은 22px 이지만 누르는 영역은 48px 이다. 썸네일 밖으로
 * 넘어가게 두어 목록 글 폭을 뺏지 않는다.
 */

type SaveButtonProps = {
  saved: boolean;
  onToggle: () => void;
  /** 장소명 — 스크린리더가 무엇을 저장하는지 읽어야 한다 */
  placeName: string;
  /** 어두운 스크림 위인가. 아니면 밝은 맨바탕이라 먹색으로 간다 */
  onScrim?: boolean;
  className?: string;
};

export function SaveButton({
  saved,
  onToggle,
  placeName,
  onScrim = true,
  className,
}: SaveButtonProps) {
  const t = useTranslations("place");

  /**
   * 저장하는 순간에만 튄다. 해제까지 축하하면 무엇이 좋은 일인지 흐려진다.
   *
   * 눌렸다 놓이는 것 하나뿐이다. 아이콘을 움직이거나 크게 부풀리면 22px 에서
   * 위치가 흔들려 보이고, 뒤에 무언가를 더하면 목록에서 그 행만 튄다.
   * 저장됐다는 사실 자체는 테두리가 채워지는 것으로 이미 보인다.
   *
   * 클래스를 붙였다 떼는 방식이라, 연달아 누르면 다시 처음부터 돈다.
   */
  const [popping, setPopping] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={t(saved ? "removeFromSaved" : "save", { name: placeName })}
      onClick={(event) => {
        // 사진 카드에서는 이 버튼이 링크 안에 있다 — 저장이 이동을 일으키면 안 된다
        event.preventDefault();
        event.stopPropagation();

        if (!saved) {
          if (timer.current) clearTimeout(timer.current);
          setPopping(false);
          // 한 프레임 뒤에 붙여야 클래스 제거가 반영되어 애니메이션이 다시 돈다
          requestAnimationFrame(() => setPopping(true));
          timer.current = setTimeout(() => setPopping(false), 440);
        }

        onToggle();
      }}
      className={`grid size-12 place-items-center ${className ?? ""}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinejoin="round"
        className={`size-5.5 ${
          onScrim ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" : "text-ink"
        } ${popping ? "animate-save-press" : "transition-transform active:scale-90"}`}
        aria-hidden
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
    </button>
  );
}
