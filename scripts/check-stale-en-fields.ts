/**
 * places 주간 재적재 후 LLM 번역 영문 필드의 원본(한국어)이 바뀌었는지 확인.
 *
 * TourAPI 영문 서비스(EngService2)가 있는 71곳의 hoursEn/closedDaysEn/addrEn은
 * ingest-eng-*.ts가 매번 TourAPI에서 직접 받아오므로 항상 최신이다 — 이 스크립트
 * 대상이 아니다.
 *
 * 대상은 TourAPI에 영문판 자체가 없어 **LLM이 직접 번역한 3개 필드**뿐이다:
 *   - places.hoursEnManual / closedDaysEnManual (49곳, operationInfo 기반)
 *   - place_info.accessibilityInfoEn (43곳, places.accessibilityInfo 기반)
 * 번역 당시의 한국어 원문을 `*SourceKo` 필드에 같이 저장해두고, 재적재 후
 * 그 스냅샷과 현재 값을 비교한다. 달라졌으면 번역 필드를 null로 내려
 * placeDetail.ts가 한국어로 안전하게 폴백하게 하고, 재번역이 필요하다는
 * GitHub 이슈를 남긴다(제목 고정 — 기존 이슈 있으면 코멘트만 추가, 중복 생성 안 함).
 *
 * 워크플로우에서 ingest-places.ts 다음 순서로 실행한다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/check-stale-en-fields.ts
 */

import { execFileSync } from "node:child_process";
import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

const ISSUE_TITLE = "[자동] 영문 번역 원문 변경 감지 — 재번역 필요";

const HOURS_KEYS = ["usetime", "usetimeculture", "opentime", "usetimeleports"];
const CLOSED_KEYS = ["restdate", "restdateculture", "restdateshopping", "restdateleports"];

/** placeDetail.ts의 pickOperationValue와 같은 로직 — 이 스크립트는 Next 앱 코드를
 * import하지 않는 독립 실행 스크립트라 작게 복제해둔다(다른 ingest 스크립트도 같은 원칙). */
function pickOperationValue(info: Record<string, string> | undefined, keys: string[]): string | null {
  if (!info) return null;
  for (const key of keys) {
    const raw = info[key];
    if (raw && raw.trim() !== "") return raw.replace(/<br\s*\/?>/gi, "\n").trim();
  }
  return null;
}

type Flag = { placeId: string; title: string; field: string };

type ScoreBoardRow = { placeId: string; contentId: string };
type PlaceWithManualHours = {
  _id: string;
  title: string;
  operationInfo?: Record<string, string>;
  hoursEnManual?: string | null;
  hoursEnManualSourceKo?: string | null;
  closedDaysEnManual?: string | null;
  closedDaysEnManualSourceKo?: string | null;
};
type PlaceInfoWithAccessEn = {
  placeId: string;
  accessibilityInfoEn?: Record<string, string> | null;
  accessibilityInfoSourceKo?: string | null;
};

