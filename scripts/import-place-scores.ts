/**
 * 11_장소점수_62 (gid=274894934) 적재 스크립트.
 * CF8 3축(cf_atmosphere/cf_local_famous/cf_deep_variety)과 코스역할 7종을
 * content_id로 placeTags에 병합한다. 92_V5상세태깅60(56컬럼)과 별개 탭이지만
 * 같은 content_id로 조인되므로 새 문서를 만들지 않고 기존 placeTags 문서에 $set.
 *
 * 반려동물/휠체어/유아차/계단대체는 이 탭에서도 전부 UNKNOWN이라 적재 안 함
 * (docs/구글시트_데이터_감사.md §3 참고).
 *
 * 날것/육류만/해산물중심은 92번의 has_raw/has_meat_only/has_seafood_only와
 * 이름은 같지만 이 탭에서 별도로 재계산한 값 — 값을 덮어쓰지 않고 불일치만 로그로
 * 보고한다(docs/구글시트_데이터_감사.md §3 "값 일치 여부 미확인" 참고).
 *
 * 실행: node --env-file=.env.local --import tsx scripts/import-place-scores.ts
 */

import { MongoClient } from "mongodb";

const SHEET_ID = "1-6usA2CWMCKvUWf53SJRWwzkuvRBmwpE_H958bWAGWE";
const GID = "274894934";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

/** RFC4180 최소 구현 — 따옴표 안 콤마·개행 처리 (import-place-tags.ts와 동일) */
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
  if (!v || v.trim() === "" || v.trim() === "UNKNOWN") return null;
  const n = Number(v.trim());
  return Number.isNaN(n) ? null : n;
}

function toTriState(v: string | undefined): boolean | null {
  if (!v || v.trim() === "" || v.trim() === "UNKNOWN") return null;
  const t = v.trim().toUpperCase();
  if (t === "TRUE") return true;
  if (t === "FALSE") return false;
  return null;
}

async function main() {
  console.log("11_장소점수_62 CSV fetch 중...");
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`시트 fetch 실패: ${res.status}`);
  const csvText = await res.text();

  const rows = parseCsv(csvText);
  const header = rows[0];
  const dataRows = rows.slice(1);
  console.log(`전체 ${dataRows.length}행, 컬럼 ${header.length}개`);

  const col = (row: string[], name: string) => row[header.indexOf(name)];

  const client = new MongoClient(mongoUri!);
  await client.connect();
  const placeTags = client.db("cultural_fit_busan").collection("placeTags");

  let updated = 0;
  let notFound = 0;
  const foodMismatches: string[] = [];

  for (const row of dataRows) {
    const contentId = col(row, "content_id")?.trim();
    if (!contentId) continue;

    const scores = {
      cfAtmosphereScore: toNum(col(row, "분위기축(-2~2)")),
      cfLocalFamousScore: toNum(col(row, "로컬↔대표축(-2~2)")),
      cfDeepVarietyScore: toNum(col(row, "깊게↔다양축(-2~2)")),
      photoMemoryValue: toNum(col(row, "사진·기억(0~100)")),
      culturalValue: toNum(col(row, "문화(0~100)")),
      natureValue: toNum(col(row, "자연(0~100)")),
      foodValue: toNum(col(row, "음식(0~100)")),
      walkingRequired: toNum(col(row, "걷기필요(0~100)")),
      restAvailability: toNum(col(row, "휴식가능(0~100)")),
      indoorShelter: toNum(col(row, "실내차양(0~100)")),
    };

    const existing = await placeTags.findOne({ contentId });
    if (!existing) {
      notFound++;
      continue;
    }

    // 날것/육류만/해산물중심 — 덮어쓰지 않고 불일치만 보고
    const sheetHasRaw = toTriState(col(row, "날것"));
    const sheetHasMeatOnly = toTriState(col(row, "육류만"));
    const sheetHasSeafoodOnly = toTriState(col(row, "해산물중심"));
    if (
      sheetHasRaw !== existing.hasRaw ||
      sheetHasMeatOnly !== existing.hasMeatOnly ||
      sheetHasSeafoodOnly !== existing.hasSeafoodOnly
    ) {
      foodMismatches.push(
        `${contentId}(${col(row, "장소명")}): 92번=[${existing.hasRaw},${existing.hasMeatOnly},${existing.hasSeafoodOnly}] vs 11번=[${sheetHasRaw},${sheetHasMeatOnly},${sheetHasSeafoodOnly}]`
      );
    }

    await placeTags.updateOne({ contentId }, { $set: scores });
    updated++;
  }

  console.log(`\n적재 완료: ${updated}건 업데이트, ${notFound}건 매칭 실패(92번에 없는 content_id)`);
  console.log(`\n날것/육류만/해산물중심 불일치 ${foodMismatches.length}건:`);
  foodMismatches.forEach((m) => console.log(`  ${m}`));

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
