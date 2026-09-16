# APP-CHORE-002: 개인정보처리방침 화면

Google Play 는 앱 등록에 **개인정보처리방침 URL 을 필수로 요구**한다. 지금 콘솔에 걸린
문서는 실제 앱과 어긋난다.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | APP |
| Type | CHORE |
| Severity | High |
| Layer | Route |
| Status | In Progress |
| Screen | 신규 `/privacy` · S50(내 정보) |
| Depends | APP-CHORE-001 |
| Related | Play 콘솔 `앱 콘텐츠` · 원스토어 판매정보 |

---

## Problem

- **현재 문서**: 팀 노션에 올린 템플릿 문구. 수집 항목으로 *(선택) 이메일 주소, 기기
  식별자(Device ID), 위치 정보, 서비스 이용 기록* 을 적어 두었고 문서 끝에 "추후 앱 개발 시
  업데이트 필요" 라고 남아 있다.
- **실제 앱**: 회원가입이 없고 `AndroidManifest.xml` 의 권한은 `INTERNET` 하나다. 분석 SDK 가
  없고(`@vercel/analytics` 등 미설치), 진단 결과 · 저장 목록은 `localStorage` 에만 남는다.
- **모순**: Play 콘솔의 데이터 보안 선언은 "앱에서 데이터를 수집 또는 공유하지 않습니다" 다.
  개인정보처리방침이 수집한다고 적혀 있으면 두 선언이 어긋나 정책 위반이 될 수 있다.

---

## Scope

### 포함

| # | 작업 | 왜 |
|---|---|---|
| 1 | `/[locale]/privacy` 화면 신설 (한 · 영) | 스토어에 넣을 공개 URL 이 필요하다 |
| 2 | 내 정보(S50) 에 링크 한 줄 | 스토어 밖에서도 닿을 수 있어야 한다 |
| 3 | 문구는 코드로 확인한 사실만 | 데이터 보안 선언과 어긋나지 않게 한다 |

### 제외

| 항목 | 이유 |
|---|---|
| 노션 문서 갱신 | 레포를 정본으로 삼는다. 노션 문서는 이 URL 을 가리키게 한다 |
| 이용약관 | 스토어 필수가 아니다 |
| 사진 출처 표기 · Type3 크롭 | 별건(FE-FEAT-015 · 크롭 티켓) |

---

## 문구 근거

| 문장 | 근거 |
|---|---|
| 수집하는 정보 없음 | 로그인 · 회원가입 없음. 서버는 조회만 한다 |
| 기기에만 저장 | `src/lib/storage.ts` — `cf8_code` · `trip_setup` · `cfb_saved` 전부 localStorage |
| 인터넷 권한만 | `android/app/src/main/AndroidManifest.xml` 의 `uses-permission` 1개 |
| 광고 · 분석 없음 | 광고 SDK · 분석 SDK 미설치 |
| TourAPI · 기상청 중계 | `/api/*` 가 공개 정보를 받아 전달한다 |

보호책임자는 **SAIRO 팀**으로 적고 문의 메일만 남긴다(sairo.guide@gmail.com).

법인이 없어 스토어 개발자 계정 명의자가 사실상 운영 주체지만, 수집하는 개인정보가 없어
문의처만 있으면 스토어 요건을 충족한다. 팀으로 두면 담당이 바뀌어도 문서를 고치지 않는다.

---

## Acceptance Criteria

- [x] `/ko/privacy` · `/en/privacy` 가 웹 빌드에 생성된다
- [x] 내 정보에서 링크로 들어갈 수 있다 — 에뮬레이터 확인
- [x] 앱 빌드(`npm run build:app`) 산출물에도 포함된다
- [x] `tsc --noEmit` · lint 통과
- [ ] 배포 후 `https://cultural-fit-busan.vercel.app/ko/privacy` 가 열린다
- [ ] Play 콘솔 `앱 콘텐츠 > 개인정보처리방침` URL 교체
- [ ] 원스토어 판매정보에도 같은 URL 반영

---

## Implementation Notes

앱 스토어 반영 시점이 갈린다.

| | 앱 재빌드 |
|---|---|
| 스토어 콘솔에 URL 등록 | 필요 없음 — 콘솔 입력값이다 |
| 앱 안 링크 | 필요 — 화면이 바뀐다 |

원스토어에 올린 `2 / 1.1` 은 링크 없이 검증을 받고, 링크는 다음 업데이트에 실린다.
Play 는 업로드 전이라 링크를 포함한 빌드로 올린다.

---

## Derived Artifact Naming Rule

```text
티켓 ID:     APP-CHORE-002
파일명:      APP-CHORE-002_privacy_policy.md
브랜치명:    feat/privacy-policy
```
