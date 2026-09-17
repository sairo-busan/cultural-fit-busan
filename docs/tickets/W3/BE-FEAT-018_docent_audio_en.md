# BE-FEAT-018: 도슨트 영문 음성 파이프라인(생성·업로드)

BE-FEAT-017(한글)의 영문판. 간단히·자세히 영문 mp3를 만들어 Blob에 올린다.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | BE |
| Type | FEAT |
| Severity | Medium |
| Layer | Script / Lib |
| Status | Done |
| Screen | S23 (음성 도슨트, FE-FEAT-013 — 아직 Backlog) |
| Depends | BE-FEAT-016(guideSimpleEn·guideDetailEn 새 원고 재번역) · BE-FEAT-017 |
| Related | - |

---

## Problem

- **현재 동작**: 영문 도슨트 음성이 없다(BE-FEAT-017은 한글만 스코프).
- **기대 동작**: 간단히·자세히 영문 119곳 mp3를 만들어 Blob에 올리고,
  `PlaceDetail` 응답에 `audioUrlSimpleEn`·`audioUrlDetailEn`을 내려준다.
- **영향 범위**: `place_info` 컬렉션, `src/lib/placeDetail.ts`, Vercel Blob.

---

## Context

```
관련 파일:
- scripts/generate-docent-audio-en.ts (신규, generate-docent-audio-ko.ts와 동일 구조)
- scripts/upload-docent-audio-en.ts (신규, upload-docent-audio-ko.ts와 동일 구조)
- src/lib/placeDetail.ts
```

- 목소리: `en-US-JennyNeural`(General·Friendly) — 한글 `ko-KR-SunHiNeural`과 톤 맞춤
- 사용자가 샘플 1개(`plc_022169e...`_simple_en.mp3) 직접 들어보고 확정
- Blob 경로: `docent-audio/{placeId}_{simple|detail}_en.mp3`
- 119곳(에스엠비 웰니스 센터 스코프 제외는 동일)

---

## Scope

### 포함

1. `scripts/generate-docent-audio-en.ts` — edge-tts로 간단히·자세히 영문 mp3 생성(로컬)
2. `scripts/upload-docent-audio-en.ts` — Blob 업로드 + `audioUrlSimpleEn`·
   `audioUrlDetailEn` 저장
3. `src/lib/placeDetail.ts` — `PlaceDetail` 계약에 두 필드 추가

### 제외

- 팁(`guideTipsRawEn`) 음성 — 스코프 아님(한글판과 동일 이유)
- S23 화면 구현 — FE-FEAT-013, 소피

---

## Verification

1. `npx tsc --noEmit` — 통과
2. mp3 생성 238/238, Blob 업로드 확인
3. `PlaceDetail` 응답에 `audioUrlSimpleEn`·`audioUrlDetailEn` 존재

---

## Implementation Notes

### 2026-09-17: 영문 생성·업로드

BE-FEAT-017 한글 파이프라인 그대로 재사용, 보이스만 교체. 샘플 청취 확인 후
전체 생성 진행.
