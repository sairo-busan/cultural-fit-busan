"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bookmark, ChevronRight, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { EmptyState } from "@/components/common/EmptyState";
import { useToast } from "@/contexts/ToastContext";
import { Link, useRouter } from "@/i18n/navigation";
import { folderPins, folderRows, type FolderSummary } from "@/lib/savedFolders";
import { KakaoMap } from "../link-save/KakaoMap";
import { FolderArt } from "./FolderArt";
import { FolderHeader } from "./FolderHeader";
import { FolderNameSheet } from "./FolderSheets";
import { ManageView } from "./ManageView";
import { PlaceList, usePlaceFilter } from "./PlaceList";
import { ConfirmSheet, Sheet } from "./Sheet";
import { folderActions, useFolderSource } from "./useSavedFolders";

const BASE = "/lab/saved-folders";
const HOME_FOLDERS = 2;
const NOOP = () => {};

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex min-h-dvh w-full max-w-screen-sm flex-col">{children}</div>;
}

function Loading() {
  return (
    <div className="screen flex flex-col gap-4 pt-16" aria-hidden>
      <div className="h-10 w-40 animate-pulse rounded-lg bg-surface" />
      <div className="h-40 animate-pulse rounded-xl bg-surface" />
      <div className="h-20 animate-pulse rounded-xl bg-surface" />
    </div>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("savedFolders.loadError");
  return <EmptyState title={t("title")} body={t("body")} onAction={onRetry} actionLabel={t("action")} />;
}

function FolderGrid({ summaries }: { summaries: FolderSummary[] }) {
  const t = useTranslations("savedFolders");
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 pt-3 pb-1">
      {summaries.map(({ folder, count }) => (
        <Link
          key={folder.id}
          href={{ pathname: `${BASE}/folder`, query: { id: folder.id } }}
          className="flex min-w-0 flex-col items-center px-1 pb-2 transition-opacity active:opacity-70"
        >
          <FolderArt empty={count === 0} />
          <span className="ds-body-1 mt-3 max-w-full break-words text-center">{folder.name}</span>
          <span className="ds-body-2 mt-1 text-sub">{t("count", { count })}</span>
        </Link>
      ))}
    </div>
  );
}

function NewFolderButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("savedFolders");
  return (
    <button
      type="button"
      onClick={onClick}
      className="ds-body-1 mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-surface"
    >
      <Plus size={20} strokeWidth={1.5} aria-hidden />
      {t("newFolder")}
    </button>
  );
}

function useFolderCreated() {
  const toast = useToast();
  const t = useTranslations("savedFolders");
  return () => toast.show(t("toast.created"));
}

export function SavedHome() {
  const t = useTranslations("savedFolders");
  const router = useRouter();
  const source = useFolderSource();
  const filter = usePlaceFilter(source.rows);
  const [manage, setManage] = useState(false);
  const [naming, setNaming] = useState(false);
  const created = useFolderCreated();

  if (manage) {
    return (
      <ManageView
        mode="saved"
        rows={source.rows}
        summaries={source.summaries}
        hasFit={source.hasFit}
        onDone={() => setManage(false)}
      />
    );
  }

  return (
    <Shell>
      <FolderHeader onBack={() => router.push("/lab/link-save")} />
      {source.failed ? (
        <LoadError onRetry={source.retry} />
      ) : !source.ready ? (
        <Loading />
      ) : (
        <main className="screen flex-1 pb-10">
          <h1 className="ds-display">{t("title")}</h1>
          <p className="ds-body-2 mt-2 text-sub">{t("subtitle")}</p>

          {source.rows.length === 0 ? (
            <div className="flex min-h-90 flex-col items-center justify-center gap-3 px-3 py-9 text-center">
              <Bookmark size={48} strokeWidth={1.2} className="mb-5" aria-hidden />
              <h2 className="ds-title-1">{t("emptySaved.title")}</h2>
              <p className="ds-body-2 max-w-[30ch] text-sub">{t("emptySaved.body")}</p>
              <Link href="/feed" className="ds-title-2 mt-3 inline-flex min-h-12 min-w-40 items-center justify-center rounded-xl bg-primary px-4 text-white">
                {t("emptySaved.action")}
              </Link>
            </div>
          ) : (
            <>
              <section>
                <div className="mt-6 mb-3 flex min-h-11 items-center justify-between gap-2">
                  <h2 className="ds-title-1">
                    {t("folders")}
                    <span className="ds-body-2 ml-2 text-sub">{source.summaries.length}</span>
                  </h2>
                  {source.summaries.length > 0 && (
                    <Link href={`${BASE}/all`} className="ds-body-2 flex min-h-11 items-center gap-1 whitespace-nowrap">
                      {t("viewAll")}
                      <ChevronRight size={16} aria-hidden />
                    </Link>
                  )}
                </div>
                {source.summaries.length === 0 ? (
                  <p className="ds-body-2 text-sub">{t("noFolders")}</p>
                ) : (
                  <FolderGrid summaries={source.summaries.slice(0, HOME_FOLDERS)} />
                )}
                <NewFolderButton onClick={() => setNaming(true)} />
              </section>

              <section className="mt-8">
                <div className="mb-2 flex min-h-11 items-center justify-between gap-2">
                  <h2 className="ds-title-1">{t("allPlaces")}</h2>
                  <button type="button" onClick={() => setManage(true)} className="ds-body-2 min-h-11 px-1">
                    {t("manage")}
                  </button>
                </div>
                <PlaceList filter={filter} hasFit={source.hasFit} timeKey="saved" />
              </section>
            </>
          )}
        </main>
      )}

      {naming && (
        <FolderNameSheet
          onClose={() => setNaming(false)}
          onSaved={() => {
            setNaming(false);
            created();
          }}
        />
      )}
    </Shell>
  );
}

