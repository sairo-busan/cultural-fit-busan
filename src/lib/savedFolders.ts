import { cf8FitScoreFromCode } from "@/lib/cf8Match";
import { districtLabel, districtLabelEn } from "@/lib/placeDisplay";
import type { SavedFolder, SavedPlace } from "@/lib/storage";
import type { RecommendedPlace } from "@/types/place";

export const ALL_DISTRICTS = "__all__";

export type FolderSortKey = "recent" | "fit";

export type SavedRow = {
  place: RecommendedPlace;
  /** 저장한 곳에서는 저장 시각, 폴더에서는 넣은 시각 */
  at: string;
  fit: number | null;
  district: string | null;
};

export type RowOptions = { en: boolean; cf8Code: string | null };

export type FolderSummary = {
  folder: SavedFolder;
  count: number;
  cover: string | null;
};

function toRow(place: RecommendedPlace, at: string, { en, cf8Code }: RowOptions): SavedRow {
  return {
    place,
    at,
    fit: cf8Code ? cf8FitScoreFromCode(cf8Code, place) : null,
    district: en ? districtLabelEn(place.addr1) : districtLabel(place.addr1),
  };
}

/** 카탈로그에 없는 곳은 그릴 정보가 없어 뺀다 */
export function savedRows(
  saved: SavedPlace[],
  catalog: Map<string, RecommendedPlace>,
  options: RowOptions,
): SavedRow[] {
  return saved.flatMap((s) => {
    const place = catalog.get(s.id);
    return place ? [toRow(place, s.savedAt, options)] : [];
  });
}

/** 지금 저장돼 있는 곳만, 최근 넣은 순 */
export function folderRows(
  folder: SavedFolder,
  saved: SavedPlace[],
  catalog: Map<string, RecommendedPlace>,
  options: RowOptions,
): SavedRow[] {
  const savedIds = new Set(saved.map((s) => s.id));

  return folder.places
    .flatMap((p) => {
      const place = savedIds.has(p.id) ? catalog.get(p.id) : undefined;
      return place ? [toRow(place, p.addedAt, options)] : [];
    })
    .sort((a, b) => b.at.localeCompare(a.at));
}

/** 표지는 최근 넣은 곳 중 사진이 있는 첫 곳. 최근에 장소를 넣거나 만든 폴더가 앞 */
export function folderSummaries(
  folders: SavedFolder[],
  saved: SavedPlace[],
  catalog: Map<string, RecommendedPlace>,
  options: RowOptions,
): FolderSummary[] {
  return folders
    .map((folder) => {
      const rows = folderRows(folder, saved, catalog, options);
      const latest = rows[0]?.at ?? "";
      return {
        summary: {
          folder,
          count: rows.length,
          cover: rows.find((r) => r.place.firstImage)?.place.firstImage ?? null,
        },
        activeAt: latest > folder.createdAt ? latest : folder.createdAt,
      };
    })
    .sort((a, b) => b.activeAt.localeCompare(a.activeAt))
    .map((x) => x.summary);
}

/** 있는 지역만. 많은 순, 같으면 이름순 */
export function districtCounts(rows: SavedRow[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (r.district) counts.set(r.district, (counts.get(r.district) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/** 고른 지역의 장소가 모두 빠지면 전체로 돌아간다 */
export function activeDistrict(selected: string, counts: [string, number][]): string {
  return counts.some(([name]) => name === selected) ? selected : ALL_DISTRICTS;
}

/** 적합도가 없는 곳은 0 이 아니라 맨 아래 — 0 은 "안 맞음" 으로 읽힌다 */
export function visibleRows(rows: SavedRow[], district: string, sort: FolderSortKey): SavedRow[] {
  const filtered = district === ALL_DISTRICTS ? rows : rows.filter((r) => r.district === district);
  return sort === "fit"
    ? [...filtered].sort((a, b) => (b.fit ?? -1) - (a.fit ?? -1))
    : filtered;
}

export type FolderPin = { x: number; y: number; on: boolean; label: string; n: number; plain: true };

/** 번호는 지금 보이는 목록의 순서. 좌표가 없는 곳은 핀만 빠지고 번호는 행과 같게 둔다 */
export function folderPins(rows: SavedRow[]): FolderPin[] {
  return rows.flatMap((r, i) => {
    const { mapX: x, mapY: y, title: label } = r.place;
    return x === null || y === null ? [] : [{ x, y, on: true, label, n: i + 1, plain: true as const }];
  });
}
