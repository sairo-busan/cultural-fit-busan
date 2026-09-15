# FE-FEAT-010: S20 장소 상세 — 실데이터 연결

```
S20   갈지 말지 판단하는 허브. 목업 값을 걷어내고 Model B 데이터로 잇는다
계약   화면이 필요한 필드를 PlaceDetail 로 정하고 BE-FEAT-013 으로 요청한다
```

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | FE |
| Type | FEAT |
| Severity | Critical |
| Layer | Page / Component / Type |
| Status | In Progress |
| Screen | S20 |
| Depends | BE-FEAT-013 (장소 상세 API) · BE-FEAT-012 (근처 장소 API, PR #21) |
| Related | FE-FEAT-009 (저장 · 행 컴포넌트 선례) · FE-FEAT-013 (음성 도슨트) |

---

## Problem

`/place/[id]` 는 `mock-places.ts` 에서 값을 읽는다. 적합도 %·실시간 막대·날씨 문구가
박혀 있어 **실제 장소와 무관한 화면**이다.

저장도 옛 스키마(`string[]`)로 `cfb_saved` 에 쓴다. FE-FEAT-009 에서 `{ id, savedAt }`
으로 바꾼 뒤라, 상세에서 저장하면 저장 탭 목록이 비어 버린다.

---

## Context

목업 — `docs/_internal/mockup_v6.html` "앞으로의 계획" · `concept_v5.html` ②

### 데이터 기준은 Model B 다

`placeTags`(49곳)는 폐기됐다. 원천은 `places`(TourAPI) + DB_01·02·03 시트다.
목업은 `placeTags` 시절에 그려서, 원천이 없는 칸이 많다.

### 채움률 (2026-09-15, 120곳)

```
120/120   place_name · place_name_en · place_desc · place_desc_en
          cultureGuideText_ko 3칸 · cultureGuideText_en          (DB_02 시트)
960       recommendation_reason — ko 만                           (DB_03)
108       firstImage        57   images(갤러리)
60        영업시간(usetime*·opentime)   57 휴무일(restdate*)   60 문의(infocenter*)
43        accessibilityInfo(무장애 원문)
0         tel · indoor_outdoor · pet_allowed · place_type
```

`tel` 은 전건 비어 있고 전화번호는 `operationInfo.infocenter*` 에 있다.

### 문화 가이드 칸의 실제 구조

| 칸 | 평균 | 내용 |
|---|---|---|
| 도슨트_간단히 | 77자 | 30초 분량. 자세히의 앞부분과 겹친다 |
| 도슨트_자세히 | 162자 | 3문단 |
| 놓치기 쉬운 것 | 128자 | 120곳 모두 `관람 순서: …` `사진 포인트: …` `유의사항: …` 세 줄 |
| en | 446자 | 자세히의 번역. 3문단. 놓치기 쉬운 것의 영문은 없다 |

### 시트는 채워졌지만 DB 는 아직이다

2026-09-15 기준 `score_board.contentId` 0/120, `place_info.placeDesc` 는 `설명1`.
재임포트와 `import-db02` 의 새 칼럼 반영이 남아 있다(에린).

---

## Scope

### 포함 — 화면이 답할 질문

| 질문 | 블록 | 출처 |
|---|---|---|
| 어떤 곳인가 | 사진 · 이름 · 한 줄 설명 · 주소 | `images` · `name*` · `desc*` |
| 나한테 왜 맞나 | 이 곳이 맞는 이유 | `reasonByCf8[cf8_code]` |
| 지금 갈 수 있나 | 영업시간 · 휴무일 · 전화 · 무장애 | `hours` · `closedDays` · `phone` · `accessibility` |
| 가서 뭘 보나 | 문화 가이드 · 놓치기 쉬운 것 | `guideDetailKo` / `guideEn` · `tips` |
| 같이 갈 곳은 | 근처 3곳 | `/api/place/nearby` |
| 어떻게 가나 | 지도 보기 · 길찾기 | 구글맵 |

### 포함 — 상태

```
로딩          스켈레톤
없는 id       안내 + 추천으로
불러오기 실패   다시 시도
사진 없음      12/120. 자리를 유지하고 대체 표시
진단 전       이유 블록만 빠진다
```

### 제외

| 항목 | 이유 |
|---|---|
| 머무는 시간 · 혼잡도 · 한산한 시간 · 영어 안내 · 비용 · 후기 | Model B 에 원천 칼럼이 없다 |
| 비 올 때 · 반려동물 | `indoor_outdoor` · `pet_allowed` 칼럼이 시트에 없다. 생기면 그리드에 한 칸씩 더한다 |
| 분류 | 태깅 vs `contenttypeid` 자동 매핑이 결정 전이다 |
| 음성 도슨트 | FE-FEAT-013. 음원과 팀 결정 대기 |
| 영문 이유 | DB_03 에 영문 칼럼이 없다 |
| 근처 거리 m | #21 응답에 없다. 분만 쓴다 |

---

## Strategy

### Step 1: 계약 타입 + 로컬 픽스처

`src/types/place.ts` 에 `PlaceDetail` 을 둔다(BE-FEAT-013 계약과 같은 모양).

BE 가 오기 전에는 시트 CSV 와 `places` 문서로 만든 3곳 픽스처를 임시 라우트로 띄운다.
임시 라우트는 `.git/info/exclude` 에 넣어 커밋되지 않게 한다.

```
① 갤러리 · 영업정보 · 무장애가 다 있는 곳
② 사진 · 영업정보가 없는 곳
③ 영문이 짧은 곳
```

### Step 2: 화면 뼈대

FE-FEAT-009 와 같이 `page.tsx` · `PlaceContent.tsx` · `PlaceSkeleton.tsx` 로 나눈다.

### Step 3: 히어로

가로 `scroll-snap` 갤러리. 2장 이상일 때만 `n / N`.
뒤로(기록 없으면 추천으로) · 저장(`useSavedPlaces` · `SaveButton onScrim`).

### Step 4: 머리 · 이유 · 그리드

```
중구                      districtLabel
40계단 문화관광테마거리      nameKo / nameEn
피란 시절의 기억을 품은…     descKo / descEn
부산광역시 중구 …           addr1

[이 곳이 맞는 이유]         ko 이고 값이 있을 때만

영업시간 | 휴무일
전화     | 무장애
```

### Step 5: 문화 가이드 · 근처 · CTA

가이드 본문은 `자세히`(ko) / `en` 을 문단으로 나눠 그린다. `간단히` 는 S20 에 쓰지 않는다
— 자세히와 겹치고, 30초 도슨트 원고라 FE-FEAT-013 의 것이다.

놓치기 쉬운 것은 `관람 순서 · 사진 포인트 · 유의사항` 세 줄. 라벨은 i18n 이다.

근처는 #21 을 그대로 쓴다. 장소끼리의 직선거리라 `도보 약 N분` 으로 적는다.

지도 보기 · 길찾기는 구글맵으로 넘긴다. 외국인 사용자에게 카카오맵은 설치돼 있지 않은 앱이다.

```
지도 보기   https://www.google.com/maps/search/?api=1&query={mapY},{mapX}
길찾기     https://www.google.com/maps/dir/?api=1&destination={mapY},{mapX}
```

### Step 6: BE-FEAT-013 도착 후

임시 라우트와 exclude 줄을 지우고 실데이터로 Verification 을 다시 돈다.

---

## 목업과 다르게 간 곳

| 항목 | 목업 | 이 구현 | 이유 |
|---|---|---|---|
| 그리드 | 8칸 | 4칸 (영업시간 · 휴무일 · 전화 · 무장애) | 나머지는 원천 없음 |
| 상단 한 줄 | `중구 · 실내` | `중구` | `indoor_outdoor` 없음 |
| 장소명 | TourAPI `title` | 시트 `place_name` | `봉래산(부산)` 같은 TourAPI 표기 대신 큐레이션 이름. 영문이 있다 |
| 이유 문장 | `whyKo` | `reasonByCf8[내 코드]` | 유형마다 문장이 다르다 |
| 이용 방법 · 후기 | 있음 | 문화 가이드 · 놓치기 쉬운 것 | DB_02 가 대체 |
| 음성 버튼 | 있음 | 없음 | FE-FEAT-013 |
| 근처 거리 | `도보 2분 176m` | `도보 약 2분` | m 값이 응답에 없고 직선거리다 |
| 전화 출처 | `tel` | `infocenter*` | `tel` 0/120 |

---

## Acceptance Criteria

- [ ] `mock-places.ts` 를 읽지 않는다
- [ ] 이름 · 설명 · 가이드가 로케일에 맞게 나온다
- [ ] 진단 결과가 있으면 그 유형의 이유 문장이 나오고, 없으면 블록이 빠진다
- [ ] 영업정보가 없는 곳은 라벨이 남고 값이 `—` 다
- [ ] 사진 없는 곳에서 레이아웃이 무너지지 않는다
- [ ] 상세에서 저장한 곳이 저장 탭 맨 위에 나온다
- [ ] 근처 3곳이 거리순이고 누르면 그 상세로 간다
- [ ] 지도 보기 · 길찾기가 구글맵을 연다
- [ ] 임시 라우트가 커밋에 없다
- [ ] `tsc --noEmit` · `lint` · `build` 통과

---

## Verification

| # | 시나리오 | 입력 | 기대 결과 |
|---|---|---|---|
| 1 | 정상 | ① 진입 | 갤러리 `n / N` · 그리드 4칸 값 · 가이드 · 놓치기 쉬운 것 3줄 |
| 2 | 빈 값 | ② 진입 | 사진 자리 유지 · 그리드 `—` |
| 3 | 진단 전 | `cf8_code` 삭제 후 ① | 이유 블록 없음, 나머지 정상 |
| 4 | 영문 | `/en/place/①` | 영문 이름 · 설명 · 가이드 · 라벨 / 이유 블록 · 놓치기 쉬운 것 없음 |
| 5 | 저장 | 저장 → 저장 탭 | 맨 위 · `cfb_saved` 가 `{id, savedAt}` · 해제 시 되돌리기 토스트 |
| 6 | 없는 id | `/place/0` | 안내 + 추천으로 이동 |
| 7 | 실패 | 오프라인 새로고침 | 다시 시도 |
| 8 | 근처 | ① 근처 첫 행 누름 | 해당 상세 · 거리순 |
| 9 | 회귀 | 추천 · 저장 탭 | 행 · 저장 동작 불변 |

`npx tsc --noEmit` · `npm run lint` · `npm run build`

---

## 알아둘 점

- **앱 빌드에서 S20 이 빠진다.** APP-CHORE-001 의 `scripts/build-app.sh` 가
  `src/app/[locale]/place` 를 정적 export 에서 제외한다. 앱에서 상세를 열려면
  경로 형태(`?id=` 또는 `generateStaticParams`)를 정해야 한다
- 같은 브랜치에서 fetch 가 `NEXT_PUBLIC_API_BASE` 절대 주소로 바뀐다. 먼저 머지되는 쪽에 맞춘다
- 에린 스택(#19~#21)은 #16~#18 이전 `main` 에서 갈라져 있다. 이 브랜치는 `main` 에서 따고 계약 타입으로만 잇는다

---

## Derived Artifact Naming Rule

```text
티켓 ID:     FE-FEAT-010
파일명:      FE-FEAT-010_s20_place_detail.md
브랜치명:    feat/s20-place-detail
```
