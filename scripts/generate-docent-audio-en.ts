/**
 * 도슨트 영문 음성(간단히·자세히) 생성 — edge-tts.
 *
 * generate-docent-audio-ko.ts의 영문판. place_info.guideSimpleEn·guideDetailEn
 * (9/17 유나 최종본 기준 재번역, BE-FEAT-016 후속)으로 en-US-JennyNeural mp3를
 * 만든다. ko-KR-SunHiNeural과 같은 톤(General·Friendly)을 고른 목소리다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/generate-docent-audio-en.ts
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
const VOICE = "en-US-JennyNeural";
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
    .collection("place_info")
    .find(
      { $or: [{ guideSimpleEn: { $ne: null } }, { guideDetailEn: { $ne: null } }] },
      { projection: { _id: 0, placeId: 1, guideSimpleEn: 1, guideDetailEn: 1 } }
    )
    .toArray();
  console.log(`대상 ${docs.length}곳 (간단히·자세히 합쳐 최대 ${docs.length * 2}개 파일)`);

  const jobs: { placeId: string; kind: "simple" | "detail"; text: string }[] = [];
  for (const d of docs as any[]) {
    if (d.guideSimpleEn) jobs.push({ placeId: d.placeId, kind: "simple", text: d.guideSimpleEn });
    if (d.guideDetailEn) jobs.push({ placeId: d.placeId, kind: "detail", text: d.guideDetailEn });
  }
  console.log(`생성할 파일 ${jobs.length}개`);

  let done = 0;
  let failed = 0;
  const failedJobs: string[] = [];
  await runWithConcurrency(jobs, CONCURRENCY, async (job) => {
    const outPath = path.join(OUT_DIR, `${job.placeId}_${job.kind}_en.mp3`);
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
