# Cultural Fit Busan (SAIRO)

외국인 대상 부산 문화 적합도 기반 관광 추천 앱
2026 관광데이터 활용 공모전 · Capacitor + Play Store (Android) · 마감 9/21 · 1차 심사 10월

## 아키텍처 원칙

- **로그인 없음** — localStorage로 프로필 저장, Play Store "수집 데이터 없음" 신고 유지
- **MongoDB** — 로우데이터 배치 적재 + 사용자 이벤트는 실시간 호출 (하이브리드)
- **포그라운드만** — 백그라운드 위치·FCM 사용 안 함 (Play Store 심사 리스크 제거)

## 기술스택

| 영역 | 기술 | 비고 |
|---|---|---|
| 프론트엔드 | Next.js 16 (App Router) | React 19 · TypeScript |
| 스타일링 | Tailwind CSS 4 | 모바일 퍼스트 |
| 상태 관리 | Zustand + React Query | 프로필: localStorage · 장소: MongoDB |
| DB | MongoDB | 로우데이터 배치 적재 · 에린 설계 |
| 스토리지 | Cloudflare R2 (검토 중) | 10GB 무료 · egress 무료 · 우선 API URL 직접 사용 |
| 지도 | Kakao Maps SDK | 부산 지역 최적화 |
| 외부 API | TourAPI 4.0 (6종) | 배치 + 실시간 하이브리드 · API 키 확보 완료 |
| i18n | next-intl | EN/KO 2개 언어 |
| 앱 빌드 | Capacitor | WebView 래핑 · Android Only |
| 배포 | Vercel + Play Store | 웹: Vercel · 앱: Play Store 내부 테스트 |
| 모니터링 | Vercel Analytics | Core Web Vitals |

## 핵심 차별점

문화 충돌 예측 엔진 — **CF8(Cultural Fit) 8유형 체계**
3축 2지선다(분위기 C/E · 장소 L/F · 경험 D/V) → 8유형 코드(`CLD`~`EFV`)
화면에는 코드·점수를 노출하지 않고 유형명과 3축 요약만 표시 (정본 규칙)

### 타사앱(트리플) 대비 차이

| | 트리플 | SAIRO |
|---|---|---|
| 시제 | 여행 전 계획 | 지금 이 순간 |
| 목록 기준 | 저장한 곳·인기순 | 걸어서 몇 분·지금 영업중 |
| 바뀌는 이유 | 사용자가 편집 | 비 오면·문 닫으면 팝업을 통해 안내 |

### 핵심기능 5개

| | 기능 | 한 줄 |
|---|---|---|
| F1 | 문화 적합도 프로필 진단 | 3문항 2지선다로 CF8 8유형 판정 |
| F2 | 적합도 기반 개인화 추천 | 인기순이 아닌 내 유형 기준 |
| F3 | 문화 충돌 예측 및 방문 전 안내 | 준비 사항 + 대안 2곳 |
| F4 | 문화 이해 가이드 및 실체험 요약 | 이용 방법 3단계 + 3줄 후기 |
| F5 | 현장 실시간 안내 | 근접 알림(인앱) + 도착 안내 + 상황형 루트 |

## 디자인 시스템

에디토리얼 잡지 스타일 (stayfolio 참조)

| 토큰 | 값 |
|---|---|
| bg | `#FFFFFF` |
| text | `#111213` |
| accent (딥그린) | `#2A5A48` |
| sub-accent (클레이) | `#A06A48` |
| 본문 | Noto Sans KR 300/200/400 |
| 숫자·영문 강조 | Cormorant Garamond (serif) |

## 팀 구성 (4인)

| 이름 | 역할 | 비고 |
|---|---|---|
| 유나 | 기획 · 디자인 · 라벨링 | 피그마 완성, 태깅 시트 |
| 소피 | 웹 화면 UI | 피그마 → 코드, 라우팅, 컴포넌트 |
| 에린 | 추천 엔진 + 백엔드 + 검색 | DB 구조, API 연동, 엔진 로직 |
| 태무 | 비즈니스 컨설턴트 | 도메인: 은행 · 서비스 방향 · 기능 우선순위 자문 |

## 주요 참고 문서

- `docs/cfp_16유형_체계.md` — CFP 16유형 체계 (진단·환산·화면 표시 규칙)
- `docs/추천_알고리즘_명세서_v2.md` — 추천 알고리즘 8단계 명세
- `docs/화면_IA.md` — 화면 ID 정의 (피그마 IA **v4.0** 정본 + v2.0 재매핑 표)
- 유저플로우 — 피그마 `Page 2_최종` 의 `UXF · 유저플로우`(`800:395`) · `UXF2 · 00 읽는 법`(`899:395`) · `00 전체 흐름도`(`907:395`) · FLOW별 프레임
- `docs/decisions/capacitor_선택.md` — Capacitor + Play Store 결정 근거
- `docs/wbs_v2_qa.md` — WBS v1→v2 전환 QA 검증 리스트
- `docs/현황_스냅샷_2026-09-03.md` — 코드·피그마 실물 대조 현황
- `docs/decisions/진단체계_CF8_전환_검토.md` — CFP16 → CF8 전환 비용·태깅시트 분석·9/4 결정 항목

