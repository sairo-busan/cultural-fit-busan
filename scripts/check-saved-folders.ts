/**
 * storage.ts 의 저장 폴더 함수와 savedFolders.ts 확인.
 *
 * 실행: node --import tsx scripts/check-saved-folders.ts
 */
import assert from "node:assert/strict";
import {
  ALL_DISTRICTS,
  activeDistrict,
  districtCounts,
  folderPins,
  folderRows,
  folderSummaries,
  savedRows,
  visibleRows,
} from "../src/lib/savedFolders";
import {
  FOLDER_NAME_MAX,
  STORAGE_KEYS,
  addPlacesToFolder,
  createSavedFolder,
  deleteSavedFolder,
  folderNameError,
  readSavedFolders,
  readSavedPlaces,
  removePlacesFromFolder,
  renameSavedFolder,
  toggleSaved,
} from "../src/lib/storage";
import type { RecommendedPlace } from "../src/types/place";

const store = new Map<string, string>();
Object.assign(globalThis, {
  window: {},
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  },
});

const at = (d: number) => new Date(Date.UTC(2026, 10, d));
const only = (name: string) => readSavedFolders().find((f) => f.name === name)!;
const ids = (name: string) => only(name).places.map((p) => p.id);

// 이름 규칙
assert.equal(createSavedFolder("   "), null);
assert.equal(folderNameError(""), "empty");
const parents = createSavedFolder("  부모님 여행 ", at(1))!;
assert.equal(parents.name, "부모님 여행");
assert.equal(createSavedFolder("부모님 여행"), null);
assert.equal(folderNameError("부모님 여행"), "duplicate");
assert.equal(folderNameError("부모님 여행", parents.id), null);
assert.equal(createSavedFolder("가".repeat(FOLDER_NAME_MAX + 5), at(1))!.name.length, FOLDER_NAME_MAX);
createSavedFolder("Market", at(1));
assert.equal(folderNameError("market"), "duplicate");

// 이름 바꾸기
const market = only("Market");
assert.equal(renameSavedFolder(market.id, "부모님 여행"), false);
assert.equal(only("Market").id, market.id);
assert.equal(renameSavedFolder(market.id, "시장 구경"), true);

// 넣기 · 중복 · 여러 폴더
addPlacesToFolder(parents.id, ["a", "b", "b"], at(2));
assert.deepEqual(ids("부모님 여행"), ["a", "b"]);
addPlacesToFolder(parents.id, ["a", "c"], at(3));
assert.deepEqual(ids("부모님 여행"), ["a", "b", "c"]);
assert.equal(only("부모님 여행").places[0].addedAt, at(2).toISOString());
addPlacesToFolder(market.id, ["a"], at(3));
assert.deepEqual(ids("시장 구경"), ["a"]);

// 폴더 작업은 저장한 곳을 바꾸지 않는다
toggleSaved("a", at(1));
toggleSaved("b", at(1));
toggleSaved("c", at(2));
const savedBefore = store.get(STORAGE_KEYS.saved);
removePlacesFromFolder(parents.id, ["b"]);
assert.deepEqual(ids("부모님 여행"), ["a", "c"]);
assert.deepEqual(ids("시장 구경"), ["a"]);
addPlacesToFolder(parents.id, ["b"], at(4));
const scratch = createSavedFolder("지울 폴더", at(1))!;
deleteSavedFolder(scratch.id);
assert.equal(readSavedFolders().some((f) => f.id === scratch.id), false);
assert.equal(store.get(STORAGE_KEYS.saved), savedBefore);

// 파생
const place = (contentId: string, addr1: string, firstImage: string | null) =>
  ({ contentId, addr1, firstImage }) as RecommendedPlace;
const catalog = new Map([
  ["a", place("a", "부산광역시 해운대구 동백로 99", "a.jpg")],
  ["b", place("b", "부산광역시 해운대구 중동1로 42", null)],
  ["c", place("c", "부산광역시 기장군 기장읍 용궁길 86", "c.jpg")],
]);
const opts = { en: false, cf8Code: null };

