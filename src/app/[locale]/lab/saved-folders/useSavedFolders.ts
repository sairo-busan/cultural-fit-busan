"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useLocale } from "next-intl";
import { useSavedPlaces } from "@/hooks/useSavedPlaces";
import { useHydrated, useStoredSnapshot } from "@/hooks/useStoredSnapshot";
import { apiUrl } from "@/lib/apiBase";
import { folderSummaries, savedRows } from "@/lib/savedFolders";
import {
  addPlacesToFolder,
  createSavedFolder,
  deleteSavedFolder,
  readCf8Code,
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

/** 세 화면이 함께 쓰는 원천 값 */
export function useFolderSource() {
  const en = useLocale() === "en";
  const hydrated = useHydrated();
  const cf8Code = useStoredSnapshot(readCf8Code, null);
  const { places } = useSavedPlaces();
  const folders = useSavedFolders();
  const { catalog, failed, retry } = useCatalogMap();

  const options = useMemo(() => ({ en, cf8Code }), [en, cf8Code]);
  const summaries = useMemo(
    () => (catalog ? folderSummaries(folders, places, catalog, options) : []),
    [catalog, folders, places, options],
  );
  const rows = useMemo(
    () => (catalog ? savedRows(places, catalog, options) : []),
    [catalog, places, options],
  );

  return {
    ready: hydrated && catalog !== null,
    failed,
    retry,
    catalog,
    places,
    folders,
    summaries,
    rows,
    options,
    hasFit: Boolean(cf8Code),
  };
}
