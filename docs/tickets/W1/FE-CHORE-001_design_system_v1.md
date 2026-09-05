# FE-CHORE-001: 디자인 시스템 v1 전면 적용

피그마 `SAIRO Design System v1`(`670:4197`)이 정리되었으나 코드는 그 이전 기준(본문 13px · `font-light` · 파란 강조색)으로 구현되어 있다. 화면별로 순차 반영한다.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | FE |
| Type | CHORE |
| Severity | Major |
| Layer | Page / Component / Style |
| Status | Todo |
| Screen | S00, S10, S20, 공용 컴포넌트 |
| Depends | FE-FEAT-003 (토큰·타이포 클래스 정의 선행) |

---

## Problem

- **현재 동작**: 화면마다 폰트 크기·굵기·색을 직접 지정. `font-light` 59건, 타이포 스케일 밖 크기 약 50건, 팔레트 밖 색 11종
- **기대 동작**: `globals.css` 의 DS v1 토큰(`ink`·`gray-*`·`ds-surface`)과 타이포 클래스(`.ds-*`)만 사용
- **영향**: 접근성 — DS 문구 "60~70대 사용자를 고려해 Light 를 본문에 쓰지 않고 Regular 이상을 씁니다". 현재 11px·10.5px·10px 본문은 최소 12px 규칙 위반

> DS 문서 자체가 "지금 36개 화면은 본문 13px · 여백 16~26px로 더 촘촘합니다. 위 값은 목표 기준이며, 적용은 화면별로 순차 반영합니다"라고 적고 있다. 코드가 틀렸다기보다 **피그마 화면과 코드가 함께 구버전**이다.

---

## Context

### DS v1 규격

**색** — "색을 쓰지 않습니다. 강조는 잉크 농도와 여백으로만 만듭니다."

| 토큰 | 값 | 용도 |
|---|---|---|
| Ink | `#111213` | 본문 · 버튼 · 선택 |
| Gray 800 | `#35363A` | 선택 테두리 · hover |
| Gray 600 | `#74767C` | 보조 설명 |
| Gray 500 | `#9C9EA4` | 라벨 · 메타 |
| Gray 300 | `#DCDDE0` | 구분선 · 기본 테두리 |
| Gray 200 | `#EDEDEF` | 카드 테두리 |
| Surface | `#F2F2F1` | 선택 배경 · 정보 박스 |

**타이포** — Noto Sans KR · 본문 최소 12px

| 클래스 | 크기 | 스펙 | 용도 |
|---|---|---|---|
| `.ds-display` | 28px | Thin / 140% / −1.5% | 진단 질문 · 화면 제목 |
| `.ds-headline` | 22px | Medium / 145% / −2.0% | 코스 제목 · 결과 이름 |
| `.ds-title-1` | 16px | Regular / 150% / −1.0% | 카드 제목 · 장소명 |
| `.ds-title-2` | 15px | Medium / 150% / −1.0% | 리스트 제목 · 선택지 |
| `.ds-body-1` | 15px | Regular / 175% | 본문 · 설명 |
| `.ds-body-2` | 14px | Regular / 170% | 보조 본문 · 메타 |
| `.ds-caption` | 12px | Regular / 165% | 캡션 · 각주 |
| `.ds-label` | 12px | Medium / 150% / +15% | 섹션 라벨 |
| `.ds-numeral` | 15px | Medium / 120% | 시각 · 거리 · 개수 |

**간격** — 4px 배수

좌우 여백 24px · 상단 첫 요소 32px · 섹션 간격 48px · 블록 간격 32px · 카드 안쪽 24px(리스트 카드 20px) · 카드 사이 12px · 리스트 행 최소 64px · 본문 행간 175% · 구분선 `1px #E8E9EA` · 모서리 12px(칩·배지 999px)

### 대상 파일

