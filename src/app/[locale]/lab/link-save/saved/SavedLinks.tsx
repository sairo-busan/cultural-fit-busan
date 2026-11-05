"use client";

import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { AppHeader } from "@/components/common/AppHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ScreenTitle } from "@/components/common/TabScreen";
import { useHydrated } from "@/hooks/useStoredSnapshot";
import { formatSavedAt } from "@/lib/placeDisplay";
import { readLinkSaves, type LinkSave } from "@/lib/storage";
import { PATH, providerLabel, shortUrl, thumbnailOf } from "../LinkSaveContent";
import { linkName } from "../SourceCard";

/** 줄 아래 장소 칩은 두 개까지, 나머지는 "+N" */
const CHIPS = 2;

/**
 * L3 링크로 저장한 곳 — 영상(링크) 단위 목록. 장소는 영상 상세에서 본다.
 * 영상이 쌓여도 목록이 짧고, 같은 영상의 장소는 지도 위 동선으로 함께 봐야 뜻이 있다.
 */
export function SavedLinks() {
  const router = useRouter();
  const hydrated = useHydrated();
  const t = useTranslations("saved");

  if (!hydrated) return null;

  const saves = readLinkSaves();
  const now = new Date();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-screen-sm flex-col">
      <AppHeader onBack={() => router.push(PATH)} />
      <div className="screen">
        <ScreenTitle aside={<span className="ds-body-2 text-sub">링크 {saves.length}</span>}>
          링크로 저장한 곳
        </ScreenTitle>
      </div>

      {saves.length === 0 ? (
        <EmptyState
          title="아직 저장한 곳이 없어요"
          body="영상이나 지도에서 본 곳의 링크를 붙여넣어 보세요."
          actionHref={PATH}
          actionLabel="링크 넣기"
        />
      ) : (
        <ul className="screen mt-2 flex-1">
          {saves.map((save) => (
            <li key={save.url} className="border-b border-hair">
              <SaveRow save={save} when={formatSavedAt(save.savedAt, now, (k, v) => t(k, v))} />
            </li>
          ))}
        </ul>
      )}

      {saves.length > 0 && (
        <div className="screen pb-safe-cta pt-3">
          <Link
            href={PATH}
            className="ds-title-2 flex min-h-12 w-full items-center justify-center rounded-xl border border-line text-ink"
          >
            링크 추가
          </Link>
        </div>
      )}
    </div>
  );
}

function SaveRow({ save, when }: { save: LinkSave; when: string | null }) {
  const provider = providerLabel(save.provider, save.url);
  const thumbnail = thumbnailOf(save.provider, save.url);
  const pending = save.places.length === 0;
  const meta = [provider, pending ? null : `${save.places.length}곳`, when].filter(Boolean).join(" · ");

  // 장소를 아직 안 정한 링크는 곧장 L2 로 — 상세에 보여줄 게 없다
  const href = pending
    ? { pathname: PATH, query: { url: save.url, step: "pick" } }
    : { pathname: `${PATH}/link`, query: { url: save.url } };

  return (
    // 메타 / 썸네일 · 제목 / 장소 칩 — 세 단
    <Link href={href} className="block py-3.5">
      <span className="ds-caption block font-semibold text-sub-on-surface">{meta}</span>
      <span className="mt-1.5 flex items-center gap-3">
        <span className="relative grid aspect-video w-28 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface">
          {thumbnail ? (
            <Image src={thumbnail} alt="" fill sizes="112px" className="object-cover" />
          ) : (
            <span className="ds-caption font-bold text-sub">{provider}</span>
          )}
        </span>
        {save.name ? (
          // 붙인 이름 아래에 원래 제목 — 어떤 영상이었는지 목록에서도 보이게
          <span className="min-w-0 flex-1">
            <span className="ds-body-2 block truncate font-semibold text-ink">{save.name}</span>
            <span className={`ds-caption mt-0.5 line-clamp-2 text-sub ${save.title ? "" : "break-all"}`}>
              {save.title ?? shortUrl(save.url)}
            </span>
          </span>
        ) : (
          <span className={`ds-body-2 line-clamp-2 min-w-0 flex-1 text-ink ${save.title ? "" : "break-all"}`}>
            {linkName(save)}
          </span>
        )}
        <ChevronRight size={18} strokeWidth={1.5} className="shrink-0 text-sub" />
      </span>
      {pending ? (
        <span className="ds-caption mt-2 inline-block font-semibold text-caution">장소 미확정 · 정하기</span>
      ) : (
        <span className="mt-2 flex flex-wrap gap-1">
          {save.places.slice(0, CHIPS).map((p, i) => (
            <span key={i} className="ds-caption max-w-full truncate rounded-full bg-surface px-2 text-sub-on-surface">
              {p.label}
            </span>
          ))}
          {save.places.length > CHIPS && (
            <span className="ds-caption rounded-full bg-surface px-2 text-sub-on-surface">
              +{save.places.length - CHIPS}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}
