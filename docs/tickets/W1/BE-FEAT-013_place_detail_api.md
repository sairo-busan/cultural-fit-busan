# BE-FEAT-013: 장소 상세 API

```
문제   S20이 쓸 값이 DB에 있는데 응답에 없다. 장소 하나를 조회하는 길도 없다
해결   GET /api/place/[id] — 화면이 쓰는 필드만 한 번에 내려준다
```

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | BE |
| Type | FEAT |
| Severity | Critical |
| Layer | Lib / API / Script |
| Status | Done |
| Owner | 에린 |
| Depends | BE-FEAT-014(시트 재적재, PR#24) · BE-FEAT-012(nearbyPlaces) |
| Related | FE-FEAT-010(S20 화면, `feat/s20-place-detail`) |

소피가 `feat/s20-place-detail` 브랜치에 같은 ID로 초안 티켓을 먼저 올려줬다(9/15) —
그 초안의 조사 내용(operationInfo 키 분포, 영문 연결표 71곳)을 그대로 가져오고,
실제 DB_02 필드명(BE-FEAT-014에서 확정된 `guideDetailKo`/`guideEn`/`guideTipsRawKo`
등)에 맞춰 계약을 다시 썼다.

---

## Problem

S20에 필요한 값이 세 곳에 흩어져 있고, 어느 API도 이를 모아 주지 않는다.

| 값 | 어디 있나 | 지금 응답 |
|---|---|---|
| 영업시간·휴무일·문의전화 | `places.operationInfo` | 없음 |
| 영업시간·휴무일 영문 | TourAPI 영문 서비스(적재 안 됨) | 없음 |
| 무장애 원문 | `places.accessibilityInfo` | `barrierFree` boolean만 |
| 영문 장소명·설명·문화가이드 | `place_info`(BE-FEAT-014로 채워짐) | 응답 자체가 없음(단건 조회 API 없음) |

그리고 장소 하나를 받으려면 `/api/recommend`로 120곳을 다 받아야 한다.

---

## Context

### `operationInfo` 키는 콘텐츠 타입마다 이름이 다르다 (소피 조사, 9/15)

120곳 타입은 관광지(12) 90 · 문화시설(14) 15 · 쇼핑(38) 13 · 레포츠(28) 2.

| 값 | 키(값 있는 곳 수) | 120곳 채움 |
|---|---|---|
| 영업시간 | `usetime` 38 · `usetimeculture` 13 · `opentime` 9 | 60 |
| 휴무일 | `restdate` 37 · `restdateculture` 13 · `restdateshopping` 7 | 57 |
| 문의전화 | `infocenter` 38 · `infocenterculture` 13 · `infocentershopping` 9 | 60 |

레포츠(28) 키(`usetimeleports`·`restdateleports`·`infocenterleports`)는 지금 값 없지만
같이 본다. 영업시간 3곳에 `<br>`이 섞여 온다. `places.tel`은 0/120.

### 영문 영업정보는 TourAPI 영문 서비스(`EngService2`)에 있다 (소피 조사, 9/15)

콘텐츠 ID가 국문과 다른 별도 공간이라 연결표가 필요하다. 부산 영문 목록 1,129건 대조:

| 연결 방법 | 곳 수 |
|---|---|
| 영문 제목 괄호 속 한국어 이름 일치 | 64 |
| 좌표 150m + 눈으로 확인(coord-checked) | 7 |
| 좌표로 걸렸지만 다른 곳(병원·매장 등) — 제외 | 11 |
| 영문판에 없음 | 38 |

연결된 71곳의 영문 `detailIntro2` — 영업시간 61·휴무일 58·문의 71. 한국어엔 없고
영문에만 영업시간이 있는 곳도 27곳. 영문 값에도 `<br />` 섞여 온다.

```
상시 개방  →  Open 24 hr
```

연결표는 `docs/TourAPI_영문_연결표_71.csv`(71행, 저장은 안 함 — `.gitignore` 대상은
아니지만 개인 조사자료라 커밋 안 하고 로컬에서 임포트 스크립트가 직접 읽는다).
coord-checked 7곳은 이름이 특이해서 오매칭 위험 낮음 확인함(에린, 9/15).

### 무장애 영문은 별도 서비스가 없다 (에린 확인, 9/15)

`KorWithService2`(무장애여행)는 국문 전용 카테고리다 — `EngService2`처럼 대응하는
다국어 버전이 따로 없다(공공데이터포털에 그런 상품 자체가 없음). 그래서 무장애
정보는 언어와 무관하게 원문(한국어 텍스트) 그대로 노출하고, 화면에서 라벨만
i18n으로 붙인다. 값 자체를 번역할 방법이 없다는 뜻 — 필요하면 나중에 LLM 번역을
검토(이번 스코프 아님).

### DB_02 필드명 (BE-FEAT-014 기준 — 소피 초안의 명명과 다름)

```
placeNameEn, placeDescEn        →  nameEn / descEn
guideSimpleKo                   →  계약에 안 넣음(화면 미사용, 음성 정해지면 추가)
guideDetailKo                   →  guideDetailKo
guideTipsRawKo                  →  "관람 순서: …\n사진 포인트: …\n유의사항: …" 원문 그대로
                                    저장돼 있음 — 이 API에서 3줄로 분리해서 tipsKo로 응답
guideEn                          →  guideEn
```

---

## Scope

### 포함

1. `src/lib/placeDetail.ts` 신규 — `getPlaceDetail(contentId)`. places + place_info +
   score_board(placeId 역참조용) + place_by_cf8 조인, `operationInfo`/`accessibilityInfo`
   파싱.
2. `GET /api/place/[id]` — 아래 계약. 없는 id는 404.
3. `GET /api/place/nearby` 응답에 `nameKo`·`nameEn`·`descEn` 추가(BE-FEAT-012 확장).
4. `scripts/import-eng-content-id.ts` 신규 — 연결표 71행을 읽어 `places.engContentId`·
   `places.engContentTypeId` 세팅.
5. `scripts/ingest-eng-operation-info.ts` 신규 — `engContentId` 있는 곳만
   `EngService2 detailIntro2` 호출해 `places.engOperationInfo` 저장.

### 제외

- `recommend.ts`의 whyEn·titleEn 연결 — BE-FEAT-011(PR#20)에서 이미 함
- 음성 URL(`audioUrl*`) — 문화가이드 음성 스코프가 정해지면 계약에 추가
- 영문 이유 문장 — DB_03에 컬럼이 없음
- 무장애 영문 번역 — 위 Context 참고, 이번 스코프 아님

---

## 계약

```ts
// GET /api/place/[id]   (id = contentId)
// 200 PlaceDetail · 404 { error }
type PlaceDetail = {
  contentId: string;
  addr1: string;
  mapX: number;
  mapY: number;
  /** firstImage를 맨 앞에, 중복 제거, https(secureImageUrl 재사용) */
  images: string[];

  nameKo: string;                  // place_info.placeName, 없으면 places.title
  nameEn: string | null;           // place_info.placeNameEn
  descKo: string | null;           // place_info.placeDesc
  descEn: string | null;           // place_info.placeDescEn

  /** CF8 코드 → 이유 문장(DB_03). 클라이언트가 자기 코드로 고른다(개인정보 미전송 원칙) */
  reasonByCf8: Record<string, string | null>;

  guideDetailKo: string | null;    // place_info.guideDetailKo
  guideEn: string | null;          // place_info.guideEn
  /** guideTipsRawKo 원문 3줄을 라벨로 분리. 라벨 문구 자체는 화면이 i18n으로 붙인다 */
  tipsKo: { route: string | null; photo: string | null; caution: string | null };

  /** operationInfo에서 콘텐츠타입별 키 중 처음 값 있는 것. <br> → \n, 앞뒤 공백 제거 */
  hours: string | null;
  closedDays: string | null;
  /**
   * engOperationInfo에서 같은 규칙. 연결 안 된 곳(49곳)이거나 그 필드가 없으면 null
   * — 화면이 한국어로 대신한다. `N/A (Open all year round)`처럼 오는 값은 괄호 안만
   * 남긴다 → `Open all year round`
   */
  hoursEn: string | null;
  closedDaysEn: string | null;
  phone: string | null;

  /** accessibilityInfo 중 값 있는 키만(contentid 제외). 언어 구분 없음(Context 참고) */
  accessibility: { key: string; text: string }[];
};
```

---

## Verification

| # | 시나리오 | 요청 | 기대 결과 |
|---|---|---|---|
| 1 | 정상 | 영업정보·무장애 있는 곳 | 모든 필드 채움·`hours`에 `<br>` 없음 |
| 2 | 빈 값 | 사진·영업정보 없는 곳 | `images: []`·`hours: null`·`accessibility: []` |
| 3 | 없는 id | `/api/place/0` | 404 |
| 4 | 타입별 키 | 문화시설(14)·쇼핑(38) 한 곳씩 | `hours`가 각각 `usetimeculture`·`opentime`에서 |
| 5 | 놓치기 쉬운 것 | 아무 곳 | `tipsKo` 세 칸 모두 라벨 없이 값만 |
| 6 | 영문 연결됨 | 국립부산과학관(`2385666`) | `hoursEn`에 실제 값 |
| 7 | 영문 없음 | 영문판에 없는 곳(49곳 중 1) | `hoursEn: null`·`hours`는 그대로 |
| 8 | 회귀 | `/api/place/nearby?contentId=…` | 기존 필드 유지 + `nameKo`·`nameEn`·`descEn` |

`tsc --noEmit`·`lint`·`build`

---

## Derived Artifact Naming Rule

```text
티켓 ID:     BE-FEAT-013
파일명:      BE-FEAT-013_place_detail_api.md
브랜치명:    feat/place-detail-api
```
