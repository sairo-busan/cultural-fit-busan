"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * localStorage 를 읽고 쓰는 상태. `useLocalStorage` 와 달리 하이드레이션에 안전하다.
 *
 * 지연 초기화(`useState(() => localStorage...)`)는 첫 렌더부터 클라이언트 값을 써서
 * 서버 HTML 과 어긋난다. 여기서는 첫 렌더에 `serverValue` 를 쓰고, 하이드레이션이
 * 끝난 뒤 실제 값으로 다시 그린다.
 *
 * 스냅샷은 매 렌더 `Object.is` 로 비교되므로 같은 문자열에서는 같은 객체를 돌려줘야
 * 한다 — 매번 `JSON.parse` 하면 렌더가 멈추지 않는다.
 */

const listeners = new Set<() => void>();

/** 같은 탭의 쓰기는 `storage` 이벤트를 발생시키지 않아 직접 알린다 */
function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

const parsed = new Map<string, { raw: string | null; value: unknown }>();

function readCached<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  const hit = parsed.get(key);
  if (hit && hit.raw === raw) return hit.value as T;

  let value = fallback;
  if (raw) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }

  parsed.set(key, { raw, value });
  return value;
}

export function useStoredState<T>(key: string, serverValue: T) {
  const getSnapshot = useCallback(
    () => readCached(key, serverValue),
    [key, serverValue],
  );

  const value = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => serverValue,
  );

  const set = useCallback(
    (next: T) => {
      localStorage.setItem(key, JSON.stringify(next));
      listeners.forEach((notify) => notify());
    },
    [key],
  );

  return [value, set] as const;
}
