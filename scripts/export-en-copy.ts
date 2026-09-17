/**
 * 영문 초안 대조표(docs/영문초안_대조표.md)를 코드에서 만든다.
 *
 * 화면 문구가 바뀌어도 표가 안 바뀌어 옛 문구를 검토받는 일이 있었다(#26 · #33).
 * 표를 손으로 고치지 않고 코드를 고친 뒤 이 스크립트를 다시 돌린다.
 *
 * `확인` 칸의 🆕 — 이전 표에 없던 한국어·영문 짝, 또는 이전 표에서 이미 🆕 였던 줄.
 * 검토를 반영한 뒤에는 `--reviewed` 로 돌려 표시를 지운다.
 *
 * 실행: npx tsx scripts/export-en-copy.ts [--reviewed]
 */

import fs from "node:fs";
import path from "node:path";
import koMessages from "../messages/ko.json";
import enMessages from "../messages/en.json";
import { QUIZ_TEXT } from "../src/data/quiz";
import { CF8_PROFILES } from "../src/data/cf8Profiles";
import { TRIP_QUESTIONS } from "../src/data/tripSetup";
import { TRIP_QUESTION_TEXT_EN } from "../src/data/tripSetupEn";

const OUT = path.join(__dirname, "..", "docs", "영문초안_대조표.md");
const REVIEWED = process.argv.includes("--reviewed");

type Row = { key: string; ko: string | undefined; en: string };
type Json = { [k: string]: string | Json };

function flatten(ko: Json | undefined, en: Json, prefix = ""): Row[] {
  return Object.entries(en).flatMap(([k, v]) => {
    const key = prefix + k;
    const koV = ko?.[k];
    return typeof v === "string"
      ? [{ key, ko: typeof koV === "string" ? koV : undefined, en: v }]
      : flatten(typeof koV === "object" ? koV : undefined, v, key + ".");
  });
}

// ── 이전 표 — 🆕 판정용 ─────────────────────────────────
const cell = (s: string) => s.replace(/<br>/g, "\n").replace(/\\\|/g, "|").trim();
const pairOf = (ko: string | undefined, en: string) => `${ko ?? ""}\n${en}`;
const before = new Map<string, boolean>(); // 짝 → 이미 🆕 였나
if (fs.existsSync(OUT)) {
  for (const line of fs.readFileSync(OUT, "utf8").split("\n")) {
    const cols = line.match(/^\| `.+?` \|(.*)\|\s*$/)?.[1].split(/(?<!\\)\|/);
    if (!cols || cols.length < 2) continue;
    before.set(pairOf(cell(cols[0]), cell(cols[1])), (cols[2] ?? "").includes("🆕"));
  }
}

let flagged = 0;
const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
function table(rows: Row[]): string {
  const lines = ["| 키 | 한국어 | 영어 | 확인 |", "|---|---|---|---|"];
  for (const r of rows) {
    const p = pairOf(r.ko, r.en);
    const isNew = !REVIEWED && (!before.has(p) || before.get(p) === true);
    if (isNew) flagged++;
    lines.push(`| \`${r.key}\` | ${r.ko ? esc(r.ko) : "—"} | ${esc(r.en)} | ${isNew ? "🆕" : ""} |`);
  }
  return lines.join("\n");
}

const ko = koMessages as unknown as Json;
const en = enMessages as unknown as Json;
const msg = (ns: string) => flatten(ko[ns] as Json, en[ns] as Json);