export function AllFolders() {
  const t = useTranslations("savedFolders");
  const router = useRouter();
  const source = useFolderSource();
  const [naming, setNaming] = useState(false);
  const created = useFolderCreated();

  return (
    <Shell>
      <FolderHeader title={t("allTitle")} onBack={() => router.push(BASE)} />
      {source.failed ? (
        <LoadError onRetry={source.retry} />
      ) : !source.ready ? (
        <Loading />
      ) : (
        <main className="screen flex-1 pb-10">
          <h1 className="ds-display">{t("folders")}</h1>
          <p className="ds-body-2 mt-2 text-sub">{t("allSubtitle")}</p>
          <div className="mt-4">
            <FolderGrid summaries={source.summaries} />
          </div>
          <NewFolderButton onClick={() => setNaming(true)} />
        </main>
      )}
      {naming && (
        <FolderNameSheet
          onClose={() => setNaming(false)}
          onSaved={() => {
            setNaming(false);
            created();
          }}
        />
      )}
    </Shell>
  );
}

type DetailOverlay = "menu" | "rename" | "delete" | null;

export function FolderDetail() {
  const t = useTranslations("savedFolders");
  const en = useLocale() === "en";
  const router = useRouter();
  const toast = useToast();
  const id = useSearchParams().get("id");
  const source = useFolderSource();
  const { catalog, places, options } = source;
  const folder = source.folders.find((f) => f.id === id);

  const rows = useMemo(
    () => (folder && catalog ? folderRows(folder, places, catalog, options) : []),
    [folder, catalog, places, options],
  );
  const addable = useMemo(() => {
    const inside = new Set(rows.map((r) => r.place.contentId));
    return source.rows.filter((r) => !inside.has(r.place.contentId));
  }, [rows, source.rows]);

  const filter = usePlaceFilter(rows);
  const [mode, setMode] = useState<"folder" | "pick" | null>(null);
  const [overlay, setOverlay] = useState<DetailOverlay>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  const pins = useMemo(() => folderPins(filter.visible, en), [filter.visible, en]);
  const focusIndex = filter.visible.findIndex((r) => r.place.contentId === focusId);
  const activeRow = focusIndex >= 0 ? focusIndex : 0;
  const activeId = filter.visible[activeRow]?.place.contentId ?? null;
  const selectedPin = pins.findIndex((p) => p.n === activeRow + 1);

  function selectPin(index: number) {
    const contentId = filter.visible[pins[index].n - 1].place.contentId;
    setFocusId(contentId);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(`place-${contentId}`)?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  }

  const back = () => router.push(BASE);

  if (source.failed) {
    return (
      <Shell>
        <FolderHeader onBack={back} />
        <LoadError onRetry={source.retry} />
      </Shell>
    );
  }

  if (!source.ready) {
    return (
      <Shell>
        <FolderHeader onBack={back} />
        <Loading />
      </Shell>
    );
  }

  if (!folder) {
    return (
      <Shell>
        <FolderHeader onBack={back} />
        <EmptyState
          title={t("notFound.title")}
          body={t("notFound.body")}
          actionHref={BASE}
          actionLabel={t("notFound.action")}
        />
      </Shell>
    );
  }

  if (mode) {
    return (
      <ManageView
        mode={mode}
        rows={mode === "pick" ? addable : rows}
        folder={folder}
        summaries={source.summaries}
        hasFit={source.hasFit}
        onDone={() => setMode(null)}
      />
    );
  }

  return (
    <Shell>
      <FolderHeader
        onBack={back}
        right={
          <button
            type="button"
            onClick={() => setOverlay("menu")}
            aria-label={t("folderMenu")}
            className="relative grid size-8 place-items-center before:absolute before:-inset-1.5 before:content-['']"
          >
            <MoreHorizontal size={20} strokeWidth={1.5} />
          </button>
        }
      />

      <main className="screen flex-1 pb-10">
        <div className="mt-2 mb-6 flex items-center gap-5">
          <FolderArt size="title" open empty={rows.length === 0} />
          <div className="min-w-0">
            <h1 className="ds-display break-words">{folder.name}</h1>
            <p className="ds-body-2 mt-2 text-sub">{t("count", { count: rows.length })}</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex min-h-90 flex-col items-center justify-center gap-3 px-3 py-9 text-center">
            <div className="mb-3"><FolderArt empty open /></div>
            <h2 className="ds-title-1">{t("emptyFolder.title")}</h2>
            <p className="ds-body-2 max-w-[30ch] text-sub">{t("emptyFolder.body")}</p>
            <button
              type="button"
              onClick={() => setMode("pick")}
              className="ds-title-2 mt-3 min-h-12 min-w-40 rounded-xl bg-primary px-4 text-white active:bg-primary-press"
            >
              {t("emptyFolder.action")}
            </button>
          </div>
        ) : (
          <>
            {pins.length > 0 && (
              <div className="sticky top-0 z-10 -mx-1 bg-page px-1 pb-3">
                <div className="h-48 overflow-hidden rounded-2xl">
                  <KakaoMap
                    key={filter.district}
                    pins={pins}
                    selected={selectedPin}
                    onSelect={selectPin}
                    onMapClick={NOOP}
                    coverBottom={0}
                  />
                </div>
              </div>
            )}
            <section className="mt-5">
              <div className="mb-2 flex min-h-11 items-center justify-between gap-2">
                <h2 className="ds-title-1">{t("inFolder")}</h2>
                <button type="button" onClick={() => setMode("folder")} className="ds-body-2 min-h-11 px-1">
                  {t("manage")}
                </button>
              </div>
              <PlaceList
                filter={filter}
                hasFit={source.hasFit}
                timeKey="added"
                numbered
                focusId={activeId}
              />
            </section>
          </>
        )}
      </main>

      {overlay === "menu" && (
        <Sheet title={folder.name} onClose={() => setOverlay(null)}>
          <button type="button" onClick={() => setOverlay("rename")} className="ds-body-1 flex min-h-14 w-full items-center gap-3 text-left">
            <Pencil size={20} strokeWidth={1.5} aria-hidden />
            {t("rename")}
          </button>
          <button type="button" onClick={() => setOverlay("delete")} className="ds-body-1 flex min-h-14 w-full items-center gap-3 text-left text-danger">
            <Trash2 size={20} strokeWidth={1.5} aria-hidden />
            {t("deleteFolder")}
          </button>
        </Sheet>
      )}
      {overlay === "rename" && (
        <FolderNameSheet
          folder={folder}
          onClose={() => setOverlay(null)}
          onSaved={() => {
            setOverlay(null);
            toast.show(t("toast.renamed"));
          }}
        />
      )}
      {overlay === "delete" && (
        <ConfirmSheet
          title={t("deleteTitle")}
          body={t("deleteBody", { name: folder.name })}
          note={t("deleteNote")}
          actionLabel={t("deleteFolder")}
          cancelLabel={t("cancel")}
          onAction={() => {
            folderActions.remove(folder.id);
            toast.show(t("toast.deleted"));
            back();
          }}
          onClose={() => setOverlay(null)}
        />
      )}
    </Shell>
  );
}
