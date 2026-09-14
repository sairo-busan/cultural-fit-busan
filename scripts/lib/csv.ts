/**
 * 구글시트 CSV export 공용 파서. import-place-tags.ts/import-place-scores.ts에
 * 각각 있던 동일 구현을 여기로 합쳤다 — DB_01/02/03 임포트 스크립트 3개가 같이 쓴다.
 */

import fs from "node:fs";

/** RFC4180 최소 구현 — 따옴표 안 콤마·개행 처리 */
export function parseCsv(text: string): string[][] {
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

/**
 * Node에서 이 export URL을 직접 부르면(`fetch()`든 `child_process`로 부른 `curl`이든)
 * 구글 백엔드가 최근 수정분이 반영 안 된 스냅샷을 주는 게 재현됨 — 터미널에서 직접
 * `curl`로 받으면 매번 정상. 원인 특정 못 함(백엔드 샤드 라우팅 추정), Node 프로세스
 * 안에서는 못 우회해서 아예 안 부른다.
 *
 * 대신 미리 받아둔 로컬 CSV 파일을 읽는다. 최신 시트를 받으려면 임포트 전에
 * 터미널에서 직접:
 *   curl -sL "https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={GID}" -o docs/_internal/scratch/DB0N.csv
 */
export function readSheetCsvFile(path: string): string[][] {
  const text = fs.readFileSync(path, "utf-8");
  if (!text || text.length < 10) throw new Error(`CSV 파일이 비어 있음: ${path}`);
  return parseCsv(text);
}

/** 헤더 이름으로 컬럼 값을 찾는 헬퍼를 만든다. 후보 이름 중 처음 매칭되는 것을 쓴다. */
export function makeColumnReader(header: string[]) {
  return (row: string[], ...candidates: string[]): string | undefined => {
    for (const name of candidates) {
      const idx = header.indexOf(name);
      if (idx !== -1) return row[idx];
    }
    return undefined;
  };
}

export function toNum(v: string | undefined): number | null {
  if (!v || v.trim() === "" || v.trim() === "UNKNOWN") return null;
  const n = Number(v.trim());
  return Number.isNaN(n) ? null : n;
}

export function toTriState(v: string | undefined): boolean | null {
  if (!v || v.trim() === "") return null;
  const t = v.trim().toUpperCase();
  if (t === "TRUE" || t === "Y" || t === "YES") return true;
  if (t === "FALSE" || t === "N" || t === "NO") return false;
  return null; // UNKNOWN 포함
}

export function toStr(v: string | undefined): string | null {
  const t = v?.trim();
  return t ? t : null;
}
