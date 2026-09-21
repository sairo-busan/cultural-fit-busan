/**
 * 도슨트 영문 음성(간단히·자세히) 생성 — Google Cloud TTS(en-US-Chirp3-HD-Despina).
 * generate-docent-audio-ko.ts의 영문판(BE-FEAT-020). 같은 계열(Despina) 보이스로
 * 관리 단순화 — 사용자 확인, 한국어 미모국어라 억양 판단 대신 일관성 우선.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/generate-docent-audio-en.ts
 */

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { MongoClient } from "mongodb";
import { buildDocentAudio } from "./lib/docentTts";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

const OUT_DIR = path.join(__dirname, "..", "docs/_internal/scratch/audio");
const VOICE = { languageCode: "en-US", name: "en-US-Chirp3-HD-Despina" };
const CONCURRENCY = 2;

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
    .collection<{ placeId: string; guideSimpleEn: string | null; guideDetailEn: string | null }>("place_info")
    .find(
      { $or: [{ guideSimpleEn: { $ne: null } }, { guideDetailEn: { $ne: null } }] },
      { projection: { _id: 0, placeId: 1, guideSimpleEn: 1, guideDetailEn: 1 } }
    )
    .toArray();
  console.log(`대상 ${docs.length}곳 (간단히·자세히 합쳐 최대 ${docs.length * 2}개 파일)`);

  const jobs: { placeId: string; kind: "simple" | "detail"; text: string }[] = [];
  for (const d of docs) {
    if (d.guideSimpleEn) jobs.push({ placeId: d.placeId, kind: "simple", text: d.guideSimpleEn });
    if (d.guideDetailEn) jobs.push({ placeId: d.placeId, kind: "detail", text: d.guideDetailEn });
  }
  console.log(`생성할 파일 ${jobs.length}개`);

  let done = 0;
  let failed = 0;
  const failedJobs: string[] = [];
  await runWithConcurrency(jobs, CONCURRENCY, async (job) => {
    const base = path.join(OUT_DIR, `${job.placeId}_${job.kind}_en`);
    try {
      // 재실행 시 이미 만든 건 건너뜀(할당량 초과 재시도용). mp3만 보면 mp3 쓰고
      // marks.json 쓰기 전에 죽었을 때 마크 없이 "완료"로 오판한다(소피 PR #60 리뷰) —
      // 두 파일 다 있어야 건너뛴다.
      if (!(existsSync(`${base}.mp3`) && existsSync(`${base}.marks.json`))) {
        const { marks, mp3 } = await buildDocentAudio(job.text, VOICE);
        await writeFile(`${base}.mp3`, mp3);
        await writeFile(`${base}.marks.json`, JSON.stringify(marks));
      }
    } catch (err) {
      failed++;
      failedJobs.push(`${job.placeId}_${job.kind}: ${(err as Error).message}`);
    }
    done++;
    if (done % 10 === 0 || done === jobs.length) {
      console.log(`진행 ${done}/${jobs.length} (실패 ${failed})`);
    }
  });

  console.log(`\n완료: ${jobs.length - failed}개 성공, ${failed}개 실패`);
  if (failedJobs.length > 0) console.log("실패 목록:", failedJobs);
  console.log(`저장 위치: ${OUT_DIR}`);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
