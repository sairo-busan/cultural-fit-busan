# WBS v2 QA 검증 리스트

> v1(8/13) → v2(8/16) 전환 시 모든 문서·코드·노션이 일관성 있게 반영됐는지 확인

## 1. 제거 항목 — "흔적 없이 삭제"되었는가

| 항목 | 로컬 코드 | CLAUDE.md | 노션 WBS | 노션 본문 |
|---|---|---|---|---|
| Supabase | ✅ 의존성 없음 | ✅ 제거 | ✅ FEAT-004 archived | ✅ 기술스택 행 삭제 |
| API 서버 | ✅ 코드 없음 | ✅ 제거 | ✅ FEAT-002 archived | ✅ callout 반영 |
| 사용자 인증/로그인 | ✅ 코드 없음 | ✅ "로그인 없음" | ✅ FEAT-015 archived | ✅ 기술스택 행 삭제 |
| TWA | ✅ 코드 없음 | ✅ 제거 | ✅ APP-003·010 archived | ✅ Capacitor로 교체 |
| 원스토어 | ✅ N/A | ✅ 제거 | ✅ APP-006·011 archived | ✅ 제거 |
| 클로즈드 테스트 14일 | ✅ N/A | ✅ 내부 테스트로 | ✅ APP-004·005·009 archived | ✅ 선택 근거 수정 |
| PWA (manifest/SW) | ✅ 코드 없음 | ✅ 제거 | ✅ APP-001 archived | ✅ Capacitor로 교체 |
| 백그라운드 위치 | ✅ 코드 없음 | ✅ "포그라운드만" | ✅ 티켓 없음 | ✅ 선택 근거 반영 |
| FCM 푸시 | ✅ 코드 없음 | ✅ "FCM 없음" | ✅ 티켓 없음 | ✅ 선택 근거 반영 |

## 2. 추가 항목 — 새 기능이 모든 곳에 반영되었는가

| 항목 | CLAUDE.md | 노션 WBS | 화면 IA | 코드 |
|---|---|---|---|---|
| S01-1~4 (4문항 이분법) | ✅ W1 | ✅ FEAT-006 수정 | ✅ 4행 추가 | ⬜ 미구현 |
| S01-5 (Hard Filter) | ✅ W1 | ✅ FEAT-033 신규 | ✅ 추가 | ⬜ 미구현 |
| S02 (프로필 결과 카드) | ✅ W1 | ✅ FEAT-034 신규 | ✅ 추가 | ⬜ 미구현 |
| S05 (전체 메뉴) | ✅ W2 | ✅ FEAT-035 신규 | ✅ 추가 | ⬜ 미구현 |
| S40b (루트 지도 모드) | ✅ W2 | ✅ FEAT-017 수정 | ✅ 추가 | ⬜ 미구현 |
| S42 (근접 알림 인앱 UI) | ✅ W2 | ✅ FEAT-036 신규 | ✅ 추가 | ⬜ 미구현 |
| S44 (도착 안내) | ✅ W2 | ✅ FEAT-037 신규 | ✅ 추가 | ⬜ 미구현 |
| Capacitor 빌드 | ✅ W3 | ✅ APP-012 신규 | N/A | ⬜ 미설치 |
| Play Store 내부 테스트 | ✅ W3 | ✅ APP-013 신규 | N/A | ⬜ 미등록 |

## 3. 수정 항목 — 기존 내용이 정확히 갱신되었는가

| 항목 | 변경 전 | 변경 후 | 반영 상태 |
|---|---|---|---|
| 추천 엔진 레이어 | backend | frontend (클라이언트사이드) | ✅ FEAT-009~011 |
| 프로필 생성 | "API" | "클라이언트, Zustand + localStorage" | ✅ FEAT-007 |
| 위치기반·충돌예측·날씨 | backend | frontend | ✅ FEAT-020~022 |
| 문화 이해 콘텐츠 | "콘텐츠 + API" | "콘텐츠" (API 제거) | ✅ FEAT-018 |
| Virtual Walk | P2-차별화 W3 | 발전계획 | ✅ FEAT-024 |
| TourAPI 연동 | "OpenAPI 5종 + 캐싱" | "TourAPI 프록시 (API Route 1개)" | ✅ FEAT-003 |
| 화면 IA | 17개 | 21개 | ✅ PLN-001 Done |
| 지도 뷰 | "지도 뷰 + 권역별 탐색" | "S40b 루트 지도 모드 (Kakao Maps)" | ✅ FEAT-017 |

## 4. 문서 일관성 — 모든 문서가 같은 내용을 말하는가

| 문서 | 상태 | 비고 |
|---|---|---|
| CLAUDE.md | ✅ v2 반영 완료 | 아키텍처 원칙·기술스택·WBS·디자인 시스템 |
| docs/화면_IA.md | ✅ 21개 반영 | v2.0 변경 이력 포함 |
| docs/decisions/capacitor_선택.md | ✅ 신규 생성 | 웹전용_선택.md 삭제 |
| docs/decisions/capacitor-vs-rn-brief.md | ✅ 유지 | 기술 비교 문서 (변경 불필요) |
| docs/cfp_16유형_체계.md | ✅ 변경 없음 | v1과 동일 |
| docs/추천_알고리즘_명세서_v2.md | ✅ 변경 없음 | v2.0 그대로 |
| 노션 WBS DB 제목 | ✅ "SAIRO (Capacitor + Play Store)" | |
| 노션 WBS 기술스택 테이블 | ✅ Supabase·인증 삭제, Capacitor 추가 | |
| 노션 WBS 페이즈 일정 | ✅ W0~W4 재작성, 5주로 확장 | |
| 노션 WBS 심사 기준 | ✅ Supabase·FEAT-016 제거, S44 추가 | |
| 노션 WBS 선택 근거 | ✅ "웹 전용" → "Capacitor + Play Store" | |
| 노션 변경 이력 | ✅ 8/16 7건 추가 | |

## 5. 코드 일관성

| 항목 | 상태 | 비고 |
|---|---|---|
| 색상 토큰 (globals.css) | ✅ 딥그린 #2A5A48 + 클레이 #A06A48 | 다크 모드 제거 |
| 폰트 (layout.tsx) | ✅ Noto Sans KR + Cormorant Garamond | Geist 제거 |
| themeColor (layout.tsx) | ✅ #2A5A48 | |
| 에디토리얼 스타일 (page.tsx) | ✅ rounded 제거, 테두리 최소화 | |
| Named export (page.tsx) | ✅ export function + 하단 re-export | |
| package.json | ⚠️ Supabase 의존성 없음 (원래 없었음) | 정상 |
| next build | ✅ 성공 | |

## 변경 이력

| 버전 | 날짜 | 변경 요약 |
|---|---|---|
| v1 | 8/13 | 초기 WBS 61건, Supabase+API서버+인증+TWA+원스토어 포함 |
| v2 | 8/16 | 유나 기술 방향 반영 57건, 클라이언트사이드+Capacitor+Play Store 확정 |
