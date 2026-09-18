"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type DocentAudio = {
  src: string | null;
  playing: boolean;
  at: number;
  total: number;
  /** 끝까지 들었다 — 바는 남고 다시 재생을 보인다 */
  ended: boolean;
  /** 다른 음원이면 처음부터, 같은 음원이면 재생 · 일시정지를 번갈아 */
  toggle: (src: string) => void;
  stop: () => void;
};

/**
 * 도슨트 음원 — 화면이 아니라 상세 페이지가 들고 있다. 도슨트를 닫아도 이어서 들린다.
 * 다른 화면으로 나가면(이 페이지가 떠나면) 멈춘다.
 */
export function useDocentAudio(): DocentAudio {
  const el = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState({
    src: null as string | null,
    playing: false,
    at: 0,
    total: 0,
    ended: false,
  });

  useEffect(() => {
    return () => el.current?.pause();
  }, []);

  const toggle = useCallback((src: string) => {
    const current = el.current;
    if (current && current.src === src) {
      if (current.paused) void current.play();
      else current.pause();
      return;
    }

    current?.pause();
    const next = new Audio(src);
    el.current = next;
    setState({ src, playing: false, at: 0, total: 0, ended: false });
    next.addEventListener("play", () =>
      setState((s) => ({ ...s, playing: true, ended: false })),
    );
    next.addEventListener("pause", () =>
      setState((s) => ({ ...s, playing: false })),
    );
    // 끝까지 들어도 바는 남긴다 — 같은 음원을 다시 누르면 처음부터 다시 들린다
    next.addEventListener("ended", () =>
      setState((s) => ({ ...s, playing: false, ended: true, at: s.total })),
    );
    next.addEventListener("timeupdate", () =>
      setState((s) => ({ ...s, at: next.currentTime })),
    );
    next.addEventListener("loadedmetadata", () =>
      setState((s) => ({ ...s, total: next.duration })),
    );
    void next.play();
  }, []);

  const stop = useCallback(() => {
    el.current?.pause();
    el.current = null;
    setState({ src: null, playing: false, at: 0, total: 0, ended: false });
  }, []);

  return { ...state, toggle, stop };
}
