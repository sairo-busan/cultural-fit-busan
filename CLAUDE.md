# Cultural Fit Busan (SAIRO)

외국인 대상 부산 문화 적합도 기반 관광 추천 앱
2026 관광데이터 활용 공모전 · Capacitor + Play Store (Android) · 마감 9/21 · 1차 심사 10월

## 아키텍처 원칙

- **로그인 없음** — localStorage로 프로필 저장, Play Store "수집 데이터 없음" 신고 유지
- **MongoDB** — 로우데이터 배치 적재 + 사용자 이벤트는 실시간 호출 (하이브리드)
- **포그라운드만** — 백그라운드 위치·FCM 사용 안 함 (Play Store 심사 리스크 제거)
- **좌표는 서버로 보내지 않음** — 거리 계산은 클라이언트에서 (BE-FEAT-006)

## 기술스택

| 영역 | 기술 | 비고 |
|---|---|---|
| 프론트엔드 | Next.js 16 (App Router) | React 19 · TypeScript |
| 스타일링 | Tailwind CSS 4 | 모바일 퍼스트 |
| 상태 관리 | localStorage 훅 (`src/hooks/`) | 프로필: localStorage · 장소: MongoDB · Zustand · React Query 미설치 |
| DB | MongoDB | 로우데이터 배치 적재 · 에린 설계 |
| 스토리지 | Cloudflare R2 (검토 중) | 10GB 무료 · egress 무료 · 우선 API URL 직접 사용 |
| 지도 | Kakao Maps SDK | 미설치 · 루트 지도(S33) 도입 시 |
| 외부 API | TourAPI 4.0 (6종 — 기준 확인 대기) | 배치 + 실시간 하이브리드 · API 키 확보 완료 |
| i18n | next-intl | EN/KO 2개 언어 |
| 앱 빌드 | Capacitor | WebView 래핑 · Android Only |
| 배포 | Vercel + Play Store | 웹: Vercel · 앱: Play Store 내부 테스트 |
| 모니터링 | Vercel Analytics | 미설치 |

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
| primary (잉크) | `#111213` — 브랜드색을 따로 두지 않고 잉크 농도로 위계를 만든다 |
| danger / caution | `#A33A2A` / `#8A6320` |
| 본문 | Noto Sans KR 300/200/400 |
| 숫자·영문 강조 | Cormorant Garamond (serif) |

## 팀 구성 (4인)

| 이름 | 역할 | 비고 |
|---|---|---|
| 유나 | 기획 · 디자인 · 라벨링 | 피그마 완성, 태깅 시트 |
| 소피 | 웹 화면 UI | 피그마 → 코드, 라우팅, 컴포넌트 |
| 에린 | 추천 엔진 + 백엔드 + 검색 | DB 구조, API 연동, 엔진 로직 |
| 태무 | 비즈니스 컨설턴트 | 도메인: 은행 · 서비스 방향 · 기능 우선순위 자문 |

## 코드베이스 지도

- `src/app/[locale]/` 화면 · `src/app/api/` Route Handler (health · place · recommend · tour · weather)
- `src/lib/` 추천 엔진(순수 함수) + DB · 저장소 연동 · `src/hooks/` 브라우저 I/O
- `scripts/` TourAPI 적재 · 시트 import · 도슨트 오디오 배치 (`npx tsx scripts/…`)

## 명령어

```bash
npm run dev          # 개발 서버 :3000
npm run build        # 웹 빌드
npm run build:app    # Capacitor 앱용 정적 빌드
npm run lint
npx tsc --noEmit     # 타입 검사 (별도 스크립트 없음)
```

Node 22 고정(`engines`, `.nvmrc`). 환경변수는 `.env.example` 참고. 테스트 프레임워크 없음.

## 주요 참고 문서

- `docs/cfp_16유형_체계.md` — CFP 16유형 체계 (구 체계 · 현재는 CF8, 아래 전환 검토 참고)
- `docs/추천_알고리즘_명세서_v2.md` — 추천 알고리즘 8단계 명세
- `docs/화면_IA.md` — 화면 ID 정의 (피그마 IA **v4.0** 정본 + v2.0 재매핑 표)
- 유저플로우 — 피그마 `Page 2_최종` 의 `UXF · 유저플로우`(`800:395`) · `UXF2 · 00 읽는 법`(`899:395`) · `00 전체 흐름도`(`907:395`) · FLOW별 프레임
- `docs/decisions/capacitor_선택.md` — Capacitor + Play Store 결정 근거
- `docs/wbs_v2_qa.md` — WBS v1→v2 전환 QA 검증 리스트
- `docs/현황_스냅샷_2026-09-03.md` — 코드·피그마 실물 대조 현황
- `docs/decisions/진단체계_CF8_전환_검토.md` — CFP16 → CF8 전환 비용·태깅시트 분석·9/4 결정 항목

## Notion

NOTION_TOKEN (`.env` 참조)으로 접근
- 공모전 문서 페이지: `3b2ee5c6-3c52-808a-b041-cdb81501e8a5`
- 노션 하위 문서: 기능정의서(v3, 9시트 83요소) · 기능설명서 초안(v3) · 추천 알고리즘 명세서(v2.0) · 공모전 제출항목

## 코드 규칙

- 커밋 메시지: `feat:`, `fix:`, `chore:`, `docs:` 접두사 (한국어 본문)
- `trip_setup_mode` 는 원시 문자열로 저장한다 — `useLocalStorage`(JSON)로 다루면 비교가 에러 없이 실패 (`src/lib/storage.ts`)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
