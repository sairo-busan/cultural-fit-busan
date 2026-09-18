# FE-BUG-003: 뒤로 가기 버튼이 없는 화면 — S20 실패 · 찾을 수 없음 · 개인정보처리방침

```
증상   화면 안에 나가는 길이 없다. 웹은 브라우저 뒤로 가기, 앱은 안드로이드 뒤로 버튼뿐
대상   S20 불러오기 실패 · S20 장소를 찾을 수 없음 · /privacy
해결   세 화면 왼쪽 위에 뒤로 버튼. 돌아갈 기록이 없으면 정해 둔 화면으로 보낸다
```

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | FE |
| Type | BUG |
| Severity | Medium |
| Layer | Page |
| Status | Todo |
| Screen | S20 · 개인정보처리방침 |
| Depends | — (`PlaceContent.tsx` 를 바꾼 FE-FEAT-016 PR #48 은 머지됨) |
| Related | APP-BUG-001 (안드로이드 뒤로 가기) · APP-CHORE-002 (개인정보처리방침 화면) · FE-FEAT-017 E2 |

---

## Problem

### 1. S20 불러오기 실패 · 장소를 찾을 수 없음

- **현재 동작**: 상세 데이터를 못 받으면 흰 화면에 안내 문구와 버튼 하나만 뜬다. 뒤로 버튼은 사진 영역(`Hero`) 위에 얹혀 있어, 실패하면 사진 영역과 함께 그려지지 않는다.
  - 불러오기 실패 — "불러오지 못했어요 / 다시 시도"
  - 찾을 수 없음 — "장소를 찾을 수 없어요 / 추천으로"
- **재현**: 개발 서버에서 `*/api/place/*` 요청을 막고 `/ko/place/2760699` 진입 → 화면의 누를 수 있는 요소는 "다시 시도" 하나 (2026-09-17 캡처로 확인)

### 2. 개인정보처리방침 (`/privacy`)

- **현재 동작**: 제목 · 갱신일 · 본문만 있다. 헤더 · 뒤로 버튼 · 하단 탭이 없다.
- **들어오는 길**: 내 정보 탭 "개인정보처리방침" 줄. 스토어 판매정보에 방침 URL 로도 등록되어, **바깥에서 바로 열리는 경우**가 있다 — 이때는 돌아갈 기록이 없다.

---

## Context

```
관련 파일:
- src/app/[locale]/place/[id]/PlaceContent.tsx  load.status "failed" · "notFound" 분기가 EmptyState 만 반환 · Hero 의 back()
- src/app/[locale]/privacy/page.tsx             서버 컴포넌트 (async · setRequestLocale)
- src/components/common/AppHeader.tsx           onBack · aria-label nav.back · 44px 터치 영역 (클라이언트)
- trip-setup · profile · onboarding             같은 뒤로 가기 규칙 — history.length > 1 이면 router.back(), 아니면 대체 경로
```

---

## Scope

### 포함

- S20 불러오기 실패 · 찾을 수 없음 화면에 뒤로 버튼
- `/privacy` 에 뒤로 버튼
- 돌아갈 기록이 없을 때 보낼 화면

### 제외

- 뒤로 가기 규칙(`history.length > 1`) 을 공용 함수로 모으는 정리 — 네 곳에 같은 코드가 있지만 별건
- `EmptyState` 버튼 모양 (FE-FEAT-017 E2 에서 그대로 두기로 함)
- 하단 탭을 붙이는 것

---

## 결정 (제안 — Step 1 목업 후 확정)

| # | 항목 | 제안 |
|---|---|---|
| 1 | S20 버튼 모양 · 자리 | **확정 — B** `AppHeader onBack` (S03 · 취향 진단 · 취향 결과 · `/privacy` 와 같은 꺾쇠). 사진 없는 흰 바탕에선 흰 원이 보이지 않아 A(흰 원 그대로)와 차이가 없고, 새 컴포넌트가 필요 없다 |
| 2 | `/privacy` 버튼 | `AppHeader onBack` — S03 · 프로필과 같은 헤더 |
| 3 | 기록이 없을 때 | S20 → `/feed` (지금 `Hero` 와 같음) · `/privacy` → `/me` |
| 4 | `/privacy` 서버 컴포넌트 | 본문은 서버 그대로 두고, 뒤로 버튼만 작은 클라이언트 컴포넌트로 얹는다 (`AppHeader` 는 함수 prop 을 받아 서버에서 바로 못 쓴다) |

---

## Strategy

### Step 1: 목업

S20 실패 · 찾을 수 없음 · `/privacy` 세 화면에 뒤로 버튼을 얹은 모습. **검토 후 다음 Step.**

### Step 2: S20

`failed` · `notFound` 분기에 뒤로 버튼을 그린다.

### Step 3: `/privacy`

뒤로 버튼 클라이언트 컴포넌트를 헤더 자리에 얹는다.

### Step 4: 검증

`tsc` · `lint` · `build` 와 화면 확인.

---

## Acceptance Criteria

- [ ] S20 불러오기 실패 화면에 뒤로 버튼이 보이고, 누르면 이전 화면으로 간다
- [ ] S20 찾을 수 없음 화면에 뒤로 버튼이 보인다
- [ ] `/privacy` 에 뒤로 버튼이 보이고, 내 정보 탭에서 들어왔으면 내 정보 탭으로 돌아간다
- [ ] 주소를 바로 열어 기록이 없을 때 S20 은 `/feed`, `/privacy` 는 `/me` 로 간다
- [ ] 뒤로 버튼에 화면 낭독기 이름(`nav.back`)이 있고 터치 영역이 44px 이상이다
- [ ] 앱(Capacitor)에서 상태바와 겹치지 않는다 (`pt-safe-header`)
- [ ] `tsc --noEmit` · `lint` · `build` 통과

---

## Verification

1. 추천 → S20 → `*/api/place/*` 막고 새로고침 → 뒤로 버튼 → 추천
2. 없는 장소 ID(`/ko/place/0`) → 찾을 수 없음 화면의 뒤로 버튼
3. 내 정보 → 개인정보처리방침 → 뒤로 버튼 → 내 정보
4. 새 탭에서 `/ko/privacy` · `/ko/place/0` 바로 열기 → 뒤로 버튼 → 대체 경로
5. ko · en
6. 앱 빌드에서 상태바 · 안드로이드 뒤로 버튼과 함께 동작

---

## Implementation Notes

(구현 후 작성)