| 파일 | `font-light` | 스케일 밖 폰트 | 팔레트 밖 색 |
|---|---|---|---|
| `src/app/place/[id]/page.tsx` | 26 | 21 | 0 |
| `src/app/profile/page.tsx` | 9 | 8 | 5 |
| `src/components/feed/PlaceCard.tsx` | 6 | 7 | 0 |
| `src/app/globals.css` | 0 | 0 | 7 |
| `src/app/page.tsx` (S00) | 4 | 3 | 0 |
| `src/app/feed/page.tsx` | 4 | 2 | 0 |
| `src/components/common/LocaleToggle.tsx` | 2 | 4 | 0 |
| `src/components/quiz/QuizActions.tsx` | 2 | 2 | 0 |
| `src/components/common/LocaleDropdown.tsx` | 2 | 1 | 0 |
| `src/app/layout.tsx` · `BottomTabBar` · `Toast` · `LiveStatusBar` | 각 1 | 각 0~1 | 0~1 |

**완료** — FE-FEAT-003에서 적용: `app/onboarding/page.tsx` · `components/quiz/QuizOption.tsx` · `components/quiz/QuizProgress.tsx` · `components/profile/AxisSlider.tsx`

### 주요 위반

- `#368fff` 파랑 — 팔레트에 없음 (로딩 진행바 · 안내 점)
- `#2a5a48` 딥그린 · `#a06a48` 클레이 — `CLAUDE.md` 기준이나 **DS v1에서 사라짐**
- `#163c8c` 남색 — 팔레트 밖
- `#9aa0a6`·`#5f646a` — DS의 `#9C9EA4`·`#74767C` 와 미세하게 다름
- `13px` 21회 — DS 스케일에 없음. `11px`·`10.5px`·`10px` 는 최소 12px 위반

---

## Scope

### 포함

- 화면별 순차 적용: S00 → S10(피드 + PlaceCard) → S20(장소 상세) → 공용 컴포넌트
- `globals.css` 구버전 토큰(`accent`·`sub-accent`·`muted`·`sub-text`·`border`·`surface`) 정리 — DS 토큰으로 흡수 후 제거
- `CLAUDE.md` 디자인 시스템 표를 DS v1 기준으로 갱신 (딥그린·클레이 제거 여부 포함)

### 제외

- S01·S02 (FE-FEAT-003에서 완료)
- 레이아웃 구조 변경 — 색·타이포·간격만
- 신규 화면

---

## Strategy

화면 단위로 나눠 커밋한다. 각 화면마다 적용 전후 스크린샷을 남겨 시각적 회귀를 확인한다.

1. `globals.css` 구버전 토큰 정리
2. S00 랜딩
3. S10 피드 + `PlaceCard` + `LiveStatusBar` + `BottomTabBar`
4. S20 장소 상세 (가장 큼 — 47건)
5. 공용 컴포넌트 (`LocaleToggle`·`LocaleDropdown`·`Toast`·`QuizActions`)
6. `CLAUDE.md` 갱신

---

## Acceptance Criteria

- [ ] `font-light`·`font-thin` 0건
- [ ] `text-[Npx]` 가 전부 DS 스케일(28·22·16·15·14·12) 안에 있거나 `.ds-*` 클래스 사용
- [ ] 하드코딩 색이 DS 팔레트 7색 안에만 존재
- [ ] 여백이 4px 배수
- [ ] 화면별 적용 전후 스크린샷 비교로 의도치 않은 회귀 없음
- [ ] `npm run build` 통과

---

## 확인 필요

- **`CLAUDE.md` 의 딥그린 `#2A5A48` · 클레이 `#A06A48` 를 폐기할 것인가** — DS v1은 "브랜드 컬러를 따로 두지 않는다"고 명시. 유나 확인 필요
- 피그마 화면들도 아직 DS v1을 반영하지 않았다(카드 안쪽 18px, 질문 약 19px 등). **코드를 DS 기준으로 갈지 피그마 실측 기준으로 갈지** 확정 필요 — 현재는 DS 기준으로 진행하기로 함
