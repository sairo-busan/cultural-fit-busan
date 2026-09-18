/**
 * 도슨트 한글 음성(간단히·자세히) 생성 — edge-tts.
 *
 * place_info.guideSimpleKo·guideDetailKo(9/17 새 원고, 시트 재적재 완료)로
 * ko-KR-SunHiNeural mp3를 만든다. 이 단계는 로컬 생성까지만 — Vercel Blob
 * 업로드는 별도 스크립트에서 한다(업로드 전 결과물 귀로 확인 원칙).
 *
 * 실행: node --env-file=.env.local --import tsx scripts/generate-docent-audio-ko.ts
 */

import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { MongoClient } from "mongodb";

const execFileAsync = promisify(execFile);

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

const OUT_DIR = path.join(__dirname, "..", "docs/_internal/scratch/audio");
const VOICE = "ko-KR-SunHiNeural";
const CONCURRENCY = 6;

async function synth(text: string, outPath: string): Promise<void> {
  await execFileAsync("edge-tts", ["--voice", VOICE, "--text", text, "--write-media", outPath]);
}

async function runWithConcurrency<T>(items: T[], limit: number, fn: (item: T, i: number) => Promise<void>) {
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const client = new MongoClient(mongoUri!);
  await client.connect();
  const db = client.db("cultural_fit_busan");
  const docs = await db
    .collection<{ placeId: string; guideSimpleKo: string | null; guideDetailKo: string | null }>(
      "place_info"
    )
    .find(
      { $or: [{ guideSimpleKo: { $ne: null } }, { guideDetailKo: { $ne: null } }] },
      { projection: { _id: 0, placeId: 1, guideSimpleKo: 1, guideDetailKo: 1 } }
    )
    .toArray();
  console.log(`대상 ${docs.length}곳 (간단히·자세히 합쳐 최대 ${docs.length * 2}개 파일)`);

  const jobs: { placeId: string; kind: "simple" | "detail"; text: string }[] = [];
  for (const d of docs) {
    if (d.guideSimpleKo) jobs.push({ placeId: d.placeId, kind: "simple", text: d.guideSimpleKo });
    if (d.guideDetailKo) jobs.push({ placeId: d.placeId, kind: "detail", text: d.guideDetailKo });
  }
  console.log(`생성할 파일 ${jobs.length}개`);

  let done = 0;
  let failed = 0;
  const failedJobs: string[] = [];
  await runWithConcurrency(jobs, CONCURRENCY, async (job) => {
    const outPath = path.join(OUT_DIR, `${job.placeId}_${job.kind}_ko.mp3`);
    try {
      await synth(job.text, outPath);
    } catch (err) {
      failed++;
      failedJobs.push(`${job.placeId}_${job.kind}: ${(err as Error).message}`);
    }
    done++;
    if (done % 20 === 0 || done === jobs.length) {
      console.log(`진행 ${done}/${jobs.length} (실패 ${failed})`);
    }
  });

  console.log(`\n완료: ${jobs.length - failed}개 성공, ${failed}개 실패`);
  if (failedJobs.length > 0) {
    console.log("실패 목록:", failedJobs);
  }
  console.log(`저장 위치: ${OUT_DIR}`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
