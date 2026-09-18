/**
 * hoursEnManual·closedDaysEnManual 채우기 (Phase 4, LLM 번역).
 *
 * TourAPI 영문 서비스(EngService2)가 없는 49곳의 영업시간·휴무일을 LLM으로
 * 직접 번역한다. 10개 고유 문구로만 구성돼 있어(49곳 중 실제 값 있는 곳은
 * 22곳) 문구 단위로 매핑한다.
 *
 * 번역 당시의 한국어 원문을 *SourceKo에 같이 저장해둔다 — 매주 재적재
 * (`ingest-places.ts`)로 operationInfo가 바뀌면 check-stale-en-fields.ts가
 * 이 스냅샷과 대조해서 어긋난 건 null로 내리고 재번역 이슈를 남긴다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/fill-hours-en-manual.ts
 */

import path from "node:path";
import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

const DATA_PATH = path.join(__dirname, "data", "hours_closed_en_2026-09-17.json");

const HOURS_KEYS = ["usetime", "usetimeculture", "opentime", "usetimeleports"];
const CLOSED_KEYS = ["restdate", "restdateculture", "restdateshopping", "restdateleports"];

type ScoreBoardRow = { contentId: string };
type PlaceWithOperationInfo = { _id: string; operationInfo?: Record<string, string> };

function pickOperationValue(info: Record<string, string> | undefined, keys: string[]): string | null {
  if (!info) return null;
  for (const key of keys) {
    const raw = info[key];
    if (raw && raw.trim() !== "") return raw.replace(/<br\s*\/?>/gi, "\n").trim();
  }
  return null;
}

async function main() {
  const { hours, closedDays } = JSON.parse(readFileSync(DATA_PATH, "utf-8")) as {
    hours: Record<string, string>;
    closedDays: Record<string, string>;
  };

  const client = new MongoClient(mongoUri!);
  await client.connect();
  const db = client.db("cultural_fit_busan");

  const contentIds = (
    await db
      .collection<ScoreBoardRow>("score_board")
      .find({}, { projection: { _id: 0, contentId: 1 } })
      .toArray()
  )
    .map((d) => d.contentId)
    .filter(Boolean);

  const gapPlaces = await db
    .collection<PlaceWithOperationInfo>("places")
    .find({ _id: { $in: contentIds }, engContentId: { $exists: false } }, { projection: { operationInfo: 1 } })
    .toArray();

  const places = db.collection<{ _id: string }>("places");
  let hoursSet = 0;
  let closedSet = 0;
  const unmatched: string[] = [];

  for (const p of gapPlaces) {
    const currentHours = pickOperationValue(p.operationInfo, HOURS_KEYS);
    const currentClosed = pickOperationValue(p.operationInfo, CLOSED_KEYS);
    const update: Record<string, string> = {};

    if (currentHours) {
      const en = hours[currentHours];
      if (en) {
        update.hoursEnManual = en;
        update.hoursEnManualSourceKo = currentHours;
        hoursSet++;
      } else {
        unmatched.push(`hours: ${p._id} ${JSON.stringify(currentHours)}`);
      }
    }
    if (currentClosed) {
      const en = closedDays[currentClosed];
      if (en) {
        update.closedDaysEnManual = en;
        update.closedDaysEnManualSourceKo = currentClosed;
        closedSet++;
      } else {
        unmatched.push(`closedDays: ${p._id} ${JSON.stringify(currentClosed)}`);
      }
    }

    if (Object.keys(update).length > 0) {
      await places.updateOne({ _id: p._id }, { $set: update });
    }
  }

  console.log(`hoursEnManual 적재: ${hoursSet}건, closedDaysEnManual 적재: ${closedSet}건`);
  if (unmatched.length > 0) console.log("매칭 실패:", unmatched);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
