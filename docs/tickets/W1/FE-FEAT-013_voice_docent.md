# FE-FEAT-013: S20 음성 도슨트

```
S20 히어로 오른쪽 위 — 장소 이야기를 귀로 듣는다
```

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | FE |
| Type | FEAT |
| Severity | Medium |
| Layer | Component |
| Status | Backlog |
| Screen | S20 |
| Depends | FE-FEAT-010 (S20 화면) · 음원 URL · 팀 결정 |

---

## Problem

목업(`mockup_v6.html`)에 음성 버튼 자리가 있지만, 무엇을 재생할지 정해지지 않았다.

---

## Context

### 원고는 있다 — DB_02 시트

| 칸 | 평균 | 쓰임 후보 |
|---|---|---|
| `cultureGuideText_ko (도슨트_간단히)` | 77자 | 30초 |
| `cultureGuideText_ko (도슨트_자세히)` | 162자 | 3분 |
| `cultureGuideText_en` | 446자 | 영문 — 자세히의 번역 |

영문 `간단히` 칼럼은 없다.

### 음원은 없다

`audioUrl30sKo` · `audioUrl30sEn` · `audioUrl3minKo` · `audioUrl3minEn` — TTS 로 만들어
URL 을 채우는 안이 있다(에린). 2026-09-15 기준 칼럼 없음.

---

## 착수 전 정할 것

| # | 질문 | 후보 |
|---|---|---|
| 1 | 넣는가 | TTS 음원 · 제출 전엔 `준비 중` |
| 2 | 길이 | 30초 · 3분 · 둘 다 |
| 3 | 영문 30초 | 원고를 새로 쓰는가 · 3분만 두는가 |
| 4 | 전달 방식 | BE-FEAT-013 계약에 `audioUrl*` 추가 |

---

## Scope

### 포함

- 히어로 오른쪽 위 버튼 · 재생/정지 · 로케일에 맞는 음원
- 음원이 없는 장소는 버튼을 그리지 않는다

### 제외

- 음원 생성 · 업로드
- 백그라운드 재생 — 포그라운드만 원칙

---

## Acceptance Criteria

- [ ] 음원이 있는 곳에서만 버튼이 보인다
- [ ] 화면을 떠나면 재생이 멈춘다
- [ ] 스크린리더가 버튼 상태(재생 중/정지)를 읽는다

---

## Derived Artifact Naming Rule

```text
티켓 ID:     FE-FEAT-013
파일명:      FE-FEAT-013_voice_docent.md
브랜치명:    feat/voice-docent
```
