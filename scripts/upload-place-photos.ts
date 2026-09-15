/**
 * 사진 없는 곳 커스텀 사진 업로드 (9/16).
 *
 * firstImage가 null인 12곳 중 에스엠비 웰니스 센터(관광지 아님, 제외 결정)를 뺀
 * 11곳 — 유나가 `{contentId}.jpg` 이름으로 준 사진을 Vercel Blob에 올리고
 * `places.customImage`에 URL을 저장한다. 화면 쪽 소비는 recommend.ts/placeDetail.ts의
 * `firstImage: place.firstImage ?? place.customImage ?? null` 폴백이 담당.
 *
 * 실행: node --env-file=.env.local --import tsx scripts/upload-place-photos.ts
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { put } from "@vercel/blob";
import { MongoClient } from "mongodb";

const PHOTO_DIR = path.join(__dirname, "..", "docs/_internal/사진폴더");

const mongoUri = process.env.MONGODB_URI;
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");
if (!blobToken) throw new Error("BLOB_READ_WRITE_TOKEN이 설정되지 않았습니다");

async function main() {
  const files = fs.readdirSync(PHOTO_DIR).filter((f) => f.endsWith(".jpg"));
  console.log(`사진 ${files.length}개 발견`);

  const client = new MongoClient(mongoUri!);
  await client.connect();
  const places = client.db("cultural_fit_busan").collection<{ _id: string }>("places");

  let ok = 0;
  let failed = 0;

  for (const file of files) {
    const contentId = path.basename(file, ".jpg");
    try {
      const original = fs.readFileSync(path.join(PHOTO_DIR, file));
      // 유나가 준 원본이 폰 카메라 사진 그대로라 최대 50MB짜리도 있었다(9/16 QA
      // 발견 — 그것만 로딩이 눈에 띄게 느림). S10 카드·S20 히어로용이라 이 정도면
      // 충분해서 최대 1600px + JPEG 품질 80으로 줄인다.
      const buffer = await sharp(original)
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      console.log(`${contentId} ${original.length}B → ${buffer.length}B`);
      const blob = await put(`places/${contentId}.jpg`, buffer, {
        access: "public",
        token: blobToken,
        contentType: "image/jpeg",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      await places.updateOne({ _id: contentId }, { $set: { customImage: blob.url } });
      console.log(`${contentId} → ${blob.url}`);
      ok++;
    } catch (err) {
      console.warn(`${contentId} 실패:`, (err as Error).message);
      failed++;
    }
  }

  console.log(`\n업로드 완료: ${ok}건 성공, ${failed}건 실패`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
