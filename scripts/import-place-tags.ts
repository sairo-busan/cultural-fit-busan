/**
 * placeTags 62곳 적재 스크립트 (BE-FEAT-007).
 * 정본 구글시트("[최] SAIRO 통합본", gid=350815285) CSV export를 직접 fetch해서
 * placeTags 컬렉션에 upsert한다. content_id 없는 13건(SAIRO 자체 큐레이션)은 스킵 —
 * places 컬렉션에 대응 문서가 없어 조인 불가(후속 티켓).
 *
 * 실행: node --env-file=.env.local --import tsx scripts/import-place-tags.ts
 */

import { MongoClient } from "mongodb";

const SHEET_ID = "1-6usA2CWMCKvUWf53SJRWwzkuvRBmwpE_H958bWAGWE";
const GID = "350815285";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

/** RFC4180 최소 구현 — 따옴표 안 콤마·개행 처리 (외부 의존성 추가 안 함) */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length > 1 || r[0] !== "");
}

function toNum(v: string | undefined): number | null {
  if (!v || v.trim() === "") return null;
  const n = Number(v.trim());
  return Number.isNaN(n) ? null : n;
}

function toStr(v: string | undefined): string | null {
  if (!v || v.trim() === "") return null;
  return v.trim();
}

function toBool(v: string | undefined): boolean | null {
  if (!v || v.trim() === "") return null;
  const t = v.trim().toUpperCase();
  if (t === "TRUE") return true;
  if (t === "FALSE") return false;
  return null;
}

async function main() {
  console.log("정본 시트 CSV fetch 중...");
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`시트 fetch 실패: ${res.status}`);
  const csvText = await res.text();

  const rows = parseCsv(csvText);
  const header = rows[0];
  const dataRows = rows.slice(1);
  console.log(`전체 ${dataRows.length}행, 컬럼 ${header.length}개`);

  const col = (row: string[], name: string) => row[header.indexOf(name)];

  const docs = dataRows
    .filter((row) => toStr(col(row, "content_id")))
    .map((row) => {
      const contentId = toStr(col(row, "content_id"))!;
      const altIds = [toStr(col(row, "alt_id_1")), toStr(col(row, "alt_id_2"))].filter(
        (v): v is string => v !== null
      );

      return {
        contentId,
        noiseLevel: toNum(col(row, "noise_level")),
        crowdLevel: toNum(col(row, "crowd_level")),
        crowdPeak: toStr(col(row, "crowd_peak")),
        crowdCalm: toStr(col(row, "crowd_calm")),
        localDepth: toNum(col(row, "local_depth")),
        englishSupport: toNum(col(row, "english_support")),
        spiceLevel: toNum(col(row, "spice_level")),
        weatherType: toStr(col(row, "weather_type")) as "indoor" | "outdoor" | "mixed" | null,
        bestTime: toStr(col(row, "best_time")),
        placeType: null, // 정본 시트에 없음(구 스키마 필드, category와 값 불일치라 매핑 보류)
        fitSolo: toNum(col(row, "fit_solo")),
        tipType: toStr(col(row, "tip_type")),
        tipHeadline: toStr(col(row, "tip_headline_ko")),
        pro: toStr(col(row, "pro_ko")),
        con: toStr(col(row, "con_ko")),
        whyKo: toStr(col(row, "why_ko")),
        whyEn: toStr(col(row, "why_en")),
        coverage: toNum(col(row, "coverage")) ?? 0,

        cf8Match: toStr(col(row, "cfp_match")),
        hasRaw: toBool(col(row, "has_raw")),
        hasMeatOnly: toBool(col(row, "has_meat_only")),
        hasSeafoodOnly: toBool(col(row, "has_seafood_only")),
        seatingType: toStr(col(row, "seating_type")) as "street" | "indoor" | "mixed" | null,
        fitCouple: toNum(col(row, "fit_couple")),
        fitFriends: toNum(col(row, "fit_friends")),
        fitFamily: toNum(col(row, "fit_family")),
        stayMinutes: toNum(col(row, "stay_minutes")),
        budgetLevel: toNum(col(row, "budget_level")),
        proEn: toStr(col(row, "pro_en")),
        conEn: toStr(col(row, "con_en")),
        infoKo: toStr(col(row, "info_ko")),
        infoEn: toStr(col(row, "info_en")),
        sourceUrl: toStr(col(row, "source_url")),
        taggedStatus: toStr(col(row, "status")) as "review" | "done" | null,
        alternativeIds: altIds,
      };
    });

  console.log(`content_id 있는 ${docs.length}건 적재 대상 (전체 ${dataRows.length}행 중 ${dataRows.length - docs.length}건은 SAIRO 큐레이션 — 스킵)`);

  const client = new MongoClient(mongoUri!);
  await client.connect();
  const placeTags = client.db("cultural_fit_busan").collection("placeTags");

  let upserted = 0;
  for (const doc of docs) {
    const { contentId, ...rest } = doc;
    await placeTags.updateOne({ contentId }, { $set: rest }, { upsert: true });
    upserted++;
  }

  console.log(`완료: ${upserted}건 upsert`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
