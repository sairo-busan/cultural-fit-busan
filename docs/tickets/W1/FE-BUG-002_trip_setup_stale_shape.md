# FE-BUG-002: 옛 trip_setup 모양으로 S03 이 열리지 않는다

```
증상   /trip-setup 이 "This page couldn't load" 로 죽는다. 서버는 200
원인   FE-FEAT-008 이 객체 모양을 바꾸면서 저장 키 trip_setup 은 그대로 뒀다
       코드는 새 모양으로 일관되고, 브라우저에 남은 옛 데이터만 어긋난다
해결   읽는 쪽에 normalizeTripSetup() — 저장 경로는 건드리지 않는다
```

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | FE |
| Type | BUG |
| Severity | High |
| Layer | Data |
| Status | In Progress |
| Screen | S03 |
| Depends | — |
| Related | FE-BUG-001 (같은 부류 — 저장값을 안 씻는다) · FE-FEAT-008 (모양을 바꾼 쪽) · BE-FEAT-011 (S10 경로 담당) |

---

## Problem

`/trip-setup` 이 열리지 않는다. Next 16 의 클라이언트 에러 바운더리가 뜬다.

```
This page couldn't load
Reload to try again, or go back.
```

서버는 멀쩡하다.

```
/trip-setup      307 → /en/trip-setup
/en/trip-setup   200   (HTML 에 본문까지 들어 있다)
```

죽는 건 하이드레이션 직후다.

### 누가 걸리나

localStorage 에 옛 `trip_setup` 이 남은 브라우저만이다.

| | 상태 |
|---|---|
| 실사용자 | 없음 — 배포 전 |
| 팀 4인 | 걸림 |
| 배포본을 열어 본 사람 | 걸림 |
| 시크릿 창 · 새 기기 | 멀쩡 |

`clearDiagnosis()`(`lib/storage.ts`)가 `trip_setup` 을 지우므로 "진단 다시 하기" 한 번으로도 풀린다.
그래서 즉시 장애는 아니다 — Severity 를 High 로 둔 이유다.

### 그런데도 코드로 막는 이유

이 모양은 또 바뀐다.

```
BE-FEAT-011   TripSetupLike 에서 foodRestriction 을 빼고 currentContext 를 넣는다
FE-FEAT-012   온보딩 S00~S03 재설계 예정
```

지금 "각자 지우세요" 로 넘기면 다음 변경 때 같은 공지를 또 해야 하고,
그때는 테스터가 붙어 있을 수 있다. 읽는 쪽에 한 번 두면 이후 변경이 조용히 흡수된다.

---

## 원인 — 세 단계

### 1. 모양이 바뀌었는데 키는 그대로다

