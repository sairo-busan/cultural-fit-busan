/**
 * 도슨트 영문 음성(간단히·자세히) Vercel Blob 업로드.
 *
 * upload-docent-audio-ko.ts의 영문판. generate-docent-audio-en.ts로 만든
 * 로컬 mp3를 Blob에 올리고 place_info.audioUrlSimpleEn·audioUrlDetailEn에
 * URL을 저장한다.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/upload-docent-audio-en.ts
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
  const files = fs.readdirSync(AUDIO_DIR).filter((f) => f.endsWith("_en.mp3"));
  console.log(`업로드 대상 ${files.length}개`);

  const client = new MongoClient(mongoUri!);
  await client.connect();
  const placeInfo = client.db("cultural_fit_busan").collection("place_info");

  let ok = 0;
  let failed = 0;
  const failedFiles: string[] = [];

  for (const file of files) {
    // {placeId}_simple_en.mp3 / {placeId}_detail_en.mp3
    const match = file.match(/^(plc_[0-9a-f]+)_(simple|detail)_en\.mp3$/);
    if (!match) {
      console.warn(`파일명 패턴 불일치, 건너뜀: ${file}`);
      continue;
    }
    const [, placeId, kind] = match;
    const field = kind === "simple" ? "audioUrlSimpleEn" : "audioUrlDetailEn";

    try {
      const buffer = fs.readFileSync(path.join(AUDIO_DIR, file));
      const blob = await put(`docent-audio/${file}`, buffer, {
        access: "public",
        token: blobToken,
        contentType: "audio/mpeg",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      await placeInfo.updateOne({ placeId }, { $set: { [field]: blob.url } });
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
