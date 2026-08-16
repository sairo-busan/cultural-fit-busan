# Cultural Fit Busan (SAIRO)

외국인 대상 부산 문화 적합도 기반 관광 추천 앱
2026 관광데이터 활용 공모전 · Capacitor + Play Store (Android) · 마감 9/21 · 1차 심사 10월

## 아키텍처 원칙

- **로그인 없음** — localStorage로 프로필 저장, Play Store "수집 데이터 없음" 신고 유지
- **서버 없음** — CFP 생성·추천 엔진 모두 클라이언트 사이드, 서버는 TourAPI 프록시 1개뿐
- **DB 없음** — 태깅 데이터는 정적 JSON 파일, Supabase 사용하지 않음
- **포그라운드만** — 백그라운드 위치·FCM 사용 안 함 (Play Store 심사 리스크 제거)

## 기술스택

| 영역 | 기술 | 비고 |
|---|---|---|
| 프론트엔드 | Next.js 15 (App Router) | React 19 · TypeScript |
| 스타일링 | Tailwind CSS 4 | 모바일 퍼스트 |
| 상태 관리 | Zustand + React Query | 프로필: localStorage · 장소: 정적 JSON |
| 지도 | Kakao Maps SDK | 부산 지역 최적화 |
| 외부 API | TourAPI 4.0 (5종) | Vercel API Route 프록시 1개 · API 키 확보 완료 |
| i18n | next-intl | EN/KO 2개 언어 |
| 앱 빌드 | Capacitor | WebView 래핑 · Android Only |
| 배포 | Vercel + Play Store | 웹: Vercel · 앱: Play Store 내부 테스트 |
| 모니터링 | Vercel Analytics | Core Web Vitals |

## 핵심 차별점

문화 충돌 예측 엔진 — CFP(Cultural Fit Profile) 16유형 체계
4축 이분법(분위기Q/V · 로컬L/F · 음식M/H · 이동S/W) → 16유형 코드(CFP-XXXX)

### 타사앱(트리플) 대비 차이

| | 트리플 | SAIRO |
|---|---|---|
| 시제 | 여행 전 계획 | 지금 이 순간 |
| 목록 기준 | 저장한 곳·인기순 | 걸어서 몇 분·지금 영업중 |
| 바뀌는 이유 | 사용자가 편집 | 비 오면·문 닫으면 팝업을 통해 안내 |

### 핵심기능 5개

| | 기능 | 한 줄 |
|---|---|---|
| F1 | 문화 적합도 프로필 진단 | 4문항 이분법으로 CFP 16유형 판정 |
| F2 | 적합도 기반 개인화 추천 | 인기순이 아닌 내 유형 기준 |
| F3 | 문화 충돌 예측 및 방문 전 안내 | 준비 사항 + 대안 2곳 |
| F4 | 문화 이해 가이드 및 실체험 요약 | 이용 방법 3단계 + 3줄 후기 |
| F5 | 현장 실시간 안내 | 근접 알림(인앱) + 도착 안내 + 상황형 루트 |

## 디자인 시스템

에디토리얼 잡지 스타일 (stayfolio 참조) · 카드 테두리·그림자·둥근 모서리 없음

| 토큰 | 값 |
|---|---|
| bg | `#FFFFFF` |
| text | `#111213` |
| accent (딥그린) | `#2A5A48` |
| sub-accent (클레이) | `#A06A48` |
| 본문 | Noto Sans KR 300/200/400 |
| 숫자·영문 강조 | Cormorant Garamond (serif) |

## 팀 구성 (3인)

- 본인: 개발 (풀스택)
- 유나: 기획/행정/디자인(피그마)
- 태무: 행정/데이터

## 주요 참고 문서

- `docs/cfp_16유형_체계.md` — CFP 16유형 체계 (진단·환산·화면 표시 규칙)
- `docs/추천_알고리즘_명세서_v2.md` — 추천 알고리즘 8단계 명세
- `docs/화면_IA.md` — 화면 ID 21개 정의
- `docs/유저플로우.html` — F0~F5 기능별 순서도
- `docs/decisions/capacitor_선택.md` — Capacitor + Play Store 결정 근거
- `docs/wbs_v2_qa.md` — WBS v1→v2 전환 QA 검증 리스트

## Notion

