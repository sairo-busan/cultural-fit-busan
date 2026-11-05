"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/contexts/ToastContext";
import { useSavedPlaces } from "@/hooks/useSavedPlaces";
import type { FolderSummary, SavedRow } from "@/lib/savedFolders";
import type { SavedFolder } from "@/lib/storage";
import { FolderHeader } from "./FolderHeader";
import { FolderNameSheet, PutFolderSheet } from "./FolderSheets";
import { PlaceList, usePlaceFilter } from "./PlaceList";
import { ConfirmSheet } from "./Sheet";
import { folderActions } from "./useSavedFolders";

type Overlay = "put" | "name" | "unsave" | null;

/**
 * 장소를 여러 곳 고르는 화면.
 * saved: 저장한 곳에서 해제 · 폴더에 넣기 / folder: 폴더에서 빼기 · 폴더에 넣기 / pick: 이 폴더에 넣기
 */
export function ManageView({
  mode,
  rows,
  folder,
  summaries,
  hasFit,
  onDone,
}: {
  mode: "saved" | "folder" | "pick";
  rows: SavedRow[];
  folder?: SavedFolder;
  summaries: FolderSummary[];
  hasFit: boolean;
  onDone: () => void;
}) {
  const t = useTranslations("savedFolders");
  const toast = useToast();
  const { removeMany } = useSavedPlaces();
  const filter = usePlaceFilter(rows);
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [targets, setTargets] = useState<Set<string>>(new Set());
  const [overlay, setOverlay] = useState<Overlay>(null);

  const picked = [...ids];
  const ready = ids.size > 0;

  const flip = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (!next.delete(id)) next.add(id);
    return next;
  };

  function toggleAll() {
    const shown = filter.visible.map((r) => r.place.contentId);
    const allOn = shown.every((id) => ids.has(id));
    const next = new Set(ids);
    for (const id of shown) {
      if (allOn) next.delete(id);
      else next.add(id);
    }
    setIds(next);
  }

  function finish(message: string) {
    toast.show(message);
    onDone();
  }

  const secondary = () => {
    if (!ready) return;
    if (mode === "saved") {
      setOverlay("unsave");
    } else if (folder) {
      folderActions.removePlaces(folder.id, picked);
      finish(t("toast.removed"));
    }
  };

  const primary = () => {
    if (!ready) return;
    if (mode === "pick" && folder) {
      folderActions.addPlaces(folder.id, picked);
      finish(t("toast.added"));
    } else {
      setTargets(new Set());
      setOverlay("put");
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-screen-sm flex-col">
      <FolderHeader
        title={t(mode === "pick" ? "pickTitle" : "manageTitle")}
        onBack={onDone}
        right={
          <button type="button" onClick={onDone} className="ds-body-1 relative min-h-8 before:absolute before:-inset-1.5 before:content-['']">
            {t("done")}
          </button>
        }
      />

      <main className="screen flex-1 pb-36">
        <h1 aria-live="polite" className="ds-display">{t("selected", { count: ids.size })}</h1>
        <p className="ds-body-2 mt-2 mb-5 text-sub">{t(mode === "pick" ? "pickBody" : "manageBody")}</p>

        {rows.length === 0 ? (
          <p className="ds-body-2 py-12 text-center text-sub">{t("nothingToAdd")}</p>
        ) : (
          <PlaceList
            filter={filter}
            hasFit={hasFit}
            timeKey="saved"
            selection={{ ids, onToggle: (id) => setIds(flip(ids, id)), onToggleAll: toggleAll }}
          />
        )}
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-screen-sm gap-3 bg-page px-5 pt-4 pb-safe-cta">
        {mode !== "pick" && (
          <button
            type="button"
            aria-disabled={!ready}
            onClick={secondary}
            className={`ds-body-2 min-h-12 flex-1 rounded-xl bg-surface px-2 font-semibold ${ready ? "" : "opacity-35"}`}
          >
            {t(mode === "saved" ? "unsave" : "removeFromFolder")}
          </button>
        )}
        <button
          type="button"
          aria-disabled={!ready}
          onClick={primary}
          className={`ds-title-2 min-h-12 flex-1 rounded-xl bg-primary px-2 text-white ${ready ? "active:bg-primary-press" : "opacity-35"}`}
        >
          {t(mode === "pick" ? "addHere" : "putTitle")}
        </button>
      </footer>

      {overlay === "put" && (
        <PutFolderSheet
          count={ids.size}
          summaries={summaries}
          targets={targets}
          onToggle={(id) => setTargets(flip(targets, id))}
          onNew={() => setOverlay("name")}
          onConfirm={() => {
            for (const id of targets) folderActions.addPlaces(id, picked);
            finish(t("toast.put"));
          }}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay === "name" && (
        <FolderNameSheet
          onClose={() => setOverlay("put")}
          onSaved={(created) => {
            if (created) setTargets(new Set(targets).add(created.id));
            setOverlay("put");
          }}
        />
      )}
      {overlay === "unsave" && (
        <ConfirmSheet
          title={t("unsaveTitle")}
          body={t("unsaveBody", { count: ids.size })}
          actionLabel={t("unsave")}
          cancelLabel={t("cancel")}
          onAction={() => {
            removeMany(picked);
            onDone();
          }}
          onClose={() => setOverlay(null)}
        />
      )}
    </div>
  );
}
