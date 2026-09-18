/**
 * places 주간 재적재 후, 추천/상세 API가 서버 가드(recommend.ts·placeDetail.ts)로
 * 조용히 걸러내고 있는 장소를 모아 GitHub 이슈로 알린다.
 *
 * 가드 자체는 9/18 사고(핵심 필드 null → FE 크래시) 재발을 막지만, 걸러진 장소가
 * "TourAPI에서 완전히 없어진 곳"인지 "이번 주만 일시적으로 실패한 곳"인지는
 * 사람이 봐야 안다 — 전자면 score_board에서 삭제(2721157 선례), 후자면 다음 주
 * 재적재를 기다리거나 원인을 조사한다. 이 스크립트는 그 판단 대상을 매주
 * 자동으로 모아주기만 한다(삭제는 하지 않음).
 *
 * 워크플로우에서 refresh-curated-places.ts 다음 순서로 실행한다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/check-broken-places.ts
 */

import { execFileSync } from "node:child_process";
import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

const ISSUE_TITLE = "[자동] 추천/상세에서 제외된 장소 발견 — 원인 확인 필요";

type ScoreBoardRow = { placeId: string; contentId: string };
type PlaceRow = { _id: string; title?: string | null; addr1?: string | null; mapX?: number | null; mapY?: number | null };

type Broken = { contentId: string; placeId: string; reason: string };

async function main() {
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const db = client.db("cultural_fit_busan");

  const scoreBoards = await db
    .collection<ScoreBoardRow>("score_board")
    .find({}, { projection: { _id: 0, placeId: 1, contentId: 1 } })
    .toArray();

  const contentIds = scoreBoards.map((s) => s.contentId).filter(Boolean);
  const places = await db
    .collection<PlaceRow>("places")
    .find({ _id: { $in: contentIds } }, { projection: { _id: 1, title: 1, addr1: 1, mapX: 1, mapY: 1 } })
    .toArray();
  const placeById = new Map(places.map((p) => [p._id, p]));

  const broken: Broken[] = [];
  for (const s of scoreBoards) {
    if (!s.contentId) continue;
    const place = placeById.get(s.contentId);
    if (!place) {
      broken.push({ contentId: s.contentId, placeId: s.placeId, reason: "places에 문서 없음" });
      continue;
    }
    if (!place.title || !place.addr1 || place.mapX == null || place.mapY == null) {
      const missing = [
        !place.title && "title",
        !place.addr1 && "addr1",
        place.mapX == null && "mapX",
        place.mapY == null && "mapY",
      ]
        .filter(Boolean)
        .join(", ");
      broken.push({ contentId: s.contentId, placeId: s.placeId, reason: `핵심 필드 null (${missing})` });
    }
  }

  console.log(`확인 완료 — 제외된 장소 ${broken.length}건`);
  if (broken.length > 0) {
    console.log(broken);
    notifyIfNeeded(broken);
  }

  await client.close();
}

/** GITHUB_TOKEN이 있을 때만(=Actions 환경) 이슈를 만들거나 코멘트를 남긴다.
 * 로컬 실행 시에는 콘솔 출력만 하고 조용히 넘어간다. */
function notifyIfNeeded(broken: Broken[]) {
  if (!process.env.GITHUB_TOKEN && !process.env.GH_TOKEN) {
    console.log("(GITHUB_TOKEN 없음 — 이슈 생성은 Actions 환경에서만)");
    return;
  }
  const body = [
    `추천 목록/상세 API에서 아래 ${broken.length}곳이 서버 가드로 제외되고 있습니다.`,
    `(TourAPI 원본 소실·재적재 실패 등으로 title/addr1/mapX/mapY 중 하나 이상 null)`,
    "",
    "각 항목 확인 후: TourAPI에서 완전히 없어졌으면 score_board에서 삭제, 일시적 실패면 다음 주 재적재 결과를 기다리거나 원인을 조사해주세요.",
    "",
    ...broken.map((b) => `- [ ] \`${b.contentId}\`(placeId: ${b.placeId}) — ${b.reason}`),
  ].join("\n");

  try {
    const existing = execFileSync(
      "gh",
      ["issue", "list", "--search", `"${ISSUE_TITLE}" in:title`, "--state", "open", "--json", "number"],
      { encoding: "utf-8" }
    );
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