NOTION_TOKEN (`.env` 참조)으로 접근
- WBS v2 DB: `3b8ee5c6-3c52-813d-82f2-c9b2fd125cf9`
- 공모전 문서 페이지: `3b2ee5c6-3c52-808a-b041-cdb81501e8a5`
- 노션 하위 문서: 기능정의서(v3, 9시트 83요소) · 기능설명서 초안(v3) · 추천 알고리즘 명세서(v2.0) · 공모전 제출항목

## 5주 스프린트 (8/10 ~ 9/21)

### W0 · 기반 세팅 (8/10~16) ← 현재

- ✅ 공공데이터포털 인증키 발급
- ✅ GitHub org `sairo-busan` 생성 + 레포 생성
- 🔄 화면 IA 확정 (21개)
- ⬜ Next.js 15 프로젝트 세팅 + Vercel 배포
- ⬜ 디자인 토큰 + 레이아웃 (유나 Figma 기준)
- ⬜ 장소 태깅 JSON 구조 설계 + 시드 데이터
- ⬜ TourAPI 프록시 (Vercel API Route 1개)

### W1 · MVP 코어 — 반드시 (8/17~23)

- ⬜ S00 랜딩 화면
- ⬜ S01-1~4 온보딩 4문항 (이분법 UI)
- ⬜ S01-5 음식 Hard Filter
- ⬜ S02 프로필 결과 카드
- ⬜ CFP 프로필 생성 (클라이언트, Zustand + localStorage)
- ⬜ 추천 엔진 클라이언트 (3단계: 적합도 → 상황 보정 → 리스크 필터)
- ⬜ S10 추천 피드 화면
- ⬜ S20 장소 상세
- ⬜ 장소 태깅 JSON 60건 (권역당 10건)

### W2 · 차별화 — 여유 되면 (8/24~30)

- ⬜ S21 문화 가이드 상세
- ⬜ S30 방문 전 체크 (문화 충돌 예측)
- ⬜ S40 지금 갈 만한 곳 (포그라운드 watchPosition)
- ⬜ S40b 루트 지도 모드 (Kakao Maps)
- ⬜ S42 근접 알림 인앱 UI (500m 배너 + 150m 확장 카드 + haptics 진동)
- ⬜ S44 도착 안내 (50m 진입 시 이용 방법 3단계 — 핵심 차별점)
- ⬜ S05 전체 메뉴
- ⬜ i18n EN/KO (next-intl)
- ⬜ 문화 가이드 콘텐츠 + 실체험 3줄 작성

### W3 · 완성도 + 앱 빌드 (8/31~9/7)

- ⬜ S90 예외 화면 4종
- ⬜ S99 서비스 소개 · 활용 API
- ⬜ Capacitor 빌드 + Android APK 생성
- ⬜ Play Store 내부 테스트 등록
- ⬜ 태깅 100건 확장
- ⬜ 추천 정밀도 튜닝
- ⬜ UI/UX 고도화

### W4 · 제출 (9/8~9/21)

- ⬜ QA + 버그 수정 + 안정화
- ⬜ 화면 캡처 (대표 1장 + 상세 5장)
- ⬜ 기능 흐름도 5개 도식화
- ⬜ 기능설명서 공식 양식 이관
- ⬜ 제출 자료 준비
- ⬜ 최종 제출 (9/17~18 목표)
- ⬜ 서버·도메인 유지 확인

### 발전계획 (제출 후)

- Virtual Walk 데모
- 리뷰 감정 요약
- 전국 확장 구조 설계
- iOS 대응 (사업화 시)
- 백그라운드 위치 + 네이티브 전환

### 심사 기준 대응

- **서비스 기획력 (30점)** — 4문항 이분법 진단 · 3단계 추천 로직 · 문화 충돌 예측(핵심 차별점) · S44 도착 안내
- **서비스 완성도 (30점)** — 추천 피드·장소 상세 · 예외 처리 · 모바일 퍼스트 UI · QA
- **데이터 활용 (20점)** — TourAPI 5종 연동 · 부산 100건+ 태깅 · 포그라운드 위치 · 날씨 보정 · API 출처 명시
- **서비스 발전성 (20점)** — Virtual Walk · 리뷰 감정 요약 · 전국 확장 구조 설계
- **지역특화 가점 (+2점)** — 부산 6개 권역 콘텐츠 · 권역별 장소 태깅 · 부산 특화 문화 가이드

## 코드 규칙

- 커밋 메시지: `feat:`, `fix:`, `chore:` 접두사 (한국어 본문)
- Co-authored 제외
- Named export만 사용
- 에러 메시지 한국어

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
