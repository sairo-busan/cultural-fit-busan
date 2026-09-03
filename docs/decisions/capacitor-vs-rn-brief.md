# Capacitor vs React Native — 기술 검토

SAIRO (Cultural Fit Busan) · 2026-08-16

> ⚠️ **화면ID 주의** — 이 문서는 작성 시점의 IA v2.0 번호를 쓴다. 현재 정본은 피그마 IA **v4.0** 이며 S30·S40·S05·S99 등이 다른 화면을 가리킨다. 재매핑 표는 `docs/화면_IA.md` 참고. (기록 보존을 위해 본문 번호는 그대로 둔다.)

---

## 0. 현재 코드베이스 상태

| 항목 | 값 |
|---|---|
| `.tsx`/`.ts` 파일 수 | 2개 (layout.tsx, page.tsx) |
| `"use client"` 선언 | 0건 |
| API 라우트 / 미들웨어 | 없음 |
| 브라우저 전용 API | 사용 없음 |
| Supabase 연동 | 미구현 |
| 네이티브/모바일 의존성 | 없음 |

**기존 코드 전환 비용은 사실상 0.** 향후 구현 예정 기능 기준으로 판단한다.

---

## 1. 판단 기준별 분석

### 기준 ① "use client" 비율 → Capacitor 유리

현재 0%이나, 화면 IA 17개 화면의 **예상 구성**을 보면:

| 구분 | 화면 | 예상 유형 |
|---|---|---|
| Client Component | S01(진단 모달), S02(결과 카드), S10(피드), S11(검색), S12(지도), S40(실시간), S41(탐색 설정), S42(알림 오버레이), S43(히스토리), S50(저장함) | **10개** |
| Server Component | S00(랜딩), S13(행사), S20(장소 상세), S21(가이드 상세), S30(방문 전 체크), S90(예외), S99(소개) | **7개** |

→ 예상 Client Component 비율 **~60%**. 하지만 Server Component 7개도 대부분 **데이터 fetch 후 정적 렌더링**이라, Capacitor `output: 'export'` 전환 시 클라이언트에서 fetch하도록 바꾸면 된다. **전환 비용 낮음.**

### 기준 ② 서버 컴포넌트 / API Routes / ISR 의존도

구현 예정인 서버사이드 기능:

| 기능 | FEAT | 서버 의존도 |
|---|---|---|
| Supabase API 라우트 | FEAT-002 | API Route |
| TourAPI 5종 연동 | FEAT-003 | API Route (API 키 보호) |
| CFP 프로필 생성 | FEAT-007 | API Route |
| 추천 엔진 | FEAT-009/011 | API Route + DB 쿼리 |

**핵심:** 이 API 라우트들은 Capacitor든 React Native든 **별도 백엔드(Vercel)에 유지**해야 한다. 차이가 없다.

- **Capacitor**: Next.js `output: 'export'`로 정적 빌드 → WebView에서 Vercel API 호출
- **React Native**: 동일하게 Vercel API 호출

ISR은 현재 계획에 없고, 관광 데이터 특성상 실시간 갱신이 불필요하므로 **정적 빌드 전환 비용 낮음.**

### 기준 ③ 브라우저 전용 API 사용처

현재 0건이나, 계획된 기능에서 필요한 Web/네이티브 API:

| API | 사용 화면 | Capacitor 플러그인 | 비고 |
|---|---|---|---|
| Geolocation | S40(지금 갈 만한 곳), S12(주변 지도) | `@capacitor/geolocation` | 표준 |
| Push Notification | S42(근접 알림) | `@capacitor/push-notifications` | 표준 |
| Local Storage | S43(히스토리) | `@capacitor/preferences` 또는 Web Storage 그대로 | 표준 |
| Background Location | S41(탐색 모드) | `@capacitor-community/background-geolocation` | 커뮤니티 |

→ 모두 Capacitor 표준/커뮤니티 플러그인으로 커버 가능.

### 기준 ④ 네이티브 API 의존도 (카메라/AR/센서)

| 네이티브 기능 | 필요 여부 |
|---|---|
| 카메라 | ❌ 불필요 |
| AR / 3D | ❌ 불필요 |
| 센서 (가속도/자이로) | ❌ 불필요 |
| NFC / 블루투스 | ❌ 불필요 |
| 파일 시스템 | ❌ 불필요 |
| 위치 (포그라운드) | ✅ 필요 — Capacitor 플러그인 지원 |
| 위치 (백그라운드) | ⚠️ S41 탐색 모드 — 커뮤니티 플러그인 |
| 푸시 알림 | ✅ 필요 — Capacitor 플러그인 지원 |

→ **고성능 네이티브 API 의존 없음.** React Native의 네이티브 브릿지가 필요한 시나리오가 없다.

### 기준 ⑤ 팀 규모와 일정

| 항목 | 현실 |
|---|---|
| 개발자 | **2명** (본인 + 에린, 둘 다 웹 개발 경험 기반) |
| 제출 마감 | **2026년 9월** (약 2~4주) |
| 앱 빌드 담당 | 태무 (빌드/행정) |
| 구현해야 할 기능 | FEAT-001 ~ FEAT-013 (13개) |

→ 개발자 2명 모두 웹 경험 기반이라 RN 전환 시 **학습 비용이 이중으로 발생**한다. 4주 안에 RN 학습 + 재작성은 비현실적.

---