// 부모님 여행: a(2일) · c(3일) · b(4일). b 는 사진이 없어 표지는 c
const summaries = () => folderSummaries(readSavedFolders(), readSavedPlaces(), catalog, opts);
const parentsSummary = () => summaries().find((s) => s.folder.id === parents.id)!;
let rows = folderRows(only("부모님 여행"), readSavedPlaces(), catalog, opts);
assert.deepEqual(rows.map((r) => r.place.contentId), ["b", "c", "a"]);
assert.equal(parentsSummary().count, 3);
assert.equal(parentsSummary().cover, "c.jpg");
assert.equal(summaries()[0].folder.id, parents.id);
assert.equal(summaries().at(-1)!.count, 0);

// 지역 칩 · 정렬
assert.deepEqual(districtCounts(rows), [["해운대", 2], ["기장", 1]]);
assert.deepEqual(visibleRows(rows, "기장", "recent").map((r) => r.place.contentId), ["c"]);
assert.equal(visibleRows(rows, ALL_DISTRICTS, "recent").length, 3);
assert.deepEqual(
  visibleRows(
    [
      { ...rows[0], fit: null },
      { ...rows[1], fit: 40 },
      { ...rows[2], fit: 90 },
    ],
    ALL_DISTRICTS,
    "fit",
  ).map((r) => r.fit),
  [90, 40, null],
);
assert.equal(activeDistrict("기장", districtCounts(rows)), "기장");
assert.equal(activeDistrict("수영", districtCounts(rows)), ALL_DISTRICTS);

// 저장 해제 → 폴더 · 개수 · 전체에서 빠지고, 폴더 기록은 남아 다시 저장하면 돌아온다
toggleSaved("c");
rows = folderRows(only("부모님 여행"), readSavedPlaces(), catalog, opts);
assert.deepEqual(rows.map((r) => r.place.contentId), ["b", "a"]);
assert.equal(parentsSummary().count, 2);
assert.equal(savedRows(readSavedPlaces(), catalog, opts).length, 2);
assert.equal(activeDistrict("기장", districtCounts(rows)), ALL_DISTRICTS);
assert.equal(parentsSummary().cover, "a.jpg");
assert.ok(ids("부모님 여행").includes("c"));
toggleSaved("c", at(5));
assert.equal(parentsSummary().count, 3);

// 카탈로그에 없는 곳
toggleSaved("gone", at(6));
addPlacesToFolder(parents.id, ["gone"], at(6));
assert.equal(parentsSummary().count, 3);
assert.equal(savedRows(readSavedPlaces(), catalog, opts).length, 3);

// 영문 지역
assert.equal(savedRows(readSavedPlaces(), catalog, { en: true, cf8Code: null })[0].district !== null, true);

// 지도 핀 — 좌표 없는 곳은 빠지고 번호는 행과 같다
const pinRows = [
  { place: { title: "가", mapX: 129.1, mapY: 35.1 } },
  { place: { title: "나", mapX: null, mapY: null } },
  { place: { title: "다", mapX: 129.2, mapY: 35.2 } },
] as unknown as Parameters<typeof folderPins>[0];
assert.deepEqual(folderPins(pinRows).map((p) => [p.n, p.label]), [[1, "가"], [3, "다"]]);

// 깨진 저장값
for (const broken of ["{", "null", '{"a":1}', "[1,{\"id\":\"x\"}]"]) {
  store.set(STORAGE_KEYS.savedFolders, broken);
  assert.deepEqual(readSavedFolders(), []);
}
store.set(
  STORAGE_KEYS.savedFolders,
  JSON.stringify([{ id: "x", name: "n", createdAt: "c", places: [{ id: "p", addedAt: "t" }, 3, { id: "q" }] }]),
);
assert.deepEqual(readSavedFolders()[0].places, [{ id: "p", addedAt: "t" }]);

console.log("check-saved-folders 통과");
