/**
 * docent-audio/ Blob 중 place_info가 더 이상 참조하지 않는 파일(옛 edge-tts,
 * 재생성 전 Google TTS 버전 등) 삭제 — addRandomSuffix: true라 재업로드할
 * 때마다 새 URL을 받고 옛 파일은 안 지워져서(설계상 의도, 소피 발견) 계속
 * 쌓인다. 9/20 Vercel Blob Hobby 플랜(1GB) 한도 초과로 재업로드 실패 발생 —
 * 정리 필요.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/cleanup-orphaned-docent-audio.ts
 */

import { list, del } from "@vercel/blob";
import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");
if (!blobToken) throw new Error("BLOB_READ_WRITE_TOKEN이 설정되지 않았습니다");

async function main() {
  const client = new MongoClient(mongoUri!);
  await client.connect();
  const db = client.db("cultural_fit_busan");

  const docs = await db
    .collection<{
      audioUrlSimpleKo?: string | null;
      audioUrlDetailKo?: string | null;
      audioUrlSimpleEn?: string | null;
      audioUrlDetailEn?: string | null;
    }>("place_info")
    .find({}, { projection: { audioUrlSimpleKo: 1, audioUrlDetailKo: 1, audioUrlSimpleEn: 1, audioUrlDetailEn: 1 } })
    .toArray();

  const referenced = new Set<string>();
  for (const d of docs) {
    for (const url of [d.audioUrlSimpleKo, d.audioUrlDetailKo, d.audioUrlSimpleEn, d.audioUrlDetailEn]) {
      if (url) referenced.add(url);
    }
  }
  console.log(`현재 참조 중인 URL ${referenced.size}개`);

  let cursor: string | undefined;
  let totalBlobs = 0;
  let deleted = 0;
  let freedBytes = 0;

  do {
    const page = await list({ prefix: "docent-audio/", token: blobToken, cursor, limit: 1000 });
    totalBlobs += page.blobs.length;
    const orphaned = page.blobs.filter((b) => !referenced.has(b.url));
    for (const b of orphaned) {
      await del(b.url, { token: blobToken });
      deleted++;
      freedBytes += b.size;
    }
    cursor = page.cursor;
  } while (cursor);

  console.log(`전체 blob ${totalBlobs}개 중 ${deleted}개 삭제 (${(freedBytes / 1024 / 1024).toFixed(1)}MB 확보)`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