async function main() {
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const db = client.db("cultural_fit_busan");

  const flags: Flag[] = [];

  // ── hours/closedDays (score_board.contentId로 places 역참조) ──────────────
  const scoreBoardDocs = await db
    .collection<ScoreBoardRow>("score_board")
    .find({}, { projection: { _id: 0, placeId: 1, contentId: 1 } })
    .toArray();
  const contentIdByPlaceId = new Map(scoreBoardDocs.map((d) => [d.placeId, d.contentId]));

  const placesWithManualHours = await db
    .collection<PlaceWithManualHours>("places")
    .find(
      { $or: [{ hoursEnManual: { $ne: null } }, { closedDaysEnManual: { $ne: null } }] },
      { projection: { _id: 1, title: 1, operationInfo: 1, hoursEnManual: 1, hoursEnManualSourceKo: 1, closedDaysEnManual: 1, closedDaysEnManualSourceKo: 1 } }
    )
    .toArray();

  const placesCol = db.collection<{ _id: string; title: string; accessibilityInfo?: Record<string, string> }>(
    "places"
  );
  for (const p of placesWithManualHours) {
    const currentHours = pickOperationValue(p.operationInfo, HOURS_KEYS);
    const currentClosed = pickOperationValue(p.operationInfo, CLOSED_KEYS);
    const unset: Record<string, ""> = {};

    if (p.hoursEnManual && currentHours !== p.hoursEnManualSourceKo) {
      unset.hoursEnManual = "";
      unset.hoursEnManualSourceKo = "";
      flags.push({ placeId: p._id, title: p.title, field: "hoursEnManual" });
    }
    if (p.closedDaysEnManual && currentClosed !== p.closedDaysEnManualSourceKo) {
      unset.closedDaysEnManual = "";
      unset.closedDaysEnManualSourceKo = "";
      flags.push({ placeId: p._id, title: p.title, field: "closedDaysEnManual" });
    }
    if (Object.keys(unset).length > 0) {
      await placesCol.updateOne({ _id: p._id }, { $unset: unset });
    }
  }

  // ── accessibilityInfoEn (place_info, places.accessibilityInfo가 원본) ─────
  const placeInfoWithAccessEn = await db
    .collection<PlaceInfoWithAccessEn>("place_info")
    .find(
      { accessibilityInfoEn: { $exists: true, $ne: null } },
      { projection: { placeId: 1, accessibilityInfoEn: 1, accessibilityInfoSourceKo: 1 } }
    )
    .toArray();

  const placeInfoCol = db.collection("place_info");
  for (const info of placeInfoWithAccessEn) {
    const contentId = contentIdByPlaceId.get(info.placeId);
    if (!contentId) continue;
    const place = await placesCol.findOne({ _id: contentId }, { projection: { accessibilityInfo: 1, title: 1 } });
    const currentJson = JSON.stringify(place?.accessibilityInfo ?? null);
    if (currentJson !== info.accessibilityInfoSourceKo) {
      await placeInfoCol.updateOne(
        { placeId: info.placeId },
        { $unset: { accessibilityInfoEn: "", accessibilityInfoSourceKo: "" } }
      );
      flags.push({ placeId: info.placeId, title: place?.title ?? info.placeId, field: "accessibilityInfoEn" });
    }
  }

  console.log(`확인 완료 — stale ${flags.length}건`);
  if (flags.length > 0) {
    console.log(flags);
    notifyIfNeeded(flags);
  }

  await client.close();
}

/** GITHUB_TOKEN이 있을 때만(=Actions 환경) 이슈를 만들거나 코멘트를 남긴다.
 * 로컬 실행 시에는 콘솔 출력만 하고 조용히 넘어간다. */
function notifyIfNeeded(flags: Flag[]) {
  if (!process.env.GITHUB_TOKEN && !process.env.GH_TOKEN) {
    console.log("(GITHUB_TOKEN 없음 — 이슈 생성은 Actions 환경에서만)");
    return;
  }
  const body = [
    `places 주간 재적재에서 아래 ${flags.length}건의 영문 번역 원문(한국어)이 바뀌었습니다.`,
    `해당 영문 필드는 안전하게 null로 내려서 지금은 한국어로 표시됩니다 — 재번역해서 채워주세요.`,
    "",
    ...flags.map((f) => `- [ ] \`${f.placeId}\`(${f.title}) — \`${f.field}\``),
  ].join("\n");

  try {
    const existing = execFileSync("gh", ["issue", "list", "--search", `"${ISSUE_TITLE}" in:title`, "--state", "open", "--json", "number"], {
      encoding: "utf-8",
    });
    const list = JSON.parse(existing) as { number: number }[];
    if (list.length > 0) {
      execFileSync("gh", ["issue", "comment", String(list[0].number), "--body", body]);
      console.log(`기존 이슈 #${list[0].number}에 코멘트 추가`);
    } else {
      execFileSync("gh", ["issue", "create", "--title", ISSUE_TITLE, "--body", body]);
      console.log("새 이슈 생성");
    }
  } catch (err) {
    console.warn("이슈 생성/코멘트 실패(무시하고 계속):", (err as Error).message);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
