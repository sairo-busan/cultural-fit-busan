/**
 * 영문 콘텐츠ID 연결 스크립트 (BE-FEAT-013).
 *
 * TourAPI 영문 서비스(EngService2)는 국문과 콘텐츠ID가 별도 공간이라 직접 조회가
 * 안 된다. 소피가 부산 영문 목록 1,129건을 우리 120곳과 대조해서 만든 연결표
 * (`docs/TourAPI_영문_연결표_71.csv`, 71행 — 이름 매칭 64 + 좌표확인 7)를 읽어
 * `places.engContentId`/`engContentTypeId`를 세팅한다.
 *
 * 이 CSV는 개인 조사자료라 커밋하지 않는다(레포에 없으면 이 스크립트가 그대로 에러).
 *
 * 실행: node --env-file=.env.local --import tsx scripts/import-eng-content-id.ts
 */

import fs from "node:fs";
import path from "node:path";
import { MongoClient } from "mongodb";
import { parseCsv, makeColumnReader } from "./lib/csv";

const CSV_PATH = path.join(__dirname, "..", "docs/TourAPI_영문_연결표_71.csv");

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI가 설정되지 않았습니다");

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`연결표 없음: ${CSV_PATH} — 소피가 전달한 CSV를 이 경로에 둬야 함`);
  }
  // BOM 제거 — 엑셀/구글시트 내보내기에서 흔히 붙는다, 안 지우면 첫 헤더명이 안 맞음
  const text = fs.readFileSync(CSV_PATH, "utf-8").replace(/^﻿/, "");
  const rows = parseCsv(text);
  const header = rows[0];
  const col = makeColumnReader(header);

  const dataRows = rows.slice(1).filter((r) => col(r, "kor_content_id")?.trim());
  console.log(`연결표 ${dataRows.length}행 읽음`);

  const client = new MongoClient(mongoUri!);
  await client.connect();
  const places = client.db("cultural_fit_busan").collection<{ _id: string }>("places");

  const writes = dataRows.map((row) => ({
    updateOne: {
      filter: { _id: col(row, "kor_content_id")!.trim() },
      update: {
        $set: {
          engContentId: col(row, "eng_content_id")!.trim(),
          engContentTypeId: col(row, "eng_content_type_id")!.trim(),
        },
      },
    },
  }));

  const result = await places.bulkWrite(writes);
  console.log(`적재 완료: ${result.matchedCount}건 갱신 (연결표 ${dataRows.length}행 중)`);
  if (result.matchedCount < dataRows.length) {
    console.warn(`⚠️ ${dataRows.length - result.matchedCount}건은 places에 해당 kor_content_id가 없음`);
  }

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