## 2. 화면 IA 앱 대응 현황

화면 IA에 이미 앱/웹 구분이 설계되어 있다:

| 앱 대응 | 화면 | 비고 |
|---|---|---|
| **O** (앱 포함) | S00, S01, S02, S10, S20, S21, S30, S40, S41, S42, S90, S99 | 12개 |
| **X** (웹 전용) | S11, S13, S50 | 3개 — 앱에서 제외 |
| **축소** | S12, S43 | 2개 — 앱에서 단순화 |

→ 이미 **웹 우선 + 앱은 부분 집합** 전략으로 설계됨. Capacitor의 WebView 래핑과 정확히 맞는 구조.

---

## 2-1. 유저플로우에서 확인된 추가 사실

| 항목 | 상세 |
|---|---|
| **로그인 없음** | 유저플로우 전체에 로그인/회원가입 분기가 없음. 프로필은 `localStorage`에만 저장 |
| **15초 GPS 루프** | F5 탐색 모드: 15초 간격 위치 수집 → Haversine 거리 계산 → 알림 조건 체크 반복 |
| **진동(Haptics)** | S42에서 150m 이내 접근 시 디바이스 진동 발생 |
| **알림 억제** | `cfb_alert_log`를 로컬에 저장하여 동일 장소 24시간 재알림 방지 |
| **위치 권한 거부 시** | P01 수동 모드(지역 직접 선택)로 폴백 — 위치 없이도 작동 |

**Capacitor에 유리한 이유:**
- `localStorage` 그대로 사용 가능 (WebView 내 Web Storage 정상 작동)
- 서버 인증이 없으므로 API 토큰 관리 부담 없음
- 15초 GPS 루프는 Capacitor `@capacitor/geolocation` watchPosition으로 구현 가능
- 진동은 `@capacitor/haptics` 플러그인으로 1줄 호출

---

## 3. 종합 비교

| 평가 항목 | Capacitor | React Native |
|---|---|---|
| 코드 재사용 | **95%+** (Next.js 코드 거의 그대로) | **0%** (전면 재작성) |
| 추가 개발 공수 | **2~3일** (Capacitor 초기화 + 플러그인 설정) | **4~8주** (UI 전체 + 네비게이션 + 상태관리) |
| 서버사이드 처리 | Vercel API 유지, 프론트만 정적 빌드 | 동일 (Vercel API 호출) |
| 네이티브 성능 | WebView 기반 — **이 프로젝트에선 충분** | 네이티브 렌더링 — 과잉 |
| 위치/알림 | 표준 플러그인으로 해결 | 네이티브 모듈로 해결 |
| 팀 유지보수 | **단일 코드베이스** (2명이 같은 코드로 협업) | 웹 + RN 두 코드베이스 (분리 또는 이중 학습) |
| 공모전 일정 | **맞출 수 있음** | **맞출 수 없음** |
| 사업화 확장성 | 네이티브 성능 필요 시 한계 | 장기적으로 유리 |

---

## 4. 결론: **Capacitor 추천**

### 이유

1. **코드가 거의 없다** — 전환 비용 자체가 논점이 아님. 앞으로 짤 코드를 한 벌로 유지할 수 있느냐가 핵심
2. **네이티브 API 의존이 없다** — 카메라/AR/센서 필요 없음. 위치+알림은 Capacitor 플러그인으로 충분
3. **화면 IA가 이미 웹 우선** — 3개 화면은 웹 전용, 2개는 앱에서 축소. Capacitor의 조건부 렌더링으로 자연스럽게 처리
4. **웹 경험 개발자 2명 + 4주 마감** — 둘 다 RN 학습이 필요하므로 재작성은 비현실적
5. **태무의 역할** — "앱 빌드" 담당이 있으므로, Capacitor CLI 빌드(Android Studio/Xcode)는 분업 가능

### 잠재 리스크와 대응

| 리스크 | 심각도 | 대응 |
|---|---|---|
| WebView 성능 (목록 스크롤) | 낮음 | 가상화 리스트 (react-window) 적용 |
| 백그라운드 위치 정확도 | 중간 | `@capacitor-community/background-geolocation` 검증 필요 |
| iOS 심사 WebView 리젝 | 낮음 | 충분한 네이티브 기능(위치/알림) 사용 시 통과 가능 |
| 지도 SDK 성능 | 낮음 | WebView 내 Kakao/Naver Map JS SDK로 충분 |

### 향후 사업화 시

공모전 이후 사업화 단계에서 네이티브 성능이 필요해지면 (예: AR 가이드, 카메라 기반 번역), 그때 React Native나 Flutter로 **점진적 전환**을 검토. 지금은 Capacitor로 MVP를 빠르게 출시하는 것이 합리적.

---

## 5. Capacitor 도입 시 필요한 작업

1. `npm install @capacitor/core @capacitor/cli`
2. `npx cap init` (앱 이름: SAIRO, 패키지: `com.sairo.app`)
3. `next.config.ts`에 `output: 'export'` 추가
4. API 호출을 Vercel 배포 URL 기준 절대경로로 변경
5. `npx cap add android && npx cap add ios`
6. 네이티브 플러그인 설치 (geolocation, push-notifications, preferences)
7. 앱/웹 분기 유틸 작성 (`Capacitor.isNativePlatform()`)
8. S11, S13, S50 웹 전용 화면에 플랫폼 분기 적용
