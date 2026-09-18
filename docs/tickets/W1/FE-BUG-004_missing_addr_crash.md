# FE-BUG-004: 주소 없는 장소 한 곳이 목록 전체를 멈춘다

```
증상   추천 탭 · 저장 탭 · 그 장소 상세가 "This page couldn't load" 만 뜬다 (운영 포함)
원인   장소 1곳의 addr1 이 null 인데, 구 이름을 뽑는 함수가 값을 바로 자른다
       카드 하나가 렌더 중 터지면 React 가 화면 전체를 못 그린다
해결   표시 함수가 없는 값을 받아 넘기게 하고, 타입을 사실대로 고친다
```

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | FE |
| Type | BUG |
| Severity | **High** (운영 화면 정지) |
| Layer | Lib · Type |
| Status | Done |
| Screen | S10 추천 · 저장 · S20 |
| Depends | — |
| Related | FE-FEAT-017 (발견 경위) · BE-FEAT-019 PR #51 (재적재가 빈 값으로 덮는 문제) |

---

## Problem

### 증상 (2026-09-18 04:00 실측)

| 확인 대상 | 서버 | 화면 |
|---|---|---|
| 운영 `/ko/feed` | 200 | 카드 0개 · "This page couldn't load" |
| 운영 (새 브라우저 프로필) | 200 | 같음 |
| 로컬 `cfb-s10-gallery` (main 기준) | 200 | 같음 |
| 저장 탭 — 해당 장소를 저장한 경우 | — | 화면 전체 정지 (다른 저장한 곳도 못 봄) |
| S20 `영주하늘눈전망대` 상세 | — | 화면 정지 |
| S20 다른 장소 · 근처 목록 | — | 정상 |

```
Uncaught TypeError: Cannot read properties of null (reading 'split')
  at districtLabel (src/lib/placeDisplay.ts:12)   // addr1.split(" ")
  at PlaceCard (src/components/place/PlaceCard.tsx:44)
  at FeedContent (src/app/[locale]/feed/FeedContent.tsx:111)
```

### 원인

| 층 | 내용 |
|---|---|
| 데이터 | `영주하늘눈전망대`(contentId `2721157`) 의 `addr1` · `mapX` · `mapY` 가 `null`. 운영 119곳 중 1곳 (담당자 확인 중) |
| 코드 | `districtLabel` · `districtLabelEn` 이 `addr1` 을 바로 자른다 |
| 타입 | `RecommendedPlace.addr1` · `mapX` · `mapY` 가 "항상 있음"(`string` · `number`)으로 선언돼 컴파일러가 못 잡았다 |
| 영향 확대 | 카드 하나가 렌더 중 터지면 React 가 그 화면 전체를 못 그린다 → 1곳 때문에 목록 119곳이 사라진다 |

데이터를 채워도 재적재가 다시 비울 수 있다(PR #51 리뷰 지적). 화면 쪽 방어는 남긴다.

### 운영 데이터 빈 값 현황 (119곳)

| 필드 | 빈 곳 |
|---|---|
| `addr1` · `mapX` · `mapY` · `overview` | 1 |
| `firstImage` | 4 |
| `images` | 10 |
| `info` | 30 |
| `barrierFree` | 39 |

---

## Scope

### 포함

- `districtLabel` · `districtLabelEn` — 주소가 없으면 `null` 을 돌려준다
- 타입 정정 — `addr1` · `mapX` · `mapY` 를 없을 수 있는 값으로
- 좌표 없는 곳은 근처 장소 거리 계산에서 제외

### 제외

- 빈 값을 화면에 "정보 확인 중" 처럼 보여주는 것 — 지금은 죽지 않는 것까지
- 데이터 복구 · 재적재 스크립트 (에린)
- 카드 단위 오류 경계(Error Boundary) 도입

---

## 결정

| # | 항목 | 결정 |
|---|---|---|
| 1 | 고치는 자리 | 화면이 아니라 표시 함수 한 쌍. 카드 · 저장 탭 행 · 상세가 같은 함수를 써서 한 번에 해결된다 |
| 2 | 없을 때 화면 | 메타 줄에서 구 이름만 빠진다 (`수영구 · 전망 · 야외` → `전망 · 야외`). 자리 표시 문구는 넣지 않는다 |
| 3 | 타입 | 사실대로 `string \| null` · `number \| null`. 이후 같은 실수는 컴파일러가 잡는다 |
| 4 | 좌표 | 좌표가 없으면 근처 장소 후보에서 뺀다 — 거리 0분 같은 값이 나오지 않게 |

---

## Strategy

### Step 1: 표시 함수 · 타입

`districtLabel` · `districtLabelEn` 가드 + `addr1` · `mapX` · `mapY` 타입 정정. `tsc` 가 가리키는 자리를 따라 호출부를 맞춘다.

### Step 2: 근처 장소

좌표 없는 곳을 후보에서 제외한다.

### Step 3: 검증

세 화면(추천 · 저장 · 그 장소 상세) 전후 캡처 · `tsc` · `lint` · `build`.

---

## Acceptance Criteria

- [x] 추천 탭이 119곳을 그린다 (주소 없는 곳 포함)
- [x] 주소 없는 곳의 카드는 메타 줄에서 구 이름만 빠지고 나머지는 그대로다
- [x] 저장 탭에 그 장소를 저장해도 화면이 그려진다
- [x] 그 장소의 상세(S20)가 열린다
- [x] 좌표 없는 곳이 근처 장소 목록에 거리와 함께 나오지 않는다 (코드 확인)
- [x] `tsc --noEmit` · `lint` · `build` 통과

---

## Verification

1. `/ko/feed` · `/en/feed` — 카드 수 119
2. `localStorage.cfb_saved` 에 `2721157` 을 넣고 저장 탭
3. `/ko/place/2721157` · `/en/place/2721157`
4. 정상 장소의 근처 장소 목록 3곳 — 거리 표시
5. `npx tsc --noEmit` · `npm run lint` · `npm run build`

---

## Implementation Notes

### 커밋 (`fix/place-missing-addr` · PR #52)

| 커밋 | 내용 |
|---|---|
| `31d6ee2` | `districtLabel` · `districtLabelEn` 가드 · `addr1` · `mapX` · `mapY` 타입 정정 · 근처 장소에서 좌표 없는 곳 제외 |
| `d7df513` | 티켓 |
| `6a717d6` | 전후 캡처 |

### 검증

같은 브라우저로 수정 전(main 기준) · 후를 나란히 확인.

| 화면 | 전 | 후 |
|---|---|---|
| 추천 탭 | 카드 0 · 화면 정지 | 카드 119 |
| 저장 탭 (그 장소 저장) | 화면 정지 | 정상 |
| S20 그 장소 | 화면 정지 | 열림 · 메타 줄 `전망·야경` |
| 영문 추천 · 저장 · 상세 | — | 정상 |
| 근처 장소 (정상 장소) | — | 3곳 그대로 |

FE-FEAT-017 진단 전 목록에서도 그 장소가 그려지는 것을 확인했다.

### 남은 것

- 데이터 — `영주하늘눈전망대` 주소 · 좌표는 담당자 확인 중
