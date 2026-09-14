# FE-BUG-001: cf8_code 따옴표로 추천 점수가 전부 0

```
증상   49곳이 전부 0점. 순서가 사실상 DB 적재 순서
원인   저장은 JSON(따옴표 포함), 읽기는 원시 문자열 — 형식이 어긋남
해결   읽는 쪽에 readCf8Code() — 저장 경로는 건드리지 않는다
```

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | FE |
| Type | BUG |
| Severity | Critical |
| Layer | Hook / Lib |
| Status | In Progress |
| Screen | S10 |
| Depends | — |
| Related | FE-FEAT-009 (S10 이 이 수정을 전제로 한다) |

---

## Problem

**추천 기능 전체가 동작하지 않는다.** 에러가 안 나고 화면도 멀쩡해서 눈으로는 못 잡는다.

실제로 돌린 결과다 (`cf8Code = "CLD"` · `rainy` · 태깅 49건).

```
버그    최저 0 · 최고 0 · 서로 다른 값 1개
        1위 만물의거리 · 2위 아리랑거리 · 3위 국제시장 먹자골목 · 4위 광안리 · 5위 해운대

정상    최저 16.7 · 최고 100 · 서로 다른 값 10개
        1위 봉래산 · 2위 절영해안산책로 · 3위 송도해안볼레길 · 4위 부산근현대역사관 · 5위 비석문화마을
```

`CLD`(조용한 골목 산책자)인데 버그 상태에서는 **광안리·해운대 같은 번화한 해수욕장**이 상위에 온다. 정확히 반대 취향이다.

### 무엇이 망가지나

| | |
|---|---|
| 추천 순서 | 전부 동점이라 정렬이 아무 일도 안 한다 → **MongoDB 적재 순서** |
| 개인화 | 8유형 누구든 같은 목록을 본다. 개인화가 존재하지 않는다 |
| 차별점 | `CLAUDE.md` 가 "인기순이 아닌 내 유형 기준" 이라 적었는데 지금은 적재 순서다 |

### 망가지지 않는 것

하드필터 · 화면 · API 는 정상이다. **조용히 틀린 결과를 내는 종류**다.

---

## Context

```
src/app/profile/page.tsx:29        useLocalStorage(cf8Code, "")      저장
src/hooks/useRecommendations.ts:41 localStorage.getItem(cf8Code)     읽기
src/lib/cf8Match.ts:58             /^[CE][LF][DV]$/                  검사
src/lib/finalScore.ts:26           available.length === 0 → null     합산
```

---

## 원인 — 네 단계 연쇄

### 1. S02 가 따옴표를 붙여 저장한다

`profile/page.tsx` 가 `useLocalStorage` 로 저장하는데, 이 훅은 `JSON.stringify` 를 거친다.

```
의도한 값    CLD        3글자
실제 저장    "CLD"      5글자 (따옴표 포함)
```

### 2. 엔진은 따옴표 없이 읽는다

`useRecommendations` 가 `localStorage.getItem()` 으로 그대로 가져온다. `JSON.parse` 를
안 하니 `"CLD"` 5글자가 된다.

### 3. 정규식이 걸러낸다

```ts
// cf8Match.ts
if (!/^[CE][LF][DV]$/.test(cf8Code)) return null;   // 3글자만 통과
```

5글자라 `null` 을 돌려준다. CF8 매칭 점수가 사라진다.

### 4. 남은 축이 하나도 없다

`finalScore.ts` 는 `null` 인 축을 빼고 나머지로 재정규화한다(R031). 그런데
동행·날씨·계절·시간 축은 **DB 에 키 자체가 없어** 전부 `null` 이다.

```
CF8 35%      null  ← 3번에서 사라짐
동행 25%     null  ← DB 에 컬럼 없음
날씨 15%     null
계절 10%     null
시간대 15%   null
             ────
             전부 null → 최종점수 null → 0
```

---

## Scope

### 포함

- `src/lib/storage.ts` — `readCf8Code()` 추가
- `src/hooks/useRecommendations.ts` — 읽는 곳 한 줄 교체

### 제외

- **S02 저장 경로** → 아래 참고
- **날씨·기온 반환** (`kma.ts` · `useRecommendations` 반환값) → `FE-FEAT-009`
- **보정축이 전부 null 인 것** → 태깅 작업. 이 티켓은 CF8 축만 살린다

---

## Strategy

읽는 쪽에서 따옴표를 벗겨낸다.

```ts
try {
  const parsed = JSON.parse(raw);          // "CLD" → CLD
  return typeof parsed === "string" ? parsed : null;
} catch {
  return raw;                              // 따옴표 없이 저장된 값도 통과
}
```

### 왜 저장 경로를 안 고치나

- 이미 저장된 기기에서 값이 안 맞는다
- `cf8_code` 는 피그마 UXF2 에서 확정된 키라 형식을 바꾸면 다른 코드에도 영향이 간다
- **읽는 쪽만 관대하게 하면 양쪽 형식이 다 통과한다**

같은 부류의 사고가 이미 한 번 있었다 — `trip_setup_mode` 를 `useLocalStorage` 로
다루면 `"\"CUSTOM\""` 이 저장돼 비교가 **에러 없이** 실패하고 S03 조건이 통째로 무시된다.
`STORAGE_KEYS` 옆 주석에 그 경위가 적혀 있다.

---

## Acceptance Criteria

- [ ] `"CLD"`(따옴표 포함)로 저장돼 있어도 점수가 계산된다
- [ ] 따옴표 없이 저장된 값도 그대로 통과한다
- [ ] 49곳의 점수가 서로 다르다 (전부 같으면 엔진이 안 도는 것)
- [ ] 유형을 바꾸면 순서가 바뀐다
- [ ] `tsc --noEmit` · `lint` · `build` 통과

---

## Verification

1. `localStorage.getItem("cf8_code")` — `"\"CLD\""` 가 나오는지 (재현 확인)
2. `/feed` — 카드의 근거 문장이 장소마다 다른지
3. `cf8_code` 를 `EFV` 로 바꾸고 새로고침 — 순서가 달라지는지
4. 따옴표 없이 `localStorage.setItem("cf8_code","CLD")` 로 넣어도 동작하는지
5. `npx tsc --noEmit` · `npm run lint` · `npm run build`

### 엔진 단독 검증

브라우저 없이 순수 함수로 확인할 수 있다.

```bash
npx tsx --env-file=.env.local -e "
import { readCf8Code } from './src/lib/storage';
globalThis.window = {}; globalThis.localStorage = { getItem: () => '\"CLD\"' };
console.log(readCf8Code());   // CLD
"
```

---

## Implementation Notes

### 2026-09-13: 수정 확인

```
저장된 원본      "\"CLD\""
readCf8Code()   "CLD"
점수            최저 16.7 · 최고 100 · 서로 다른 값 10개
1위             봉래산 100점
```

lint 경고 1건(`feed/page.tsx` set-state-in-effect)은 `main` 에서 넘어온 기존 건이라
건드리지 않았다. `FE-FEAT-009` 가 그 파일을 다시 쓰면서 해소된다.

---

## Derived Artifact Naming Rule

```text
티켓 ID:     FE-BUG-001
파일명:      FE-BUG-001_cf8_code_quotes.md
브랜치명:    fix/cf8-code-quotes
```
