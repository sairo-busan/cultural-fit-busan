"use client";

import { useEffect, useReducer, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ExternalLink, MapPin as MapPinIcon, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { AppHeader } from "@/components/common/AppHeader";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { useHydrated } from "@/hooks/useStoredSnapshot";
import { apiUrl } from "@/lib/apiBase";
import { formatSavedAt, googleMapsUrl } from "@/lib/placeDisplay";
import { deleteLinkSave, readLinkSaves, removeLinkPlace, renameLinkSave } from "@/lib/storage";
import { KakaoMap, type MapPin } from "../KakaoMap";
import { FitTag, PATH, providerLabel, writePick } from "../LinkSaveContent";
import { MenuSheet } from "../MenuSheet";
import { linkName, SourceCard } from "../SourceCard";
import { useCatalog } from "../useCatalog";

const NOOP = () => {};

type KakaoInfo = { x: number; y: number; addr: string | null; category: string | null };

/**
 * 영상(링크) 상세 — 그 영상에서 저장한 곳을 지도 위 번호 마커와 목록으로.
 * 장소를 누르면 지도가 그 곳으로 날아가고 줄이 펼쳐진다(주소 · 지도 앱 열기 · 삭제). 따로 장소 화면은 없다.
 * 좌표 · 주소는 저장하지 않으므로(카카오 정책) 열 때마다 장소마다 카카오에서 다시 받는다.
 */
export function LinkDetail() {
  const router = useRouter();
  const params = useSearchParams();
  const hydrated = useHydrated();
  const t = useTranslations("saved");
  const { fitLabel } = useCatalog();

  const url = params.get("url") ?? "";
  const save = hydrated ? readLinkSaves().find((s) => s.url === url) : undefined;

  /** 장소 순서대로 카카오 정보. 이름만 적은 곳 · 못 찾은 곳은 null */
  const [infos, setInfos] = useState<{ url: string; list: (KakaoInfo | null)[] } | null>(null);
  /** 지금 보는 장소(저장 순서). 지도 마커와 펼친 줄이 함께 따라간다 */
  const [focus, setFocus] = useState<number | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  /** 저장소를 고친 뒤 다시 읽게 한다 — 이 화면은 렌더마다 `readLinkSaves()` 를 읽는다 */
  const [, refresh] = useReducer((n: number) => n + 1, 0);
  // 저장 목록을 값으로 비교한다 — 매 렌더 새 배열이라 그대로 넣으면 효과가 멈추지 않는다
  const placesKey = JSON.stringify(save?.places ?? []);

  useEffect(() => {
    const places: { label: string; kakaoId?: string | null }[] = JSON.parse(placesKey);
    if (!places.length) return;
    let cancelled = false;

    Promise.all(
      places.map(async (p): Promise<KakaoInfo | null> => {
        if (!p.kakaoId) return null;
        try {
          const q = new URLSearchParams({ q: p.label, id: p.kakaoId });
          const res = await fetch(apiUrl(`/api/place-search?${q}`));
          return res.ok ? ((await res.json()) as KakaoInfo) : null;
        } catch {
          return null;
        }
      }),
    ).then((list) => {
      if (!cancelled) setInfos({ url, list });
    });

    return () => {
      cancelled = true;
    };
  }, [url, placesKey]);

  if (!hydrated) return null;

  if (!save) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-screen-sm flex-col">
        <AppHeader onBack={() => router.push(`${PATH}/saved`)} />
        <EmptyState
          title="저장한 링크를 찾지 못했어요"
          body="목록에서 지웠거나 다른 기기에서 저장한 링크예요."
          actionHref={`${PATH}/saved`}
          actionLabel="저장한 곳 보기"
        />
      </div>
    );
  }

  const openPick = () =>
    writePick(
      url,
      save.places.map((p) => ({ label: p.label, placeId: p.placeId, kakaoId: p.kakaoId ?? null })),
    );

  const meta = [
    providerLabel(save.provider, save.url),
    `${save.places.length}곳`,
    formatSavedAt(save.savedAt, new Date(), (k, v) => t(k, v)),
  ]
    .filter(Boolean)
    .join(" · ");
  const list = infos?.url === url ? infos.list : null;
  const shown: MapPin[] | null = list
    ? list.flatMap((k, i) =>
        k ? [{ x: k.x, y: k.y, on: true, plain: true, label: save.places[i].label, n: i + 1 }] : [],
      )
    : null;
  const selectedPin = shown && focus !== null ? shown.findIndex((p) => p.n === focus + 1) : -1;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-screen-sm flex-col">
      <AppHeader
        onBack={() => router.push(`${PATH}/saved`)}
        right={
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="링크 메뉴"
            className="relative grid size-8 place-items-center before:absolute before:-inset-1.5 before:content-['']"
          >
            <MoreHorizontal size={20} strokeWidth={1.5} />
          </button>
        }
      />

      <div className="screen flex-1">
        <SourceCard
          save={save}
          meta={meta}
          editing={editing}
          onEditingChange={setEditing}
          onRename={(name) => {
            renameLinkSave(url, name);
            refresh();
          }}
        />

        {/* 이름만 적은 곳은 좌표가 없어 마커가 없다. 하나도 없으면 지도 칸을 뺀다 */}
        {shown === null ? (
          <div className="mt-4 h-56 animate-pulse rounded-xl bg-surface" />
        ) : (
          shown.length > 0 && (
            // 아래쪽 장소를 눌러도 지도가 보이게 화면 위에 붙인다
            <div className="sticky top-0 z-10 -mx-1 bg-page px-1 pt-4 pb-1">
            <div className="h-56 overflow-hidden rounded-xl">
              <KakaoMap
                pins={shown}
                selected={selectedPin}
                onSelect={(i) => setFocus(shown[i].n! - 1)}
                onMapClick={NOOP}
                coverBottom={0}
              />
            </div>
            </div>
          )
        )}

        <ul className="mt-2">
          {save.places.map((p, i) => {
            const fit = fitLabel(p.placeId);
            const nameOnly = !p.kakaoId && !p.placeId;
            const open = focus === i;
            // undefined = 받는 중
            const info = list ? list[i] : undefined;
            return (
              <li key={i} className="border-b border-hair last:border-b-0">
                <button
                  type="button"
                  onClick={() => setFocus(open ? null : i)}
                  aria-expanded={open}
                  className="flex min-h-14 w-full items-center gap-3 text-left"
                >
                  <span
                    className={`grid size-[22px] shrink-0 place-items-center rounded-full border text-[11px] font-bold ${
                      open ? "border-ink text-ink" : "border-line text-sub"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span className="ds-title-2 truncate text-ink">{p.label}</span>
                    {fit && <FitTag>{fit}</FitTag>}
                    {nameOnly && <span className="ds-caption shrink-0 text-sub">이름만</span>}
                  </span>
                  <ChevronDown
                    size={18}
                    strokeWidth={1.5}
                    className={`shrink-0 text-sub transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>

                {open && (
                  <div className="pb-4 pl-[2.125rem]">
                    {nameOnly ? (
                      <p className="ds-body-2 text-sub">
                        이름만 적어 둔 곳이에요. <Link href={{ pathname: PATH, query: { url, step: "pick" } }} onClick={openPick} className="font-semibold text-ink underline underline-offset-4">장소 찾기</Link>
                      </p>
                    ) : (
                      <p className="ds-body-2 text-sub-on-surface">
                        {info === undefined ? "\u00a0" : info ? [info.category, info.addr].filter(Boolean).join(" · ") : "장소 정보를 불러오지 못했어요"}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4">
                      {p.kakaoId && (
                        <a
                          href={`https://place.map.kakao.com/${p.kakaoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ds-caption inline-flex min-h-9 items-center gap-1 font-semibold text-ink"
                        >
                          카카오맵 <ExternalLink size={12} strokeWidth={2} />
                        </a>
                      )}
                      {!nameOnly && (
                        <a
                          href={googleMapsUrl(p.label)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ds-caption inline-flex min-h-9 items-center gap-1 font-semibold text-ink"
                        >
                          구글맵 <ExternalLink size={12} strokeWidth={2} />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setRemoving(i)}
                        className="ds-caption ml-auto inline-flex min-h-9 items-center gap-1 font-semibold text-danger"
                      >
                        <Trash2 size={12} strokeWidth={2} />이 장소 삭제
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="screen pb-safe-cta pt-3">
        {/* 고칠 때는 지금 저장된 곳이 골라진 채로 L2 가 열린다 */}
        <Link
          href={{ pathname: PATH, query: { url, step: "pick" } }}
          onClick={openPick}
          className="ds-title-2 flex min-h-12 w-full items-center justify-center rounded-xl border border-line text-ink"
        >
          장소 고치기
        </Link>
      </div>

      <MenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={[
          { label: "이름 바꾸기", icon: <Pencil size={20} strokeWidth={1.8} />, onSelect: () => setEditing(true) },
          {
            label: "장소 고치기",
            icon: <MapPinIcon size={20} strokeWidth={1.8} />,
            onSelect: () => {
              openPick();
              router.push({ pathname: PATH, query: { url, step: "pick" } });
            },
          },
          {
            label: "링크 삭제",
            icon: <Trash2 size={20} strokeWidth={1.8} />,
            danger: true,
            onSelect: () => setConfirmOpen(true),
          },
        ]}
      />
      <ConfirmDialog
        open={removing !== null}
        danger
        title="이 장소를 지울까요?"
        body={
          save.places.length > 1
            ? `이 곳만 지워지고, 같은 ${save.provider === "youtube" ? "영상" : "링크"}의 다른 곳은 남아요.`
            : `마지막 장소라 지우면 ${save.provider === "youtube" ? "이 영상은" : "이 링크는"} 장소 미확정으로 남아요.`
        }
        primaryLabel="삭제"
        secondaryLabel="취소"
        onPrimary={() => {
          if (removing !== null) removeLinkPlace(url, removing);
          setRemoving(null);
          setFocus(null);
          if (save.places.length > 1) refresh();
          else router.replace(`${PATH}/saved`);
        }}
        onSecondary={() => setRemoving(null)}
        onClose={() => setRemoving(null)}
      />
      <ConfirmDialog
        open={confirmOpen}
        danger
        title="이 링크를 지울까요?"
        body={`‘${linkName(save)}’ · 저장한 ${save.places.length}곳도 함께 지워져요.`}
        primaryLabel="삭제"
        secondaryLabel="취소"
        onPrimary={() => {
          deleteLinkSave(url);
          router.replace(`${PATH}/saved`);
        }}
        onSecondary={() => setConfirmOpen(false)}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
