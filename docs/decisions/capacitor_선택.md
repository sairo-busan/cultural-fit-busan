# Capacitor + Play Store 배포 결정

날짜: 2026-08-16 / 상태: 확정

## 맥락

공모전이 "웹·앱 등 신규 관광 서비스"를 요구. 팀(풀스택 1명 + 기획/디자인 1명 + 행정/데이터 1명)이 5주 안에 앱 스토어 출시까지 완료해야 함.

## 검토한 선택지

1. **Capacitor** — Next.js 웹 코드를 WebView로 래핑 (추가 2~3일)
2. **React Native** — 전면 재작성 (최소 6~8주, 비현실적)
3. **웹 전용** — Next.js + Vercel 배포, URL 제출

상세 기술 비교: `docs/decisions/capacitor-vs-rn-brief.md` 참조

## 결정

**Capacitor + Play Store (Android Only)로 제출한다.**

## 사유

- 공고문 "웹·앱 등" → 앱으로 제출하면 평가에 유리 (실제 서비스 완성도 인상)
- Capacitor는 기존 Next.js 코드에 2~3일 추가로 앱 빌드 가능
- Play Store 내부 테스트는 14일 대기 없음 (클로즈드 테스트와 다름)
- 유나가 Play Store에 "수집하는 사용자 데이터 없음"으로 이미 신고 완료
- Android만 대응 — iOS는 Apple Developer 등록(연 $99) + 심사 기간으로 일정 양립 불가

## 함께 확정된 제약

- **로그인 없음** — Play Store 신고("데이터 수집 없음")와 충돌하므로 인증 추가 불가
- **백그라운드 위치 없음** — `ACCESS_BACKGROUND_LOCATION` 선언 시 Play Store 별도 심사 큐 진입, 9/21 양립 불가
- **FCM 없음** — 근접 알림은 인앱 UI로 구현, `@capacitor/haptics`로 진동만

## 영향

- Capacitor 의존성 추가 (`@capacitor/core`, `@capacitor/haptics`, `@capacitor/geolocation`)
- Vercel 배포(웹)와 Play Store 등록(앱) 병행
- 모든 화면 모바일 퍼스트로 구현 (WebView 기준)
- 위치·진동은 Capacitor 플러그인, 그 외는 Web API 사용
- iOS는 발전계획에 "사업화 시 재검토"로 기재
