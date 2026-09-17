# BE-FEAT-017: 도슨트 한글 음성 파이프라인(생성·업로드)

도슨트 간단히·자세히(한글)를 edge-tts로 mp3 생성해 Vercel Blob에 올리고
`place_info`에 URL을 저장한다.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | BE |
| Type | FEAT |
| Severity | Medium |
| Layer | Script / Lib |
| Status | In Progress |
| Screen | S23 (음성 도슨트, FE-FEAT-013 — 아직 Backlog) |
| Depends | 새 원고 재적재(9/17, 유나 최종본) |
| Related | FE-FEAT-013(voice_docent) — 이 티켓 작성 당시 기준으로 스펙 낡음(아래 참고) |

---

## Problem

- **현재 동작**: 도슨트 음성 파일·URL이 없다.
- **기대 동작**: 간단히·자세히(한글) 120곳 mp3를 만들어 Blob에 올리고,
  `PlaceDetail` 응답에 `audioUrlSimpleKo`·`audioUrlDetailKo`를 내려준다.
- **영향 범위**: `place_info` 컬렉션, `src/lib/placeDetail.ts`, Vercel Blob 저장소.

---

## Context

```
관련 파일:
- scripts/generate-docent-audio-ko.ts (신규)
- scripts/upload-docent-audio-ko.ts (신규)
- src/lib/placeDetail.ts

외부 의존:
- edge-tts CLI(로컬 설치, ko-KR-SunHiNeural)
- Vercel Blob (BLOB_READ_WRITE_TOKEN)
```

- 원고: 9/17 유나 최종본(구글시트 재적재, `import-db02-placeinfo.ts`)로
  `guideSimpleKo`·`guideDetailKo` 최신화 완료 — 이번 티켓은 그 위에서 음성만 만든다.
- 생성 결과: 240개(120곳×2종), 로컬 109MB — Vercel Blob 무료 한도(월 1GB 저장·
  10GB 전송) 안에서 여유 있음(9/17 worklog 실측치와 부합).
- Blob 경로: `docent-audio/{placeId}_{simple|detail}_ko.mp3`

### FE-FEAT-013(음성 도슨트 화면) 스펙 낡음 — 참고만

그 티켓 작성(9/15) 당시엔 "영문 간단히는 없다"·"영문은 자세히만, 전환 없음"이
전제였는데, 오늘(9/17) 영문 간단히도 만들기로 결정 바뀜(BE-FEAT-016). 소피가
FE-FEAT-013 시작할 때 이 변경을 반영해야 함 — 이 티켓 범위 밖이라 내용만 남김.

---

## Scope

### 포함

1. `scripts/generate-docent-audio-ko.ts` — edge-tts로 간단히·자세히 한글 mp3 생성(로컬)
2. `scripts/upload-docent-audio-ko.ts` — Blob 업로드 + `audioUrlSimpleKo`·
   `audioUrlDetailKo` 저장
3. `src/lib/placeDetail.ts` — `PlaceDetail` 계약에 두 필드 추가

### 제외

- 영문 음성(`audioUrlSimpleEn`·`audioUrlDetailEn`) — 영문 원고 확정 후 별도 티켓
- 팁(`guideTipsRawKo`) 음성 — 스코프 아님(피그마 S23에도 없음)
- S23 화면 구현 — FE-FEAT-013, 소피

---

## Verification

1. `npx tsc --noEmit` — 통과
2. mp3 생성 240/240, Blob 업로드 240/240
3. `PlaceDetail` 응답에 `audioUrlSimpleKo`·`audioUrlDetailKo` 존재, 값 재생 확인(샘플)

---

## Implementation Notes

### 2026-09-17: 한글 생성·업로드

에린 TTS 설계(worklog 9/17) 그대로 진행. edge-tts 실측 처리시간 짧아서(테스트
문장 1초 미만) 240개 동시 6개 concurrency로 수 분 내 완료. 용량 109MB로 예상보다
여유 있음.
