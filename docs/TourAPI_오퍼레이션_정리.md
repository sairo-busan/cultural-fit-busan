# TourAPI 오퍼레이션 정리 (국문 관광정보 / KorService2)

추측 없이 실제 매뉴얼(`참고 문헌/한국관광공사 OpenAPI 활용매뉴얼 /한국관광공사 OpenAPI별 서비스 명세/1. 한국관광공사_OpenAPI 활용매뉴얼(국문)_v4.4.docx`)과 `2026 OpenAPI 설명회 자료.pdf` 5페이지 표를 대조해서 확인. 8/21에 프록시(`/api/tour`)로 13개 전부 실제 호출해서 검증함.

"국문 관광정보"는 여러 API 카테고리(다국어·무장애여행·오디오가이드·고캠핑·관광사진·생태관광·두루누비·빅데이터·반려동물동반여행) 중 하나이고, 그 아래 실제 호출 단위가 "오퍼레이션"이다. 우리가 쓰는 건 이 국문 관광정보(KorService2) 카테고리뿐.

## 전체 13개 오퍼레이션

| # | 오퍼레이션명(영문) | 국문명 | 필수 파라미터 | 사용 여부 | 용도 |
|---|---|---|---|---|---|
| 1 | `areaBasedList2` | 지역기반 관광정보 조회 | areaCode 등(좌표 불필요) | ✅ 사용 | 장소 목록 초기 수집 |
| 2 | `locationBasedList2` | 위치기반 관광정보 조회 | mapX/mapY/radius 필수 | ❌ 미사용 | 좌표를 서버로 보내지 않는 아키텍처와 안 맞음 |
| 3 | `searchKeyword2` | 키워드 검색 조회 | keyword | ✅ **사용 확정 (신규)** | 검색 기능(S11) — Mongo 텍스트 인덱스 대신 이걸로 대체 가능 |
| 4 | `searchFestival2` | 행사정보 조회 | eventStartDate | ✅ 사용 | 축제/행사 정보 |
| 5 | `searchStay2` | 숙박정보 조회 | - | ❌ 보류 | 숙박 콘텐츠타입(32) 다룰지 미정, 다루면 필요 |
| 6 | `detailCommon2` | 공통정보 조회(상세1) | contentId | ✅ 사용 | 장소 개요·주소·홈페이지 |
| 7 | `detailIntro2` | 소개정보 조회(상세2) | contentId, contentTypeId | ✅ 사용 | 운영시간·주차 등 (contentTypeId별로 필드 다름) |
| 8 | `detailInfo2` | 반복정보 조회(상세3) | contentId, contentTypeId | ✅ **사용 확정 (신규)** | 입장료·이용안내 등 반복 항목 (숙박=객실정보, 여행코스=코스정보) |
| 9 | `detailImage2` | 이미지정보 조회(상세4) | contentId | ✅ **사용 확정 (신규)** | S20 상세화면 이미지 여러 장 (firstimage 1장만으로 부족했음) |
| 10 | `areaBasedSyncList2` | 국문 관광정보 동기화 목록 조회 | areaCode 등 | ✅ 사용 | 배치 동기화, `showflag`로 삭제/비노출 감지 |
| 11 | `detailPetTour2` | 반려동물 동반여행 정보 조회 | contentId | ❌ 미사용 | 서비스 범위 밖으로 판단 |
| 12 | `ldongCode2` | 법정동 코드 조회 | (없음, 전체조회 가능) | ✅ **사용 확정 (신규)** | `lDongRegnCd`/`lDongSignguCd` 코드→지역명 매핑 |
| 13 | `lclsSystmCode2` | 분류체계 코드 조회 | (없음, 전체조회 가능) | ⏸ 보류 | `lclsSystm1~3` 코드→분류명 매핑, 화면에 카테고리명 노출할 때 필요 |

**주의**: 예전에 있던 `areaCode2`(지역코드조회)·`categoryCode2`(서비스분류코드조회)는 v4.4(2026-02-10) changelog에서 "오퍼레이션 삭제"로 명시됨. `2026 OpenAPI 설명회 자료.pdf`엔 아직 "26년 폐기예정"으로 표시돼있어 실제 완전 제거 시점은 불명확 — **위 표의 12·13번(`ldongCode2`/`lclsSystmCode2`)이 그 대체 오퍼레이션이니 새 걸로만 쓰면 됨**, 옛 이름은 안 씀.

참고: `contentTypeId` 코드는 API 호출 없이 매뉴얼에 고정으로 나와있음 — 12 관광지 / 14 문화시설 / 15 축제공연행사 / 25 여행코스 / 28 레포츠 / 32 숙박 / 38 쇼핑 / 39 음식점.

---

## 실제 테스트 결과 (8/21, `/api/tour` 프록시 경유)

### `searchKeyword2` — 부산 관광지 "가덕도" 검색
```
GET /api/tour?op=searchKeyword2&keyword=가덕도&numOfRows=2&pageNo=1
```
→ 200, 필드 구성은 `areaBasedList2`와 거의 동일(addr1/mapx/mapy/firstimage 등) + `lDongRegnCd` 포함.

### `detailInfo2` — 가덕도 등대(contentId=129156) 반복정보
```
GET /api/tour?op=detailInfo2&contentId=129156&contentTypeId=12
```
→ 200, `{ infoname: "입 장 료", infotext: "무료" }` 형태로 4건 (등산로/관광코스안내/입장료/한국어 안내서비스). `infotext`가 빈 문자열인 항목도 있음 — 값 없는 항목은 노출 안 하는 처리 필요.

### `detailImage2` — 가덕도 등대 이미지 목록
```
GET /api/tour?op=detailImage2&contentId=129156&imageYN=Y
```
→ 200, `originimgurl`(원본)/`smallimageurl`(썸네일) 쌍으로 여러 장.

### `ldongCode2` — 부산(lDongRegnCd=26) 시군구 코드
```
GET /api/tour?op=ldongCode2&lDongRegnCd=26&lDongListYn=N&numOfRows=5
```
→ 200, `{ code: "110", name: "중구" }` 형태, 부산 전체 16개 시군구.

### `lclsSystmCode2` — 분류체계 대분류
```
GET /api/tour?op=lclsSystmCode2&numOfRows=5
```
→ 200, `{ code: "AC", name: "숙박" }` 형태 등 대분류 10개(숙박/추천코스/축제공연행사/체험관광/음식 등).

---

## 데이터마트에 영향

`docs/데이터_마트_정의서.md`는 5개 오퍼레이션 기준으로 짰던 초안이라 아래 반영 필요 (다음 작업):

- `places.images: string[]` 추가 — `detailImage2` 결과 (지금은 firstImage 1장만 있었음)
- `places.info: {name, text}[]` 추가 — `detailInfo2` 결과, 빈 값(`infotext=""`) 필터링해서 저장
- 코드→이름 매핑용 로컬 lookup 테이블(또는 상수) — `ldongCode2`/`lclsSystmCode2`를 매번 API로 안 부르고, 부산 지역만 쓰므로 한 번 받아서 정적 상수로 박아두는 게 효율적 (부산 16개 시군구, 분류 대분류 10개뿐이라 굳이 매 요청마다 조회할 규모가 아님)
- 검색 기능(에린 담당): `searchKeyword2`를 그대로 프록시해서 쓰는 방향으로 — Mongo 텍스트 인덱스 새로 설계할 필요 없을 수도 있음
