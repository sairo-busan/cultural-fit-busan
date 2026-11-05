"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { FOLDER_NAME_MAX, folderNameError, type FolderNameError, type SavedFolder } from "@/lib/storage";
import { Sheet } from "./Sheet";
import { folderActions } from "./useSavedFolders";

/** `folder` 를 주면 이름 바꾸기, 없으면 새 폴더 */
export function FolderNameSheet({
  folder,
  onClose,
  onSaved,
}: {
  folder?: SavedFolder;
  onClose: () => void;
  onSaved: (folder: SavedFolder | null) => void;
}) {
  const t = useTranslations("savedFolders");
  const [name, setName] = useState(folder?.name ?? "");
  const [error, setError] = useState<FolderNameError | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const problem = folderNameError(name, folder?.id);
    if (problem) {
      setError(problem);
      return;
    }
    if (folder) {
      folderActions.rename(folder.id, name);
      onSaved(null);
    } else {
      onSaved(folderActions.create(name));
    }
  }

  return (
    <Sheet title={t(folder ? "rename" : "newFolder")} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <label htmlFor="folder-name" className="ds-body-2 mt-6 mb-2 block">
          {t("nameLabel")}
        </label>
        <div
          className={`flex h-14 items-center gap-2 rounded-xl border bg-page px-4 ${
            error ? "border-danger" : "border-ink"
          }`}
        >
          <input
            id="folder-name"
            autoFocus
            autoComplete="off"
            value={name}
            maxLength={FOLDER_NAME_MAX}
            placeholder={t("namePlaceholder")}
            aria-invalid={Boolean(error)}
            aria-describedby="folder-name-help"
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            className="ds-body-1 w-full min-w-0 bg-transparent outline-none"
          />
          <span className="ds-caption shrink-0 text-sub">
            {name.length} / {FOLDER_NAME_MAX}
          </span>
        </div>
        <p
          id="folder-name-help"
          role={error ? "alert" : undefined}
          className={`ds-body-2 min-h-11 pt-2 ${error ? "text-danger" : "text-sub"}`}
        >
          {t(error ? `nameError.${error}` : "nameHelp", { max: FOLDER_NAME_MAX })}
        </p>
        <button type="submit" className="ds-title-2 mt-5 min-h-12 w-full rounded-xl bg-primary text-white active:bg-primary-press">
          {t(folder ? "renameAction" : "createAction")}
        </button>
      </form>
    </Sheet>
  );
}

export function CheckBox({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-6 shrink-0 place-items-center rounded-lg border ${
        on ? "border-ink bg-ink text-white" : "border-sub bg-page"
      }`}
    >
      {on && <Check size={16} strokeWidth={2.5} />}
    </span>
  );
}
