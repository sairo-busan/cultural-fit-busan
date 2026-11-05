"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useHydrated, useStoredSnapshot } from "@/hooks/useStoredSnapshot";
import { useSavedPlaces } from "@/hooks/useSavedPlaces";
import {
  ALL_DISTRICTS,
  districtCounts,
  folderPins,
  folderRows,
  folderSummaries,
  savedRows,
  visibleRows,
  type SavedRow,
} from "@/lib/savedFolders";
import { readCf8Code } from "@/lib/storage";
import { useCatalogMap, useSavedFolders } from "./useSavedFolders";

/** 디자인 확정 전 데이터 확인용 화면. 화면 구현 때 지운다 */
export function DataPreview({ view }: { view: "main" | "all" | "folder" }) {
  const en = useLocale() === "en";
  const id = useSearchParams().get("id");
  const hydrated = useHydrated();
  const cf8Code = useStoredSnapshot(readCf8Code, null);
  const { places } = useSavedPlaces();
  const folders = useSavedFolders();
  const { catalog, failed, retry } = useCatalogMap();

  const data = useMemo(() => {
    if (!catalog) return null;
    const options = { en, cf8Code };
    const folder = folders.find((f) => f.id === id) ?? null;
    return {
      folder,
      rows: savedRows(places, catalog, options),
      summaries: folderSummaries(folders, places, catalog, options),
      inFolder: folder ? folderRows(folder, places, catalog, options) : [],
    };
  }, [catalog, folders, places, id, en, cf8Code]);

  if (failed) return <button type="button" onClick={retry}>다시 시도</button>;
  if (!hydrated || !data) return <p>불러오는 중</p>;

  const list = (rows: SavedRow[]) => (
    <>
      <p>지역: {districtCounts(rows).map(([n, c]) => `${n} ${c}`).join(", ") || "없음"}</p>
      <ol>{visibleRows(rows, ALL_DISTRICTS, "recent").map((r) => <li key={r.place.contentId}>{r.place.title}</li>)}</ol>
    </>
  );

  return (
    <main data-view={view} style={{ padding: 20 }}>
      {view === "folder" ? (
        data.folder ? (
          <>
            <h1>{data.folder.name} {data.inFolder.length}곳</h1>
            <p>핀: {folderPins(data.inFolder).map((p) => `${p.n}.${p.label}`).join(", ")}</p>
            {list(data.inFolder)}
          </>
        ) : (
          <p>폴더를 찾을 수 없어요</p>
        )
      ) : (
        <>
          <h1>저장 {data.rows.length}곳 · 폴더 {data.summaries.length}개</h1>
          <ul>{data.summaries.map((s) => <li key={s.folder.id}>{s.folder.name} {s.count}곳</li>)}</ul>
          {view === "main" && list(data.rows)}
        </>
      )}
    </main>
  );
}
