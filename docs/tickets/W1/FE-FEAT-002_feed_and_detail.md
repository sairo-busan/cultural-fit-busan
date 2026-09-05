# FE-FEAT-002: 추천 피드 + 장소 상세 (S10 · S20)

CFP 프로필 기반 개인화 추천 피드(S10)와 장소 상세 허브(S20)를 구현한다. S02 → S10 → S20이 핵심 동선.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | FE |
| Type | FEAT |
| Severity | Critical |
| Layer | Page / Component |
| Status | Done |
| Screen | S10, S20 |
| Depends | BE-FEAT-001 (에린, PR #2 — Place/RecommendedPlace 타입, 머지 완료) |
| Related | FE-FEAT-001 (S00·S01·S02 온보딩, PR #1 머지 완료) |

---

## Problem

- **현재 동작**: `/feed`에 placeholder만 존재. `/place/[id]` 경로 미존재
- **기대 동작**: S10 개인화 추천 피드 (상황 배너 + 코스 카드 + 장소 카드 그리드) → S20 장소 상세 (적합도 근거 + 실시간 막대 + 장소 특성 + 문화 가이드·방문 전 체크 진입)
- **영향 범위**: `src/app/feed/`, `src/app/place/[id]/`, 신규 컴포넌트

---

## Context

```
관련 파일:
- src/types/place.ts (에린 BE-FEAT-001에서 정의 — Place, RecommendedPlace)
- src/data/mock-places.ts (목데이터, 에린 Place 타입 기반)

신규 생성:
- src/app/feed/page.tsx (S10)
- src/app/place/[id]/page.tsx (S20)
- src/components/feed/PlaceCard.tsx
- src/components/common/BottomTabBar.tsx

기존 활용:
- src/components/common/AppHeader.tsx (FE-FEAT-001에서 생성)
- src/hooks/useLocalStorage.ts
- src/lib/cfp.ts (buildCfpProfile)

외부 의존:
- 피그마 V2: S10 홈 (455:253), S20 장소 상세 (456:253), PlaceCard (335:2076)
- 추천 알고리즘 명세서 v2.0 (§3 Coverage, §8 상태 지표 막대, §10 개인화 카테고리, §11 추천 이유)
- 에린 추천 API (미확정 — 초기엔 목데이터로 선행)
```

---

## Scope

> **8/27 기준**: 피그마 확정본이 APP 섹션임을 확인하여, V2 기준 → APP 기준으로 전면 재작업.

### S10 추천 피드 (APP S10 기준)

**A. Header**
- "Cultural Fit Busan" 로고 + 햄버거 메뉴(S50, 구 S05 · W2 구현 예정)
- AppHeader 컴포넌트 재사용 (onMenu prop 추가)

**B. LiveStatusBar**
- 실시간 상태 표시 (날씨 + 기준 위치)
- live-pulse 애니메이션 도트
- 별도 컴포넌트 분리 (W2 날씨 API 교체 용이)

**C. 위치 기반 제목 + 상황 부제**
- "해운대에서 지금" + "비가 와서 실내부터, 도보 10분 안쪽으로 골랐어요"
- W1 하드코딩 → W2 GPS + 날씨 API 연동

**D. 카테고리 칩**
- 가로 스크롤, rounded-full 알약형
- W1 하드코딩 4개 → W2 추천 엔진 동적 생성

**E. 장소 카드 세로 리스트**
- PlaceCard: 전폭 카드 (rounded-[16px] + border)
- 카테고리 태그 + 한국어/영문명 + 매칭% + 개인화 설명 + 도보 N분 + 태그 칩
- 호버(올라오기+이미지 줌) / 클릭(눌림) 애니메이션

**F. 하단 탭 바**
- 주변 · 탐색 · 저장 · 내 정보

### S20 장소 상세 (APP S20 기준)

**G. Topbar**
- AppHeader(onBack + logo + onMenu) 재사용

**H. 히어로 이미지**
- 좌우 마진 + rounded-[16px]

**I. 장소 정보**
- 카테고리 태그 + 한국어명 + 영문명 + 주소 · 운영시간

**J. 매칭 섹션**
- `{fitScore}% 잘 맞아요` + "내 여행 스타일 기준"
- 매칭 태그 (rounded-full 칩) + 개인화 설명

**K. BEFORE YOU GO**
- tipHeadline + pro (rounded-[12px] bg-surface 카드)
- tipType 기반 라벨

**L. 대안 장소**
- alternativeIds → findPlaceById → 카드 2개 (rounded-[8px] 썸네일)

**M. 지금 이곳은 (4축)**
- 혼잡도 · 운영 · 날씨 · 거리
- DotBar(rounded-full 알약형) + status + note

**N. 이 장소는 (3축 고정)**
- 소음도 · 예산 · 로컬

**O. 이용 방법**
- howToUse[] 3단계 (원형 번호 bg-accent/10)

**P. 방문객 후기**
- reviewGood / reviewBad / reviewTip

**Q. 기본 정보**
- 주차 / 영어 / 혼잡

**R. 하단 액션**
- 저장(rounded-[12px]) / 길찾기(카카오맵 외부 링크, rounded-[12px])
- sticky bottom + backdrop-blur

**S. 출처**
- 한국관광공사 OpenAPI + 공개 리뷰 큐레이션

### 제외

- S22 문화 가이드 상세 (구 S21 · 별도 티켓)
- S21 방문 전 체크 (구 S30 · 별도 티켓)
- 실시간 날씨·GPS 연동 (W2)
- S11 검색·필터
- 개인화 카테고리 동적 생성 (추천 API 이후)
- next-intl
- 코스 추천 알고리즘

---

## Strategy

### Step 1: 에린 Place 타입 적용 + 목데이터 변환
- `src/types/place.ts`: BE-FEAT-001 (PR #2) 정의 그대로 사용
- `src/data/mock-places.ts`: 플랫 구조 + nullable 필드 + `RecommendedPlace`로 변환
- 기존 중첩 구조(`axes.noiseLevel`) → 플랫(`noiseLevel`)

### Step 2: S10 컴포넌트 + 페이지
- PlaceCard (`RecommendedPlace` 기반), BottomTabBar
- feed/page.tsx 조합

### Step 3: S20 페이지
- place/[id]/page.tsx
- 히어로 + FitReason + 막대(실시간 4축 + 특성 3축) + 하단 카드 + CTA
- `placeType` 한국어 값 기반 TraitBars 분기

### Step 4: 빌드 + 흐름 검증
- S10 → S20 → 뒤로 왕복
- 빌드/린트 통과

---

## Acceptance Criteria

### S10
- [x] S02 "안내 시작하기" / S00 "둘러보기" → S10 진입
- [x] AppHeader: Cultural Fit Busan 로고 + 햄버거 메뉴
- [x] LiveStatusBar: 실시간 상태 + pulse 애니메이션
- [x] 카테고리 칩 가로 스크롤 (rounded-full)
- [x] PlaceCard 세로 리스트 (전폭 카드 + 영문명 + 매칭% + 태그 칩)
- [x] PlaceCard 탭 → S20 이동
- [x] 카드 호버/클릭 애니메이션

### S20
- [x] AppHeader(onBack + logo + onMenu) 재사용
- [x] 히어로 이미지 (rounded-[16px])
- [x] 장소 정보: 카테고리 + 한국어/영문명 + 주소
- [x] 매칭: fitScore% + 태그 칩 + 개인화 설명
- [x] BEFORE YOU GO 카드
- [x] 대안 장소 2곳
- [x] 지금 이곳은 4축 (DotBar 알약형)
- [x] 이 장소는 3축 고정 (소음도/예산/로컬)
- [x] 이용 방법 3단계
- [x] 방문객 후기 (좋았던 점/아쉬운 점/알아두기)
- [x] 기본 정보 (주차/영어/혼잡)
- [x] 저장/길찾기 (sticky + blur + rounded-[12px])
- [x] ← 뒤로 → S10 복귀
- [x] 존재하지 않는 ID → 에러 처리

### 공통
- [x] `npm run build` 통과
- [x] `npm run lint` 통과 (변환 대상 파일 기준)
- [x] next.config images.remotePatterns에 visitkorea.or.kr 등록

---

## Testing Rules

- [ ] `npm run build` 통과
- [ ] `npm run lint` 통과
- [ ] `/feed` 직접 접근 → 렌더링
- [ ] S10 → PlaceCard 탭 → S20 → ← → S10 왕복
- [ ] 프로필 없는 상태에서 S10 접근 → 에러 없음
- [ ] 저장 토글 후 새로고침 → 상태 유지
- [ ] 목데이터 전 장소 S20 렌더링 확인
- [ ] coverage < 70인 장소 → 문화 가이드·방문 전 체크 숨김

---

## Verification

1. `npm run build` + `npm run lint` 통과
2. `localhost:3000/feed` → S10 렌더링
3. PlaceCard 탭 → S20 이동
4. 히어로 + 막대 + 하단 카드 확인
5. ♡ 저장 토글 → localStorage 확인
6. ← 뒤로 → S10 복귀
7. `/place/nonexistent` → 에러 처리

---

## Implementation Notes

### 2026-08-24: 착수 + 변환 완료

**브랜치**: `feat/feed-and-detail` (origin/main 기준)

#### 타입 변환 (에린 Place 타입 적용)

- Place 타입: 에린 BE-FEAT-001 (PR #2) 플랫 구조 사용
  - 기존 드래프트의 중첩 구조(axes/situation/content) → 최상위 필드로 변환
  - `placeCategory`(영어) → `placeType`(한국어: 식음형/시장형/해양야경형/문화역사형)
  - placeTags 유래 필드 전부 nullable
  - `PlaceCardData` 제거 → `RecommendedPlace` (Place + fitScore/reasons/tags/distanceMin) 사용

#### 변환 완료 파일 (7개)

| 파일 | 상태 | 변경 내용 |
|---|---|---|
| `src/types/place.ts` | 신규 | 에린 Place/RecommendedPlace 타입 (origin/main 동기화: tags, weatherType "both") |
| `src/data/mock-places.ts` | 신규 | 플랫 구조 + nullable + 이미지 URL 교체 + tags/reasons 분리 + findRecommendedById |
| `src/app/feed/page.tsx` | 수정 | MOCK_RECOMMENDED 사용 + hydration mismatch 수정 |
| `src/app/place/[id]/page.tsx` | 신규 | RecommendedPlace 기반 + 히어로 데이터 바인딩 (fitScore/distanceMin) |
| `src/components/feed/PlaceCard.tsx` | 신규 | RecommendedPlace 타입 + tags 필드 (S10 카드용 짧은 라벨) |
| `src/components/common/BottomTabBar.tsx` | 신규 | 하단 탭 바 |
| `next.config.ts` | 수정 | images.remotePatterns에 visitkorea.or.kr 등록 |

#### 수정 이슈

- **이미지 404**: visitkorea.or.kr 이미지 URL 2개 만료 → TourAPI searchKeyword2로 살아있는 URL 확보하여 교체
- **Hydration mismatch**: useLocalStorage가 서버/클라이언트 값 불일치 → mounted 상태 체크로 CFP 뱃지 렌더링 지연

#### 데이터 현황

- 전부 목데이터 (API 호출 없음)
- 장소 4건, fitScore/distanceMin 목데이터 바인딩 (UI 하드코딩 아님)
- 실시간 막대 운영/날씨/거리 value는 하드코딩 (W2 실시간 API/GPS 연동 시 교체)
- 에린 추천 API 연동 시 목데이터 교체 예정

#### 유나 노션 (CFP v3.1) 확인 결과

- NOTION_TOKEN_V2로 접근 성공
- 문서: "[최신 정본] CFP 추천 로직 — 개발자용 v3.1" + "[최신 정본] CFP v3.1 — Cultural Fit Profile 명세서"
- S10/S20 화면 코드에 직접 영향 없음 (CFP 프로필은 표시만, 추천 계산 안 함)
- cfp.ts/quiz.ts 전면 재작성은 추천 엔진 작업 시 별도 진행

---

### 2026-08-27: origin/main 동기화 + S20 데이터 바인딩

#### origin/main 타입 동기화 (PR #2 머지 반영)

- `place.ts`: `weatherType`에 `"both"` 추가, `RecommendedPlace`에 `tags: string[]` 추가, `reasons` 주석 변경
- `mock-places.ts`: 자갈치시장 `weatherType` → `"both"`, `reasons`를 문장형으로 변경, `tags`에 짧은 라벨 분리
- `PlaceCard.tsx`: S10 카드에서 `place.reasons` → `place.tags` 사용
- `tags`: 짧은 라벨, S10 카드용 (예: ["활기", "바다"])
- `reasons`: 문장형 근거, S20 상세 설명용 (예: ["부산의 활기를 가장 선명하게 느끼는 곳", ...])

#### S20 히어로 데이터 바인딩

- `findRecommendedById` 함수 추가 (MOCK_RECOMMENDED에서 검색)
- `place/[id]/page.tsx`: `findPlaceById`(Place) → `findRecommendedById`(RecommendedPlace)
- 히어로 `94% MATCH · 출발 17분 · 70분 코스` 하드코딩 → `{fitScore}% MATCH · 출발 {distanceMin}분` 동적 바인딩
- 코스 시간: 코스 기능 미구현으로 제거

#### 피그마 확인

- V1(APP 섹션)과 V2 공존 확인 — 구현은 V2 기준
- 유나 신규 화면 12개 확인 (S15~S28: 코스 피드, 스와이프, 도슨트, 실시간 안내 등)
- 신규 화면은 W1 범위 밖, 유나와 합의 필요

---

### 2026-08-27: APP 피그마 기준 전면 재작업

#### 피그마 확정본 확인

- V2 섹션이 아닌 **APP 섹션**이 확정본임을 확인
- S10, S20 모두 APP 기준으로 전면 재작업

#### Place 타입 확장

- `titleEn`, `howToUse`, `reviewGood/Bad/Tip`, `parking`, `alternativeIds` 추가
- 기존 에린 코드 호환 위해 optional(`?:`) 필드로 선언
- 4개 장소 목데이터에 신규 필드 채움

#### S20 재작업 (14개 섹션)

- Topbar → AppHeader 재사용 (onBack + logo + onMenu)
- 히어로 rounded-[16px], BEFORE YOU GO 카드화, 대안 장소 2곳
- DotBar 알약형, 이용 방법 원형 번호, 하단 액션 sticky+blur
- 저장/길찾기 버튼 rounded-[12px]

#### S10 재작업

- 코스 카드 제거, "당신을 위한 장소" 섹션 제거
- 세로 리스트 전환, 카테고리 칩 가로 스크롤
- LiveStatusBar 별도 컴포넌트 (live-pulse 애니메이션)
- PlaceCard 카드 스타일 (border + rounded + 호버/클릭 애니메이션)

#### 공용 컴포넌트

- AppHeader: onMenu prop + 햄버거 아이콘 + safe area 패딩 통일
- BottomTabBar: "홈" → "주변" 탭명 변경

#### CLAUDE.md

- 디자인 시스템: border-radius 제약 제거
