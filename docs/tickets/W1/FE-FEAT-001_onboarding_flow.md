# FE-FEAT-001: 온보딩 플로우 (S00~S02)

랜딩 → 진단 6문항 + Hard Filter → 프로필 결과 카드까지의 완결 사용자 흐름을 구현한다.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | FE |
| Type | FEAT |
| Severity | Critical |
| Layer | Page / Component / Hook / Type |
| Status | Done |
| Screen | S00, S01-1~7, S02 |
| Depends | - |
| Related | - |

---

## Problem

- **현재 동작**: `src/app/page.tsx`에 정적 HTML만 존재. 언어 선택 버튼이 시각적으로만 있고 상태 변경 없음. CTA 버튼 클릭 시 아무 동작 없음. 온보딩 진단 화면 없음. CFP 유형 환산 로직 없음. 프로필 결과 화면 없음. 후속 라우트(`/onboarding`, `/feed`) 미존재
- **기대 동작**: S00 언어 선택 + CTA 라우팅 → S01 6문항 진단 + Hard Filter → CFP 16유형 환산 → S02 프로필 결과 (유형명 + 4축 슬라이더 + 안내 방식) → "안내 시작하기"로 피드 이동
- **영향 범위**: `src/app/page.tsx`, `src/app/onboarding/`, `src/app/profile/`, 공용 컴포넌트, 훅, CFP 타입 정의

---

## Context

```
관련 파일:
- src/app/page.tsx (S00 — 구현 완료)
- src/app/onboarding/page.tsx (S01 — 수정)
- src/hooks/useLocalStorage.ts (기존 훅 재사용)
- src/app/globals.css (디자인 토큰)

신규 생성:
- src/app/onboarding/ 하위 구조 (퀴즈 UI)
- src/app/profile/page.tsx (S02 프로필 결과)
- src/components/quiz/ (퀴즈 공용 컴포넌트)
- src/components/profile/AxisSlider.tsx (4축 슬라이더)
- src/types/cfp.ts (CFP 타입 정의)
- src/lib/cfp.ts (CFP 환산 로직 — 임시 클라이언트)
- src/data/quiz.ts (퀴즈 문항 상수 + 기본값)
- src/data/profile.ts (프로필 표시 데이터)

외부 의존:
- 피그마 V1: S01-1(416:226), S01-2(416:263), S01-3(177:146), S01-4(177:193), S01-5(177:287), S01-6(177:240), S01-7(243:203), S02(32:46)
- docs/cfp_16유형_체계.md (4축 이분법 → 16유형 환산)
```

---

## Scope

### A. S00 랜딩 (Done)

- V1 피그마 기준 UI (24px 타이틀, 12.5px 설명, 62px CTA)
- 언어 선택 KO/EN (useLocalStorage)
- CTA 라우팅: "내 여행 스타일 찾기" → `/onboarding`, "둘러보기" → `/feed`

### B. S01 온보딩 6문항 + Hard Filter

