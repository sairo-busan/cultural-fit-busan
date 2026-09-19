/**
 * 도슨트 한글 음성(간단히·자세히) Vercel Blob 업로드.
 *
 * generate-docent-audio-ko.ts로 만든 로컬 mp3(docs/_internal/scratch/audio/)를
 * Blob에 올리고 place_info.audioUrlSimpleKo·audioUrlDetailKo에 URL을 저장한다.
 * 업로드 전 로컬에서 귀로 확인 원칙 — 이번엔 사용자 승인 후 진행.
 *
 * addRandomSuffix: true — Blob CDN 캐시가 30일이라, 고정 경로를 덮어쓰면
 * 원고 고쳐서 재생성해도 앱엔 최대 30일간 옛 음원이 나온다(소피 발견,
 * BE-FEAT-019 PR 리뷰). 매번 새 URL을 받아 DB에 갱신하는 쪽으로 바꿨다 —
 * 옛 파일이 Blob에 계속 쌓이는 트레이드오프는 있지만, 무료 한도(월 1GB)
 * 안에서는 문제없다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/upload-docent-audio-ko.ts
 */

import fs from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";
import { MongoClient } from "mongodb";

const AUDIO_DIR = path.join(__dirname, "..", "docs/_internal/scratch/audio");

const mongoUri = process.env.MONGODB_URI;
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");
if (!blobToken) throw new Error("BLOB_READ_WRITE_TOKEN이 설정되지 않았습니다");

async function main() {
  const files = fs.readdirSync(AUDIO_DIR).filter((f) => f.endsWith("_ko.mp3"));
  console.log(`업로드 대상 ${files.length}개`);

  const client = new MongoClient(mongoUri!);
  await client.connect();
  const placeInfo = client.db("cultural_fit_busan").collection("place_info");

  let ok = 0;
  let failed = 0;
  const failedFiles: string[] = [];

  for (const file of files) {
    // {placeId}_simple_ko.mp3 / {placeId}_detail_ko.mp3
    const match = file.match(/^(plc_[0-9a-f]+)_(simple|detail)_ko\.mp3$/);
    if (!match) {
      console.warn(`파일명 패턴 불일치, 건너뜀: ${file}`);
      continue;
    }
    const [, placeId, kind] = match;
    const urlField = kind === "simple" ? "audioUrlSimpleKo" : "audioUrlDetailKo";
    const marksField = kind === "simple" ? "audioMarksSimpleKo" : "audioMarksDetailKo";

    try {
      const buffer = fs.readFileSync(path.join(AUDIO_DIR, file));
      const blob = await put(`docent-audio/${file}`, buffer, {
        access: "public",
        token: blobToken,
        contentType: "audio/mpeg",
        addRandomSuffix: true,
      });
      const set: Record<string, unknown> = { [urlField]: blob.url };
      const marksPath = path.join(AUDIO_DIR, file.replace(/\.mp3$/, ".marks.json"));
      if (fs.existsSync(marksPath)) {
        set[marksField] = JSON.parse(fs.readFileSync(marksPath, "utf-8"));
      }
      await placeInfo.updateOne({ placeId }, { $set: set });
      ok++;
    } catch (err) {
      failed++;
      failedFiles.push(`${file}: ${(err as Error).message}`);
    }
    if ((ok + failed) % 40 === 0) console.log(`진행 ${ok + failed}/${files.length}`);
  }

  console.log(`\n업로드 완료: ${ok}건 성공, ${failed}건 실패`);
  if (failedFiles.length > 0) console.log("실패 목록:", failedFiles);

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
