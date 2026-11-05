"use client";

import { useState } from "react";
import Image from "next/image";
import { ExternalLink, Pencil, X } from "lucide-react";
import { LINK_NAME_MAX, type LinkSave } from "@/lib/storage";
import { shortUrl, thumbnailOf } from "./LinkSaveContent";

/** 화면에 쓰는 링크 이름 — 붙인 이름 → 영상 제목 → 짧은 주소 */
export const linkName = (save: LinkSave) => save.name ?? save.title ?? shortUrl(save.url);

/**
 * 저장한 링크의 출처 카드 — 메타 / 썸네일 · 이름 · 영상(원문) 열기.
 * `onRename` 을 주면 이름 옆 ✎ 로 그 자리에서 이름을 고친다.
 */
export function SourceCard({
  save,
  meta,
  editing = false,
  onEditingChange,
  onRename,
}: {
  save: LinkSave;
  meta: string;
  editing?: boolean;
  onEditingChange?: (editing: boolean) => void;
  onRename?: (name: string) => void;
}) {
  const thumbnail = thumbnailOf(save.provider, save.url);
  const video = save.provider === "youtube";
  const original = save.title ?? shortUrl(save.url);
  const [draft, setDraft] = useState(save.name ?? original);

  function commit() {
    onRename?.(draft === original ? "" : draft);
    onEditingChange?.(false);
  }

  return (
    <div className="rounded-xl bg-surface p-3">
      <p className="ds-caption font-semibold text-sub-on-surface">{meta}</p>
      <div className="mt-2 flex items-center gap-3">
        {thumbnail && (
          <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-line">
            <Image src={thumbnail} alt="" fill sizes="112px" className="object-cover" />
          </span>
        )}
        {/* 보기 · 고치기 두 상태의 높이를 같게 — 고칠 때 카드가 들썩이지 않는다 */}
        <div className="flex h-19 min-w-0 flex-1 flex-col justify-center">
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                commit();
              }}
            >
              <label className="flex h-10 items-center gap-1.5 rounded-[10px] bg-page px-2.5 ring-[1.5px] ring-ink">
                <input
                  autoFocus
                  value={draft}
                  maxLength={LINK_NAME_MAX}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commit}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setDraft(save.name ?? original);
                      onEditingChange?.(false);
                    }
                  }}
                  aria-label="링크 이름"
                  className="ds-body-2 min-w-0 flex-1 bg-transparent font-semibold outline-none!"
                />
                {draft && (
                  <button
                    type="button"
                    // 지우기를 눌러도 입력칸이 닫히지 않게 — blur 보다 먼저 막는다
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setDraft("")}
                    aria-label="이름 지우기"
                    className="relative grid size-5 shrink-0 place-items-center rounded-full bg-line text-white before:absolute before:-inset-3 before:content-['']"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                )}
              </label>
              <p className="ds-caption mt-1.5 text-sub">
                비우면 {video ? "영상 제목" : "원래 제목"}으로 돌아가요 · {draft.length}/{LINK_NAME_MAX}
              </p>
            </form>
          ) : (
            <>
              <p className="flex items-start gap-1.5">
                <span
                  className={`ds-body-2 font-semibold text-ink ${save.name ? "line-clamp-1" : "line-clamp-2"} ${
                    save.title || save.name ? "" : "break-all"
                  }`}
                >
                  {linkName(save)}
                </span>
                {onRename && (
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(save.name ?? original);
                      onEditingChange?.(true);
                    }}
                    aria-label="이름 바꾸기"
                    className="relative mt-0.5 grid size-4 shrink-0 place-items-center text-sub before:absolute before:-inset-3.5 before:content-['']"
                  >
                    <Pencil size={14} strokeWidth={1.8} />
                  </button>
                )}
              </p>
              {save.name && (
                <p className="ds-caption mt-0.5 truncate text-sub">
                  {original}
                </p>
              )}
              <a
                href={save.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ds-caption mt-1.5 inline-flex min-h-6 items-center gap-1 font-semibold text-ink"
              >
                {video ? "영상 보기" : "원문 열기"}
                <ExternalLink size={12} strokeWidth={2} />
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
