"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronRight, Image as ImageIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { fitBand, formatSavedAt, secureImageUrl } from "@/lib/placeDisplay";
import {
  ALL_DISTRICTS,
  activeDistrict,
  districtCounts,
  visibleRows,
  type FolderSortKey,
  type SavedRow,
} from "@/lib/savedFolders";
import { CheckBox } from "./FolderSheets";

export function usePlaceFilter(rows: SavedRow[]) {
  const [selected, setDistrict] = useState(ALL_DISTRICTS);
  const [sort, setSort] = useState<FolderSortKey>("recent");

  const counts = useMemo(() => districtCounts(rows), [rows]);
  const district = activeDistrict(selected, counts);
  const visible = useMemo(() => visibleRows(rows, district, sort), [rows, district, sort]);

  return { counts, district, setDistrict, sort, setSort, visible };
}

export type PlaceFilter = ReturnType<typeof usePlaceFilter>;

/** 지역 칩 · 개수(또는 전체 선택) · 정렬 · 행 */
export function PlaceList({
  filter,
  hasFit,
  timeKey,
  numbered = false,
  selection,
  focusId,
}: {
  filter: PlaceFilter;
  hasFit: boolean;
  /** 시각 문구와 최근순 이름 — 저장한 곳은 저장, 폴더는 넣은 시각 */
  timeKey: "saved" | "added";
  numbered?: boolean;
  selection?: { ids: Set<string>; onToggle: (id: string) => void; onToggleAll: () => void };
  focusId?: string | null;
}) {
  const t = useTranslations("savedFolders");
  const { counts, district, setDistrict, sort, setSort, visible } = filter;
  const allOn = visible.length > 0 && visible.every((r) => selection?.ids.has(r.place.contentId));

  return (
    <>
      {counts.length > 1 && (
        <div role="group" aria-label={t("filterLabel")} className="-mx-5 flex gap-2 overflow-x-auto px-5 pt-1 pb-3 [scrollbar-width:none]">
          <Chip label={t("filterAll")} on={district === ALL_DISTRICTS} onClick={() => setDistrict(ALL_DISTRICTS)} />
          {counts.map(([name]) => (
            <Chip key={name} label={name} on={district === name} onClick={() => setDistrict(name)} />
          ))}
        </div>
      )}

      <div className="mb-1 flex h-11 items-center justify-between gap-1">
        {selection ? (
          <button
            type="button"
            role="checkbox"
            aria-checked={allOn}
            onClick={selection.onToggleAll}
            className="ds-body-2 flex min-h-11 items-center gap-3"
          >
            <CheckBox on={allOn} />
            {t("selectAll")}
          </button>
        ) : (
          <span className="ds-body-2 text-sub">{t("count", { count: visible.length })}</span>
        )}
        <select
          aria-label={t("sortLabel")}
          value={sort}
          onChange={(e) => setSort(e.target.value as FolderSortKey)}
          className="ds-body-2 min-h-11 max-w-46 bg-page py-1 pl-2"
        >
          <option value="recent">{t(`sort.${timeKey}`)}</option>
          <option value="fit" disabled={!hasFit}>{t("sort.fit")}</option>
        </select>
      </div>

      {visible.map((row, i) => (
        <PlaceRow
          key={row.place.contentId}
          row={row}
          number={numbered ? i + 1 : undefined}
          focused={focusId === row.place.contentId}
          showFit={sort === "fit"}
          timeKey={timeKey}
          selected={selection?.ids.has(row.place.contentId)}
          onToggle={selection ? () => selection.onToggle(row.place.contentId) : undefined}
        />
      ))}
    </>
  );
}

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`ds-body-2 min-h-11 min-w-11 shrink-0 rounded-full px-4 whitespace-nowrap ${
        on ? "bg-ink text-white" : "bg-surface text-ink"
      }`}
    >
      {label}
    </button>
  );
}

function PlaceRow({
  row,
  number,
  focused,
  showFit,
  timeKey,
  selected,
  onToggle,
}: {
  row: SavedRow;
  number?: number;
  focused: boolean;
  showFit: boolean;
  timeKey: "saved" | "added";
  selected?: boolean;
  onToggle?: () => void;
}) {
  const en = useLocale() === "en";
  const t = useTranslations("savedFolders");
  const tSaved = useTranslations("saved");
  const tPlace = useTranslations("place");
  const { place, district, at, fit } = row;

  const band = fitBand(fit);
  const note = showFit
    ? band && tPlace(`fit.${band}`)
    : formatSavedAt(at, new Date(), (k, v) => (timeKey === "saved" ? tSaved(k, v) : t(`addedAt.${k.split(".")[1]}`, v)));

  const body = (
    <>
      {onToggle && <CheckBox on={Boolean(selected)} />}
      <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl bg-surface text-sub ${onToggle ? "h-17 w-14" : "h-20 w-18"}`}>
        {place.firstImage ? (
          <Image src={secureImageUrl(place.firstImage)} alt="" fill sizes="72px" className="object-cover" />
        ) : (
          <ImageIcon size={24} strokeWidth={1.2} aria-hidden />
        )}
        {number !== undefined && (
          <span className={`ds-caption absolute top-1 left-1 grid size-6 place-items-center rounded-full ${focused ? "bg-ink text-white" : "bg-page text-ink"}`}>
            {number}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="ds-title-2 block break-words">{en ? place.titleEn ?? place.title : place.title}</span>
        <span className="ds-body-2 mt-1 block truncate text-sub">{en ? place.whyEn : place.whyKo}</span>
        <span className="ds-caption mt-2 flex flex-wrap items-center gap-2 text-sub">
          {district && <span>{district}</span>}
          {district && note && <span aria-hidden className="h-2 w-px bg-line" />}
          {note && <span className={showFit ? "text-ink" : undefined}>{note}</span>}
        </span>
      </span>
    </>
  );

  const className = "flex min-h-26 w-full scroll-mt-56 items-center gap-3 py-3 text-left";

  return onToggle ? (
    <button type="button" role="checkbox" aria-checked={Boolean(selected)} onClick={onToggle} className={className}>
      {body}
    </button>
  ) : (
    <Link id={`place-${place.contentId}`} href={`/place/${place.contentId}`} className={`${className} transition-opacity active:opacity-70`}>
      {body}
      <ChevronRight size={16} className="shrink-0 text-sub" aria-hidden />
    </Link>
  );
}