`FE-FEAT-008`(PR #15)이 S03 을 시트 기준으로 개편하며 세 종류로 바꿨다.
저장 키 `trip_setup` 은 그대로다.

**① 이름만 바뀐 것**

```
walkingDifficulty  →  mobilityCare
currentSituation   →  currentContext
transport          →  transportMode
petTravelMode      →  petCarry
```

**② 구조가 쪼개진 것** — 터지는 원인이 여기다

```ts
// 전 — 배열 하나
travelWith: ("solo"|"couple"|"friends"|"parents"|"kid"|"pet")[]

// 후 — 주 동행 1개 + 독립 토글 2개
primaryCompanion: "solo" | "friend_couple" | "parents" | null
childWith: boolean
petWith:   boolean
```

`couple`·`friends` 가 `friend_couple` 로 합쳐졌고 `kid`·`pet` 은 배열 원소에서
불리언 필드로 빠졌다. 타입 자체가 배열 → 문자열·불리언으로 바뀌었다.

**③ 이름은 같은데 값 코드가 바뀐 것**

```
childAgeGroup    age_0_3 · age_4_7 · age_8_13 · age_14_18
              →  infant · preschool · elementary · teen

currentContext   rain · time_rich · indoor · outdoor · right_now
              →  time_flexible · indoor_first · outdoor_preferred · available_now
```

이름도 값도 그대로라 살아남는 건 `foodRestriction` 하나뿐이다.

### 2. 읽는 쪽이 안 씻는다

`useStoredState` 는 `JSON.parse` 결과를 기본값과 병합하지 않고 그대로 돌려준다.
그래서 배열이어야 할 자리가 `undefined` 로 들어온다.

### 3. 컴포넌트 본문에서 바로 만진다

```ts
const canSkip = isUntouched(setup);   // 조건 없이 불린다
// isUntouched:
setup.mobilityCare.length === 0       // undefined.length → TypeError
```

서버 렌더에서는 `serverValue`(기본값)를 쓰므로 통과하고,
`useSyncExternalStore` 가 localStorage 를 읽는 순간 터진다.

---

## Scope

### 포함

- `src/data/tripSetup.ts` — `normalizeTripSetup()`
- `src/app/[locale]/trip-setup/page.tsx` — 읽은 값을 통과시킨다

### 제외

- `src/hooks/useRecommendations.ts` — S10 경로는 `BE-FEAT-011` 이 담당한다. 아래 참고
- `useStoredState` 자체 — 키마다 모양이 달라 훅이 알 수 없다. 씻는 책임은 값 쪽에 둔다
- 다른 저장 키(`cfb_saved` 등) — `FE-FEAT-010` 에서 S20 을 다시 쓸 때 같이 본다
- 마이그레이션 코드 — 옛 값을 새 값으로 옮기지 않는다. 아래 참고

---

## Strategy

허용값을 따로 적지 않고 `TRIP_QUESTIONS` 에서 유도한다. 시트가 바뀌어도 어긋나지 않는다.

```ts
const ALLOWED = new Map(TRIP_QUESTIONS.map((q) => [q.key, new Set(q.options.map((o) => o.value))]));
const TOGGLE_KEYS = new Set(TRIP_QUESTIONS.flatMap((q) => q.toggles?.map((t) => t.key) ?? []));
```

기본값 위에 **아는 키·아는 값만** 얹고 나머지는 버린다.

### 왜 옛 값을 새 값으로 옮기지 않나

`travelWith: ["friend"]` 를 `primaryCompanion: "friend_couple"` 로 옮기려면 옛 코드값과
새 코드값의 대응표가 필요한데, 그 표는 `FE-FEAT-008` 에서 시트가 바뀌며 사라졌다.
틀린 값을 복원하면 사용자가 고른 적 없는 조건으로 추천이 나간다.

키 이름이 같고 값이 유효한 것(`foodRestriction`)은 그대로 살아남는다.
화면이 다시 저장하는 순간 정상 모양으로 덮인다.

### 왜 S10 은 안 건드리나

`BE-FEAT-011`(PR #20)이 `resolveActiveFilters` 에서 같은 일을 이미 한다.

```ts
const mobilityCare = keepKnown(tripSetup.mobilityCare ?? [], WALKING_DIFFICULTIES);
primary: isPrimaryCompanion(tripSetup.primaryCompanion) ? tripSetup.primaryCompanion : null
```

`?? []` 로 없는 키를 막고 `keepKnown` 으로 모르는 값을 버린다 — 이 티켓의 결과와 같다.
여기서 훅을 함께 고치면 PR #20 리베이스 때 풀 충돌만 하나 늘어난다.

---

## Acceptance Criteria

- [x] 옛 모양이 저장돼 있어도 `/trip-setup` 이 열린다
- [x] 새 모양은 값이 하나도 안 바뀐다
- [x] 배열 자리에 문자열, 값 자리에 숫자가 들어와도 안 터진다
- [x] `null` · 문자열 · 빈 값에서 기본값으로 떨어진다
- [x] `tsc --noEmit` · `lint` · `build` 통과

---

## Verification

```
옛 모양(#15 이전)  통과  → companion=null child=false mobility=[] food=["spicy"] untouched=false
새 모양            통과  → companion=solo child=true mobility=["stairs_slope"] food=["vegan"]
망가진 값          통과  → 배열 아닌 값·타입 섞인 배열 모두 걸러짐
null              통과  → 기본값
문자열             통과  → 기본값
```

수정 전 같은 케이스:

```
visibleQuestions   통과
summaryLabels      통과
firstUnanswered    통과
isUntouched        💥 Cannot read properties of undefined (reading 'length')
```

---

## Derived Artifact Naming Rule

```text
티켓 ID:     FE-BUG-002
파일명:      FE-BUG-002_trip_setup_stale_shape.md
브랜치명:    fix/trip-setup-stale-shape
```
