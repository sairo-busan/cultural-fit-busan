"use client";

import { useTranslations } from "next-intl";

/**
 * 저장 토글.
 *
 * 사진 위에 얹히므로 어떤 사진에서도 보여야 한다 — 흰 아이콘에 그림자를 준다.
 * 사진이 없는 자리(`onPlain`)에서는 흰색이 안 보이니 회색으로 떨어뜨린다.
 *
 * 눈에 보이는 아이콘은 22px 이지만 누르는 영역은 48px 이다. 썸네일 밖으로
 * 넘어가게 두어 목록 글 폭을 뺏지 않는다.
 */

type SaveButtonProps = {
  saved: boolean;
  onToggle: () => void;
  /** 장소명 — 스크린리더가 무엇을 저장하는지 읽어야 한다 */
  placeName: string;
  /** 사진이 없는 배경 위에 놓일 때 */
  onPlain?: boolean;
  className?: string;
};

export function SaveButton({
  saved,
  onToggle,
  placeName,
  onPlain = false,
  className,
}: SaveButtonProps) {
  const t = useTranslations("place");

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={t(saved ? "removeFromSaved" : "save", { name: placeName })}
      onClick={(event) => {
        // 행 전체가 상세로 가는 링크라 저장이 이동을 일으키면 안 된다
        event.preventDefault();
        event.stopPropagation();
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
        className={`size-[22px] transition-transform active:scale-90 ${
          onPlain
            ? saved
              ? "text-primary"
              : "text-sub"
            : "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
        }`}
        aria-hidden
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
    </button>
  );
}
