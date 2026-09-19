/**
 * 도슨트 음성 공통 생성 로직 — Google Cloud TTS, 문장별 합성 + 실측 조립
 * (docs/decisions/2026-09-17_TTS_엔진_교체.md 설계, 소피 PR #56 리뷰 반영).
 *
 * 문장마다 LINEAR16(wav)로 따로 받아 raw PCM만 이어붙인 뒤(ffmpeg concat 불필요 —
 * 같은 sampleRate/channels/bitsPerSample로 고정 생성하므로 버퍼만 합쳐도 유효한
 * wav가 된다) 마지막에 한 번만 mp3로 인코딩한다. mp3 클립을 이어붙이면 클립마다
 * 인코더 여백이 붙어 문장마다 수십 ms씩 밀린다(소피 리뷰) — wav 상태로 합치면
 * 그 문제가 없고, startSec도 실측 PCM 길이 기반이라 정확하다.
 */

import { spawn } from "node:child_process";
import textToSpeech from "@google-cloud/text-to-speech";

const client = new textToSpeech.TextToSpeechClient();

const PARAGRAPH_GAP_SEC = 0.6;
const SAMPLE_RATE = 24000;

export type AudioMark = { startSec: number; text: string };
export type Voice = { languageCode: string; name: string };

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** 마침표/느낌표/물음표 뒤 공백 기준 분리. text는 원문에서 trim만 한 부분
 * 문자열이라 화면이 원고 안에서 그대로 찾을 수 있다(소피 리뷰, 정규화 금지). */
function splitSentences(paragraph: string): string[] {
  return paragraph
    .split(/(?<=[.!?])\s+(?=\S)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type WavInfo = { sampleRate: number; channels: number; bitsPerSample: number; data: Buffer };

function parseWav(buf: Buffer): WavInfo {
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Google TTS 응답이 RIFF/WAVE 헤더가 아님");
  }
  let offset = 12;
  let sampleRate = 0;
  let channels = 0;
  let bitsPerSample = 0;
  let data: Buffer | null = null;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === "fmt ") {
      channels = buf.readUInt16LE(body + 2);
      sampleRate = buf.readUInt32LE(body + 4);
      bitsPerSample = buf.readUInt16LE(body + 14);
    } else if (id === "data") {
      data = buf.subarray(body, body + size);
    }
    offset = body + size + (size % 2);
  }
  if (!data || !sampleRate) throw new Error("wav에 fmt/data 청크 없음");
  return { sampleRate, channels, bitsPerSample, data };
}

function buildWavHeader(dataSize: number, sampleRate: number, channels: number, bitsPerSample: number): Buffer {
  const blockAlign = channels * (bitsPerSample / 8);
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * blockAlign, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return header;
}

function silencePcm(sampleRate: number, channels: number, bitsPerSample: number, seconds: number): Buffer {
  return Buffer.alloc(Math.round(sampleRate * channels * (bitsPerSample / 8) * seconds));
}

/** Chirp3 HD는 Neural2/Wavenet보다 분당 요청 한도가 낮아서(RESOURCE_EXHAUSTED,
 * 9/19 실측 240건 중 27건 실패) 문장이 많은 "자세히" 원고에서 특히 걸린다.
 * 지수 백오프로 재시도한다 — 문장별 개별 호출 구조라 실패한 문장만 재시도해도 된다. */
async function synthesizeWithRetry(
  request: Parameters<InstanceType<typeof textToSpeech.TextToSpeechClient>["synthesizeSpeech"]>[0]
): Promise<Buffer> {
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const [res] = await client.synthesizeSpeech(request);
      return res.audioContent as Buffer;
    } catch (err) {
      const isQuota = (err as { code?: number })?.code === 8; // RESOURCE_EXHAUSTED
      if (!isQuota || attempt === maxAttempts) throw err;
      const waitMs = 2000 * 2 ** (attempt - 1);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw new Error("unreachable");
}

function encodeMp3(wavBuffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", ["-y", "-i", "pipe:0", "-codec:a", "libmp3lame", "-b:a", "128k", "-f", "mp3", "pipe:1"]);
    const chunks: Buffer[] = [];
    ff.stdout.on("data", (d) => chunks.push(d));
    ff.on("error", reject);
    ff.on("close", (code) => (code === 0 ? resolve(Buffer.concat(chunks)) : reject(new Error(`ffmpeg 종료 코드 ${code}`))));
    ff.stdin.write(wavBuffer);
    ff.stdin.end();
  });
}

export async function buildDocentAudio(text: string, voice: Voice): Promise<{ marks: AudioMark[]; mp3: Buffer }> {
  const paragraphs = splitParagraphs(text);
  const marks: AudioMark[] = [];
  const pcmChunks: Buffer[] = [];
  let sampleRate = SAMPLE_RATE;
  let channels = 1;
  let bitsPerSample = 16;
  let cumBytes = 0;

  for (let p = 0; p < paragraphs.length; p++) {
    const sentences = splitSentences(paragraphs[p]);
    for (let s = 0; s < sentences.length; s++) {
      if (p > 0 && s === 0) {
        const silence = silencePcm(sampleRate, channels, bitsPerSample, PARAGRAPH_GAP_SEC);
        pcmChunks.push(silence);
        cumBytes += silence.length;
      }
      const audioContent = await synthesizeWithRetry({
        input: { text: sentences[s] },
        voice,
        audioConfig: { audioEncoding: "LINEAR16", sampleRateHertz: SAMPLE_RATE },
      });
      const wav = parseWav(audioContent);
      sampleRate = wav.sampleRate;
      channels = wav.channels;
      bitsPerSample = wav.bitsPerSample;

      const startSec = cumBytes / (sampleRate * channels * (bitsPerSample / 8));
      marks.push({ startSec: Math.round(startSec * 1000) / 1000, text: sentences[s] });
      pcmChunks.push(wav.data);
      cumBytes += wav.data.length;
    }
  }

  const pcm = Buffer.concat(pcmChunks);
  const wavFile = Buffer.concat([buildWavHeader(pcm.length, sampleRate, channels, bitsPerSample), pcm]);
  const mp3 = await encodeMp3(wavFile);
  return { marks, mp3 };
}
