"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { apiUrl } from "@/lib/apiBase";
import {
  addPlacesToFolder,
  createSavedFolder,
  deleteSavedFolder,
  readSavedFolders,
  removePlacesFromFolder,
  renameSavedFolder,
  type SavedFolder,
} from "@/lib/storage";
import type { RecommendedPlace } from "@/types/place";

const listeners = new Set<() => void>();
const EMPTY: SavedFolder[] = [];
let cache: SavedFolder[] | null = null;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): SavedFolder[] {
  cache ??= readSavedFolders();
  return cache;
}

function mutate<T>(run: () => T): T {
  const result = run();
  cache = null;
  for (const listener of listeners) listener();
  return result;
}

export const folderActions = {
  create: (name: string) => mutate(() => createSavedFolder(name)),
  rename: (id: string, name: string) => mutate(() => renameSavedFolder(id, name)),
  remove: (id: string) => mutate(() => deleteSavedFolder(id)),
  addPlaces: (id: string, placeIds: string[]) => mutate(() => addPlacesToFolder(id, placeIds)),
  removePlaces: (id: string, placeIds: string[]) =>
    mutate(() => removePlacesFromFolder(id, placeIds)),
};

export function useSavedFolders(): SavedFolder[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

type CatalogState = { catalog: Map<string, RecommendedPlace> | null; failed: boolean };

/** `catalog` 가 null 이고 `failed` 가 false 면 불러오는 중이다 */
export function useCatalogMap(): CatalogState & { retry: () => void } {
  const [state, setState] = useState<CatalogState>({ catalog: null, failed: false });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch(apiUrl("/api/recommend?limit=120"))
      .then((res) => {
        if (!res.ok) throw new Error(`추천 API ${res.status}`);
        return res.json() as Promise<RecommendedPlace[]>;
      })
      .then((all) => {
        if (!cancelled) {
          setState({ catalog: new Map(all.map((p) => [p.contentId, p])), failed: false });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ catalog: null, failed: true });
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ catalog: null, failed: false });
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, retry };
}
