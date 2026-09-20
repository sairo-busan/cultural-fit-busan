/**
 * 도슨트 한글 음성(간단히·자세히) 생성 — Google Cloud TTS(ko-KR-Chirp3-HD-Despina).
 *
 * edge-tts(비공식 클라이언트, 라이선스 리스크)를 공식 API로 교체(BE-FEAT-020).
 * 문장별 합성 + 실측 조립(scripts/lib/docentTts.ts)로 audioMarks(문장별 시작
 * 시각)도 같이 만든다. 이 단계는 로컬 생성까지만 — Vercel Blob 업로드는
 * upload-docent-audio-ko.ts에서 한다(업로드 전 결과물 귀로 확인 원칙).
 *
 * 실행: node --env-file=.env.local --import tsx scripts/generate-docent-audio-ko.ts
 */

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { MongoClient } from "mongodb";
import { buildDocentAudio } from "./lib/docentTts";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

const OUT_DIR = path.join(__dirname, "..", "docs/_internal/scratch/audio");
const VOICE = { languageCode: "ko-KR", name: "ko-KR-Chirp3-HD-Despina" };
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
    .collection<{ placeId: string; guideSimpleKo: string | null; guideDetailKo: string | null }>("place_info")
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
    const base = path.join(OUT_DIR, `${job.placeId}_${job.kind}_ko`);
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
