# BE-FEAT-020: 도슨트 음성 Google Cloud TTS 전환 + 문장별 재생 시각(audioMarks)

edge-tts(비공식 클라이언트) 라이선스 리스크로 Google Cloud TTS로 교체하고,
도슨트 화면에서 지금 읽는 문장을 하이라이트할 수 있게 문장별 재생 시작
시각(audioMarks)을 같이 만든다.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | BE |
| Type | FEAT |
| Severity | Medium |
| Layer | Script / Lib |
| Status | Blocked — GCP 서비스 계정 키 대기 |
| Screen | S23 (음성 도슨트, FE-FEAT-013) |
| Depends | BE-FEAT-017·018(edge-tts 파이프라인, 교체 대상) |
| Related | `docs/decisions/2026-09-17_TTS_엔진_교체.md` |

---

## Problem

- **현재 동작**: 도슨트 음성 478개(한글 240 + 영문 238)가 edge-tts(비공식
  클라이언트)로 만들어져 있어 공모전 제출작 이용조건이 불명확하다(소피
  발견, PR #49 리뷰).
- **기대 동작**: 공식 API(Google Cloud TTS)로 전량 재생성하고, 화면이 지금
  읽는 문장을 하이라이트할 수 있게 문장별 시작 시각(`audioMarks*`)도 같이
  내려준다(소피 추가 요청, 9/18).
- **영향 범위**: `place_info` 컬렉션(`audioUrl*`·`audioMarks*` 필드),
  `src/lib/placeDetail.ts`.

원래 BE-FEAT-019(재적재 워크플로우) PR 리뷰 중 나온 이슈들인데, 완전히
다른 기능이라 별도 티켓으로 분리했다(9/18) — 자세한 배경·비교는
`docs/decisions/2026-09-17_TTS_엔진_교체.md` 참고.

---

## Scope

### 포함

1. GCP 프로젝트/Text-to-Speech API/서비스 계정 키 — **사용자 액션 필요**
   (Claude Code가 대신 못 함, 결정 문서에 요청 내용 있음)
2. `generate-docent-audio-ko.ts`/`generate-docent-audio-en.ts`를 Google
   Cloud TTS SDK 기반으로 재작성
3. 문장 단위 분리 → 개별 합성(`LINEAR16`/wav, mp3 아님 — 클립 인코더
   여백으로 인한 밀림 방지) → wav 헤더로 실측 길이 계산 → 누적 `startSec`
   계산 → `ffmpeg`로 wav 이어붙인 뒤 한 번만 mp3 인코딩
4. `place_info.audioMarksSimpleKo`·`audioMarksDetailKo`·
   `audioMarksSimpleEn`·`audioMarksDetailEn`(`{ startSec, text }[]`,
   `text`는 원고 원문 부분 문자열 그대로·정규화 안 함) 신규
5. 기존 edge-tts 478개 mp3 전량 재생성·재업로드(`addRandomSuffix: true`,
   이미 반영됨)
6. `placeDetail.ts` 응답에 `audioMarks*` 추가

### 제외

- SSML `<mark>`+timepoints 방식 — Neural2 버그·beta 전용이라 기각(결정
  문서 참고)
- S23 화면 하이라이트 구현 — 소피 FE 담당

---

## Verification

1. `npx tsc --noEmit` 통과
2. 478개 mp3 재생성·재업로드 확인
3. `audioMarks*` 배열의 `startSec` 합이 실제 mp3 길이와 일치하는지 샘플 확인
4. `placeDetail.ts` 응답에 `audioMarks*` 포함 확인

---

## Implementation Notes

### 2026-09-18: 티켓 분리

BE-FEAT-019(재적재 워크플로우) PR(#51) 리뷰 중 나온 이슈였는데, 스코프가
완전히 달라 분리. 설계는 끝났고 GCP 키 대기 중.