**공용 UI 패턴** (피그마 공용 컴포넌트 기반)
- Topbar: ← 뒤로 + "건너뛰고 프리셋 고르기" (S01-7은 "건너뛰기")
- Progress: "STEP XX / 06" (Cormorant Garamond 13px) + 4-segment bar (blue #368fff)
- Question: label (9.5px, uppercase, tracking 2.47px) + title (31px, thin) + description (13px, light)
- Option: selected(dark border #35363a + blue dot 8px + rounded-[8px]) / default(light border #ecedee)
- Option 내부: title 17px regular + description 12.5px light
- Actions: 이전(white 66px) | 다음(black 66px), 구분 1px #ecedee

**6문항 데이터**

| Step | 화면 | label | title | 선택지 | CFP 축 |
|---|---|---|---|---|---|
| 01 | S01-1 | 여행 · COMPANION | 누구와 함께 오셨나요? | 혼자 / 연인과 / 친구와 / 가족과 (4개) | 메타데이터 |
| 02 | S01-2 | 이동 · WALKING | 오늘 얼마나 걸으실 수 있나요? | 가까운 곳 위주로(10분) / 적당히(15분) / 많이 걸어도 괜찮아요(20분) | 거리 필터 |
| 03 | S01-3 | 분위기 · ATMOSPHERE | 어떤 분위기를 좋아하세요? | 조용한 / 둘 다 / 활기찬 | Q/V 축 |
| 04 | S01-4 | 장소 · PLACE TYPE | 어떤 장소에 더 끌리세요? | 유명하고 익숙한 곳 / 반반이요 / 현지인이 다니는 낯선 곳 | L/F 축 |
| 05 | S01-5 | 동선 · PACE | 여행 동선은 어떤 편이세요? | 한두 곳에서 오래 머물기 / 적당히요 / 최대한 많이 돌아보기 | S/W 축 |
| 06 | S01-6 | 음식 · PALATE | 매운 음식은 어디까지 괜찮으세요? | 순한 편이 좋아요 / 조금 매운 정도까지 / 매운 것도 괜찮아요 | M/H 축 |

**S01-7 Hard Filter** (음식 상세)
- Topbar: ← + "건너뛰기" (프리셋 아님)
- 3개 섹션: 못 먹는 것(복수선택) + 비건 여부(단일) + 어디서 드실래요(단일)
- 버튼: "완료" (다음 아님)

**상태 관리**
- 6문항 응답: `useLocalStorage`로 저장 (key: `cfb-quiz-answers`)
- 이전/다음 네비게이션: step 상태로 화면 전환 (라우트 분리 X, 단일 페이지 내 step)
- "건너뛰고 프리셋 고르기": S02로 직접 이동 (프리셋 선택 UI는 이 티켓 범위 외, placeholder 처리)

### C. S02 프로필 결과

- Topbar: "Cultural Fit Busan" + "다시 하기" + 햄버거 메뉴
- Result: "MY TRAVEL PROFILE" label + 유형명 (30px) + 한 줄 설명 (13px) + 동반인·걷기 정보 (12px)
- 4축 슬라이더: 분위기(고요↔활기) · 로컬(현지↔익숙) · 음식(순함↔매움) · 이동(여유↔활보)
- "이렇게 안내하겠습니다" 가이드 4항목 (축별 안내 방식)
- Next notice: blue dot + 위치 기반 안내 문구
- CTA: "안내 시작하기" (full-width, 66px black) → `/feed`
- "다시 하기" → `/onboarding` (응답 초기화)

### 제외

- next-intl 연동 (별도 티켓)
- 추천 피드 UI (FE-FEAT-002)
- 프리셋 선택 UI ("건너뛰고 프리셋 고르기" 클릭 시 실제 선택 화면)
- 위치 기반 안내 문구 동적 생성 (S02 하단 — 하드코딩)
- status bar / system nav (OS 제공 영역)

---

## Strategy

### Step 1: CFP 타입 정의

- `src/types/cfp.ts`
- Locale, QuizAnswer, QuizStep, CfpAxis, CfpProfile 등
- 6문항 데이터 상수 (질문·선택지·축 매핑)

### Step 2: 퀴즈 공용 컴포넌트

- `src/components/quiz/QuizOption.tsx` — selected/default 상태
- `src/components/quiz/QuizProgress.tsx` — STEP counter + 4-segment bar
- `src/components/quiz/QuizActions.tsx` — 이전/다음(완료) 버튼

### Step 3: S01 온보딩 페이지

- `src/app/onboarding/page.tsx`를 퀴즈 UI로 교체
- step 상태로 6문항 순차 렌더링
- 응답 저장: useLocalStorage
- S01-7 Hard Filter는 별도 UI 패턴 (복수선택 + 단일선택 혼합)

### Step 4: CFP 유형 환산 로직

- 6문항 응답 → 4축 값 결정 → 16유형 코드 생성
- `docs/cfp_16유형_체계.md` 기준
- 3지선다 중간값("둘 다", "반반", "적당히") 처리 규칙 결정 필요

### Step 5: S02 프로필 결과 페이지

- `src/app/profile/page.tsx`
- CFP 유형 코드에 따라 유형명·설명·가이드 동적 렌더링
- 4축 슬라이더 시각화
- CTA 라우팅

### Step 6: 빌드 + 검증

- `npm run build` 통과
- 개발 서버에서 전체 흐름 확인

---

## Acceptance Criteria

### S00 (Done)
- [x] 언어 선택 KO/EN 토글 + localStorage 유지
- [x] CTA 라우팅 동작
- [x] `npm run build` 통과

### S01
- [x] 6문항 순차 진행 (이전/다음 네비게이션)
- [x] 각 문항 선택 시 selected 스타일 전환
- [x] 응답 localStorage 저장 + 새로고침 유지
- [x] Progress bar 스텝별 채워짐
- [x] S01-7 Hard Filter 복수선택 동작
- [x] "건너뛰고 프리셋 고르기" → S02 이동

### S02
- [x] 6문항 응답 기반 CFP 유형 계산 + 유형명 표시
- [x] 4축 슬라이더 시각화
- [x] "이렇게 안내하겠습니다" 가이드 동적 렌더링
- [x] "안내 시작하기" → `/feed` 이동
- [x] "다시 하기" → `/onboarding` 이동 + 응답 초기화
- [x] CFP 환산은 임시 클라이언트 로직 (에린 API 완성 시 교체)
- [x] 16유형 메타데이터(유형명·설명)는 placeholder (유나 확정 필요)

### 공통
- [x] `npm run build` 통과
- [x] `npm run lint` 통과
- [ ] docs/ 신규·수정 문서에 출처 섹션 포함

---

## Testing Rules

- [ ] `npm run build` 통과
- [ ] `npm run lint` 통과
- [ ] S00 → S01 → S02 → /feed 전체 흐름 동작
- [ ] S01 이전/다음 네비게이션 정상 동작
- [ ] S01 중간에 새로고침 → 응답 유지
- [ ] S02 유형 계산 결과 정확성 (최소 3가지 조합 검증)
- [ ] "다시 하기" → 응답 초기화 + S01 처음으로

---

## Verification

1. `npm run build` 통과
2. `npm run lint` 통과
3. `localhost:3000` → "내 여행 스타일 찾기" 클릭
4. S01 6문항 순차 진행 + 선택 스타일 확인
5. S01-7 Hard Filter 복수선택 확인
6. S02 유형명 + 4축 슬라이더 확인
7. "안내 시작하기" → /feed 이동 확인
8. "다시 하기" → S01 처음으로 복귀 확인
9. 중간 새로고침 → 응답 유지 확인

---

## Implementation Notes

### 2026-08-23: S00 구현 완료

- useLocalStorage 훅 생성 (Zustand 대신 localStorage 직접 사용)
- V1 피그마 기준 UI 업데이트 + 언어 선택 + CTA 라우팅 연결
- /onboarding, /feed placeholder 페이지 생성
- 커밋: `ba46c10`, `122ce85`

### 2026-08-23: S01 퀴즈 UI + Hard Filter 구현 (Step 1~3)

- `src/types/cfp.ts`: CFP 전체 타입 정의 (QuizAnswers, HardFilter, CfpAxes, CfpProfile 등)
- `src/data/quiz.ts`: 6문항 + Hard Filter 3섹션 상수 (피그마 텍스트 그대로)
- `src/components/quiz/`: QuizProgress(6세그먼트), QuizOption, QuizActions
- `src/app/onboarding/page.tsx`: step 1-6 퀴즈 + step 7 Hard Filter 폼 패턴
- Progress bar 4→6세그먼트 변경 (피그마는 4였으나 UX 판단으로 6으로)
- 커밋: `e2e9b38`

### 2026-08-23: CFP 유형 환산 로직 (Step 4)

- `src/lib/cfp.ts`: calculateAxes, getCfpTypeCode, buildCfpProfile
- 매핑: Q2(걷기)+Q5(체류) 평균→Pace축, Q3→Atmosphere, Q4→LocalDepth, Q6→Palate
- Q1(동반인)은 축 아님, 추천 컨텍스트 메타데이터로만 저장
- 중립값(3) 처리: 보수적 쪽(Q, F, M, S)으로 귀결
- 16유형 메타데이터(nameKo, nameEn, description) + 프리셋 3종 포함
- 커밋: `397a5c6`

### 2026-08-24: 출처 명시 + 임시 로직 표기

- `docs/cfp_16유형_체계.md`: 출처 섹션 추가 (노션 명세서 v2.0 기반, 8/20 회의 미반영 주의)
- `src/lib/cfp.ts`: 상단에 "에린 API 교체 예정" 임시 로직 주석
- 노션 회의록(8/20) 확인 → CFP 환산은 백엔드 방향, 현재는 S02 표시용 placeholder
- 커밋: `229bf25`

### 2026-08-24: S02 프로필 결과 페이지 (Step 5)

- `src/app/profile/page.tsx`: 피그마 V1(32:46) 기준 전체 화면 구현
- `src/components/profile/AxisSlider.tsx`: 4축 슬라이더 (blue dot + 1-5 위치)
- `src/data/profile.ts`: 동반인/걷기 라벨, 축 슬라이더 설정, 가이드 텍스트
- "다시 하기": localStorage 전체 초기화 + /onboarding 이동
- "안내 시작하기": /feed 이동
- 가이드 텍스트는 placeholder (유나 확정 필요)
- 커밋: `7950fa2`

### 2026-08-24: 상수 정리 + 초기화 버그 수정 + lint fix

- `src/data/quiz.ts`에 DEFAULT_QUIZ_ANSWERS, DEFAULT_HARD_FILTER 통합 (onboarding·profile 중복 제거)
- "다시 하기" 시 window.location.href로 전체 새로고침 (Router Cache 문제 해결)
- 코드 주석 정리: "왜"만 남기고 출처·미래 계획 주석 제거
- 미사용 import(Companion) 제거, router.push 복원
- 커밋: `5145cf7`, `b51743b`