## Notion

NOTION_TOKEN (`.env` 참조)으로 접근
- WBS v2 DB: `3b8ee5c6-3c52-813d-82f2-c9b2fd125cf9`
- 공모전 문서 페이지: `3b2ee5c6-3c52-808a-b041-cdb81501e8a5`
- 노션 하위 문서: 기능정의서(v3, 9시트 83요소) · 기능설명서 초안(v3) · 추천 알고리즘 명세서(v2.0) · 공모전 제출항목

## 5주 스프린트 (8/10 ~ 9/21)

### W0 · 기반 세팅 (8/10~16)

- ✅ 공공데이터포털 인증키 발급
- ✅ GitHub org `sairo-busan` 생성 + 레포 생성
- 🔄 화면 IA 확정 (21개)
- 🔄 Next.js 16 프로젝트 세팅 + Vercel 배포
- ⬜ 디자인 토큰 + 레이아웃 (유나 Figma 기준)
- ⬜ 장소 태깅 JSON 구조 설계 + 시드 데이터
- ⬜ TourAPI 프록시 (Vercel API Route 1개)

### W1 · MVP 코어 — 반드시 (8/17~23) ← 현재

- ✅ S00 랜딩 화면
- ✅ S01 취향 진단 3문항 (CF8 · FE-FEAT-003)
- ✅ S02 취향 결과 카드 (3축 · 코드 숨김)
- ⬜ S03 조건 입력 (동반·보행·이동수단·음식제약 — FE-FEAT-004)
- ✅ CF8 프로필 생성 (클라이언트, localStorage `cf8_code`)
- ⬜ 추천 엔진 클라이언트 (3단계: 적합도 → 상황 보정 → 리스크 필터)
- ⬜ S10 추천 피드 화면
- ⬜ S20 장소 상세
- ⬜ 장소 태깅 JSON 60건 (권역당 10건)

### W2 · 차별화 — 여유 되면 (8/24~30)

> 화면ID는 **피그마 IA v4.0 기준**. 괄호 안은 구 v2.0 번호 — `docs/화면_IA.md` 재매핑 표 참고.

- ⬜ S21 방문 전 체크 (구 S30 · 문화 충돌 예측)
- ⬜ S22 문화 가이드 상세 (구 S21)
- ⬜ S32 오늘의 루트 (구 S40 · 포그라운드 watchPosition)
- ⬜ S33 루트 지도 모드 (구 S40b · Kakao Maps)
- ⬜ S36 도착 안내 (구 S44 · 50m 진입 시 이용 방법 3단계 — 핵심 차별점)
- ⬜ S50 전체 메뉴 (구 S05)
- ⬜ i18n (next-intl) — ⚠️ 피그마 S51은 **4개 언어**(한/영/일/중), 아래 표의 EN/KO와 불일치
- ⬜ 문화 가이드 콘텐츠 + 실체험 3줄 작성
- ~~S42 근접 알림 인앱 UI~~ → **P02로 강등, Phase 2** (피그마 v4.0) · 스코프 아웃 후보

### W3 · 완성도 + 앱 빌드 (8/31~9/7)

- ⬜ S90~S94 예외 화면 5종 (로딩 · 결과 없음 · 출발지 필요 · 오프라인 · 영업 종료)
- ⬜ S52 서비스 소개 · 활용 API (구 S99)
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

- **서비스 기획력 (30점)** — 3문항 2지선다 진단(CF8) · 3단계 추천 로직 · 문화 충돌 예측(핵심 차별점) · S36 도착 안내
- **서비스 완성도 (30점)** — 추천 피드·장소 상세 · 예외 처리 · 모바일 퍼스트 UI · QA
- **데이터 활용 (20점)** — TourAPI 5종 연동 · 부산 100건+ 태깅 · 포그라운드 위치 · 날씨 보정 · API 출처 명시
- **서비스 발전성 (20점)** — Virtual Walk · 리뷰 감정 요약 · 전국 확장 구조 설계
- **지역특화 가점 (+2점)** — 부산 6개 권역 콘텐츠 · 권역별 장소 태깅 · 부산 특화 문화 가이드

## 코드 규칙

- 커밋 메시지: `feat:`, `fix:`, `chore:`, `docs:` 접두사 (한국어 본문)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
