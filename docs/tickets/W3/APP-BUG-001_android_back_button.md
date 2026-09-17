# APP-BUG-001: 안드로이드 뒤로 가기가 앱을 닫는다

```
기대   상세 → [뒤로] → 목록
실제   상세 → [뒤로] → 앱 종료
```

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | APP |
| Type | BUG |
| Severity | High |
| Layer | Android |
| Status | In Progress |
| Screen | 전 화면 (앱) |
| Depends | APP-CHORE-001 |
| Related | v1.1 부터 있음 · v1.2 에서 수정 |

---

## Problem

- **현재 동작**: 앱에서 안드로이드 뒤로 가기를 누르면 어느 화면이든 앱이 종료된다.
- **기대 동작**: 화면 안에 이전 기록이 있으면 그 화면으로 돌아가고, 없을 때만 종료한다.
- **영향 범위**: 앱 전체. 웹은 브라우저가 뒤로 가기를 처리해 문제가 없다.

목록 → 상세 → 뒤로 가기는 가장 자주 쓰는 동작이라 심사 중에도 거의 확실히 겪는다.

---

## 원인

Capacitor 의 `BridgeActivity` 는 뒤로 가기를 처리하지 않는다(`@capacitor/android` 소스에
`onBackPressed` · `canGoBack` 처리 없음). 처리하는 쪽은 `@capacitor/app` 플러그인인데 설치하지
않았다. 그래서 안드로이드 기본 동작인 액티비티 종료로 간다.

---

## 수정

`MainActivity` 에 `OnBackPressedCallback` 을 건다.

| 상황 | 동작 |
|---|---|
| `WebView.canGoBack()` | `WebView.goBack()` — 화면 안에서 뒤로 |
| 기록 없음 | 콜백을 잠시 끄고 기본 동작(종료)으로 넘긴 뒤 다시 켠다 |

`@capacitor/app` 을 설치하는 방법도 있으나 뒤로 가기 하나를 위해 패키지를 늘리지 않는다.
다시 켜는 이유 — 안드로이드 12 이상은 첫 화면에서 뒤로 가면 앱을 닫지 않고 뒤로 보낸다.
꺼둔 채로 돌아오면 이후 뒤로 가기가 전부 종료로 간다.

---

## Acceptance Criteria

- [x] 상세 → 뒤로 가기 → 목록 (에뮬레이터)
- [x] 목록(첫 화면) → 뒤로 가기 → 앱이 닫힘
- [x] 앱을 다시 연 뒤에도 상세 → 뒤로 가기 → 목록
- [ ] v1.2 AAB 에 포함해 원스토어 업로드

---

## Derived Artifact Naming Rule

```text
티켓 ID:     APP-BUG-001
파일명:      APP-BUG-001_android_back_button.md
브랜치명:    fix/android-back-button
```
