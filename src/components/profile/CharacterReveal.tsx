"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Cf8Code } from "@/types/cfp";

const CODES: Cf8Code[] = ["CLD", "CLV", "CFD", "CFV", "ELD", "ELV", "EFD", "EFV"];
/** 캐릭터가 바뀌는 간격 — 점점 느려지다 내 캐릭터에서 멈춘다 (합 1.4초) */
const GAPS = [100, 100, 100, 150, 150, 200, 250, 350];
const FRAMES = GAPS.length + 1;
/** 멈춘 뒤 결과로 넘어가기까지 */
const HOLD = 1200;

type CharacterRevealProps = {
  code: Cf8Code;
  name: string;
  onDone: () => void;
};

/** S01 → S02 사이 — 8유형 캐릭터가 바뀌다 내 캐릭터에서 멈춘다. */
export function CharacterReveal({ code, name, onDone }: CharacterRevealProps) {
  const t = useTranslations("profile.reveal");
  // 서버에서는 그리지 않는다(연출 신호가 클라이언트에만 있다) — 첫 렌더에 설정을 읽어도 된다
  const [reduce] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [frame, setFrame] = useState(reduce ? FRAMES - 1 : 0);
  const [order] = useState(() => {
    const others = CODES.filter((c) => c !== code).sort(() => Math.random() - 0.5);
    return [...others, others[0], code];
  });

  useEffect(() => {
    // 동작 줄이기면 섞지 않고 내 캐릭터에서 시작한다
    if (reduce) {
      const done = setTimeout(onDone, HOLD);
      return () => clearTimeout(done);
    }
    let at = 0;
    const timers = GAPS.map((gap, i) => setTimeout(() => setFrame(i + 1), (at += gap)));
    timers.push(setTimeout(onDone, at + HOLD));
    return () => timers.forEach(clearTimeout);
  }, [reduce, onDone]);

  const found = frame === FRAMES - 1;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5">
      <div className="relative grid size-55 place-items-center">
        <span aria-hidden className="absolute size-45 rounded-full bg-surface" />
        {/* 8장을 겹쳐 두고 보이는 것만 바꾼다 — 바뀔 때 이미지를 새로 받지 않는다 */}
        {CODES.map((c) => (
          <Image
            key={c}
            src={`/characters/${c}.webp`}
            alt=""
            width={440}
            height={440}
            priority
            className={`absolute inset-0 size-full ${order[frame] === c ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>
      <p role="status" className="mt-6 flex min-h-16 flex-col items-center text-center">
        <span className="ds-body-1 text-sub">{found ? t("found") : t("finding")}</span>
        {found && <span className="ds-headline mt-1 animate-fade-in">{name}</span>}
      </p>
    </div>
  );
}
