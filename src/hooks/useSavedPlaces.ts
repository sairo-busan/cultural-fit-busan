"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { readSavedPlaces, toggleSaved, type SavedPlace } from "@/lib/storage";

/**
 * 저장 목록 하나를 화면들이 함께 본다.
 *
 * 화면마다 저장 상태를 따로 들고 있으면 반영 방식이 갈린다 — 피드는 id 집합을
 * 다시 만들고 저장 탭은 배열에서 빼는 식으로. 지금은 탭을 옮길 때마다 재마운트돼
 * 어긋나지 않지만, 상세 페이지가 붙는 순간 세 번째 방식이 생긴다.
 *
 * localStorage 는 스스로 변경을 알려주지 않으므로(`storage` 이벤트는 **다른 탭**
 * 에서만 뜬다) 이 모듈이 구독자 목록을 들고 직접 알린다.
 */

const listeners = new Set<() => void>();

/**
 * 스냅샷을 캐시한다. 두 가지를 동시에 막는다 —
 * `getSnapshot` 은 렌더마다 불리는데 매번 `JSON.parse` 하면 낭비고, 매번 새
 * 배열을 돌려주면 `Object.is` 비교가 늘 실패해 렌더가 멈추지 않는다.
 */
let cache: SavedPlace[] | null = null;

/** 서버에는 localStorage 가 없다. 같은 참조를 돌려줘야 비교가 안정된다 */
const EMPTY: SavedPlace[] = [];

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): SavedPlace[] {
  if (cache === null) cache = readSavedPlaces();
  return cache;
}

function getServerSnapshot(): SavedPlace[] {
  return EMPTY;
}

export type UseSavedPlacesResult = {
  /** 최근 저장순 */
  places: SavedPlace[];
  /** 행마다 저장 여부를 묻기 좋게 */
  ids: Set<string>;
  toggle: (contentId: string) => void;
};

export function useSavedPlaces(): UseSavedPlacesResult {
  const places = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const ids = useMemo(() => new Set(places.map((p) => p.id)), [places]);

  const toggle = useCallback((contentId: string) => {
    toggleSaved(contentId);
    cache = null;
    for (const listener of listeners) listener();
  }, []);

  return { places, ids, toggle };
}