// ── 구간 ─────────────────────────────────────────────
const out: string[] = [
  "# 영문 초안 대조표",
  "",
  "> `npx tsx scripts/export-en-copy.ts` 로 코드에서 만든 표입니다. 이 파일을 직접 고치지 말고, 코드를 고친 뒤 다시 실행하세요.",
  "",
  "앱 화면에 나오는 영문을 한국어와 나란히 모았습니다. **전부 초안(DRAFT)** 입니다.",
  "",
  "- **확인** 칸의 🆕 는 검토받지 않은 문구입니다 — 새로 생겼거나 바뀐 문구예요",
  "- 장소마다 다른 영문(장소명 · 설명 · 문화 가이드)은 시트 DB_02 에 있어 이 표에 없습니다",
  "- 개인정보처리방침 본문은 법적 문서라 이 표에 없습니다",
  "",
  "어색한 곳을 알려주시면 반영하겠습니다.",
];
const section = (title: string, note: string, body: string) => out.push("", `## ${title}`, "", note, "", body);
const used = new Set<string>();
const ns = (name: string) => (used.add(name), msg(name));

section("S00 랜딩", "`messages` `landing`", table(ns("landing")));

section("S01 취향 진단 — 화면 문구", "`messages` `onboarding`", table(ns("onboarding")));
section(
  "S01 취향 진단 — 문항",
  "`src/data/quiz.ts` — `choices.0` 이 왼쪽, `choices.1` 이 오른쪽",
  table(flatten(QUIZ_TEXT.ko as unknown as Json, QUIZ_TEXT.en as unknown as Json))
);

section("S02 결과", "`messages` `profile`", table(ns("profile")));

out.push("", "## CF8 8유형", "", "`src/data/cf8Profiles.ts` — 유형명은 `src/lib/cfp.ts` 에도 같은 값이 있어 함께 고친다");
for (const code of Object.keys(CF8_PROFILES.en) as (keyof typeof CF8_PROFILES.en)[]) {
  out.push("", `### ${code} · ${CF8_PROFILES.ko[code].profileName}`, "");
  out.push(table(flatten(CF8_PROFILES.ko[code] as unknown as Json, CF8_PROFILES.en[code] as unknown as Json)));
}

const tripRows: Row[] = TRIP_QUESTIONS.flatMap((q) => {
  const t = TRIP_QUESTION_TEXT_EN[q.id];
  if (!t) return [];
  const rows: Row[] = [{ key: `${q.id}.title`, ko: q.title, en: t.title }];
  if (t.helperText) rows.push({ key: `${q.id}.helperText`, ko: q.helperText, en: t.helperText });
  for (const o of q.options) {
    const e = t.options[o.value];
    if (!e) continue;
    rows.push({ key: `${q.id}.${o.value}.label`, ko: o.label, en: e.label });
    if (e.description) rows.push({ key: `${q.id}.${o.value}.description`, ko: o.description, en: e.description });
  }
  for (const tg of q.toggles ?? []) {
    const e = t.toggles?.[tg.key];
    if (!e) continue;
    rows.push({ key: `${q.id}.${tg.key}.label`, ko: tg.option.label, en: e.label });
    if (e.description) rows.push({ key: `${q.id}.${tg.key}.description`, ko: tg.option.description, en: e.description });
  }
  return rows;
});
section("S03 조건 입력 — 화면 문구", "`messages` `tripSetup`", table(ns("tripSetup")));
section("S03 조건 입력 — 문항", "`src/data/tripSetupEn.ts` (한국어는 `src/data/tripSetup.ts`)", table(tripRows));

section("S10 추천", "`messages` `feed`", table(ns("feed")));
section("장소 카드 · 공통", "`messages` `place` — S10 카드 · 저장 탭 행 · 상세가 같이 쓴다", table(ns("place")));
section("S20 장소 상세", "`messages` `placeDetail`", table(ns("placeDetail")));
section("저장 탭", "`messages` `saved`", table(ns("saved")));
section("내 정보", "`messages` `me`", table(ns("me")));
section("하단 탭", "`messages` `nav`", table(ns("nav")));

// 위에 배치하지 않은 namespace 가 생기면 빠뜨리지 않고 끝에 붙인다
for (const name of Object.keys(en).filter((n) => !used.has(n))) section(`기타 — ${name}`, `\`messages\` \`${name}\``, table(msg(name)));

fs.writeFileSync(OUT, out.join("\n") + "\n");
console.log(`대조표 저장 — 🆕 ${flagged}줄`);
