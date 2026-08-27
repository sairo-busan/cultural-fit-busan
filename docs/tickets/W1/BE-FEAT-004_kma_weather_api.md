# BE-FEAT-004: 기상청 날씨 API 연동

`추천_알고리즘_명세서_v2.md` 8번 섹션(상태 지표 막대 — 날씨 적합)과 7번 상황 보정(우천 실외 −15)에 필요한 실시간 날씨 데이터를 서버에서 조회하는 프록시.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | BE |
| Type | FEAT |
| Severity | Medium |
| Layer | Route / Lib |
| Status | Done |
| Screen | S20, S40, S44 (날씨 보정이 필요한 화면) |
| Depends | - |
| Related | BE-FEAT-003(추천 API) — 후속으로 상황보정(−15) 반영 시 사용 |

---

## Problem

- **현재 동작**: 날씨 데이터가 전혀 없어서 "우천 시 실외 제외", "날씨 적합 막대" 등 명세서에 정의된 기능을 구현할 수 없음
- **기대 동작**: 좌표를 주면 기상청 단기예보 조회서비스(초단기실황/단기예보)를 서버에서 프록시 호출해서 날씨 데이터 반환
- **영향 범위**: `src/lib/kma.ts`(신규), `src/app/api/weather/route.ts`(신규)

---

## Context

```
관련 문서:
- 참고 문헌/기상청41_단기예보 조회서비스_오픈API활용가이드_2607/*.docx, *.xlsx
- docs/추천_알고리즘_명세서_v2.md 7·8번 섹션

외부 의존:
- KMA_API_KEY (.env.local / Vercel 환경변수, 공공데이터포털 발급)
- API명: VilageFcstInfoService_2.0, base URL: http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0
```

---

## Scope

### 포함

- `GET /api/weather?lat=&lng=&op=ncst|forecast`
- 위경도 → 기상청 격자좌표(nx, ny) 변환 (LCC 투영 공식)
- `ncst`(초단기실황, 현재) / `forecast`(단기예보, 최대 3일) 2개 오퍼레이션
- 발표시각(base_date/base_time) 자동 계산 — 현재 시각 기준 가장 최근 발표+10분 지난 시각

### 제외

- `getUltraSrtFcst`(초단기예보 6시간), `getFcstVersion` — 필요해지면 후속 추가
- 날씨→`weather_type` 보정 로직 자체(비/맑음 판단해서 −15점 적용 등) — 이 API는 원시 데이터만 반환, 보정 로직은 추천엔진 쪽(BE-FEAT-003 이후)에서

---

## Strategy

### Step 1: 위경도→격자 변환 공식 구현 + 검증
가이드 첨부 엑셀의 실제 부산 지점(부산시청·중구·중앙동·영주제1동) nx/ny 값과 대조해서 공식 정확성 확인

### Step 2: 발표시각 계산
- 초단기실황: 매시 정각, 10분 이후부터 조회 가능
- 단기예보: 02/05/08/11/14/17/20/23시, 10분 이후부터 조회 가능

### Step 3: 프록시 라우트
TourAPI 프록시와 같은 패턴 — 키는 서버에만, op 화이트리스트

---

## Acceptance Criteria

- [x] 위경도→격자 변환이 실제 기준값과 일치
- [x] `ncst`, `forecast` 둘 다 200 정상 응답
- [x] 좌표 누락 시 400
- [x] 잘못된 op 시 400
- [x] `npm run build` 통과

---

## Testing Rules

- 유닛테스트 프레임워크 미도입 시점 — 아래 Verification 수동 검증으로 대체

---

## Verification

| # | 시나리오 | 입력/요청 | 기대 결과 |
|---|---|---|---|
| 1 | 정상 — 초단기실황 | `GET /api/weather?lat=35.1587&lng=129.1604&op=ncst` | 200, 기온·습도·강수형태 등 실제 값 |
| 2 | 정상 — 단기예보 | `GET /api/weather?lat=35.1587&lng=129.1604&op=forecast` | 200, 최대 3일치 시간별 예보 |
| 3 | 에러 — 좌표 누락 | `GET /api/weather?op=ncst` | 400 |
| 4 | 에러 — 잘못된 op | `GET /api/weather?lat=...&lng=...&op=bad` | 400 |
| 5 | 회귀 | `GET /api/health`, `GET /api/tour?...`, `GET /api/recommend?...` | 기존 동작 불변 |

---

## Implementation Notes

### 2026-08-27: 구현 완료

- 위경도→격자 변환 공식을 가이드 첨부 엑셀의 실제 부산 4개 지점으로 검증(전부 일치)
- 발표시각 규칙은 가이드 본문의 "예보 발표시각" 표 그대로(추측 없이 문서 근거)
- **삽질 기록**: `serviceKey`를 `URLSearchParams`에 같이 넣었더니 이미 인코딩된 키(공공데이터포털 Encoding 키)가 이중 인코딩되면서 "등록되지 않은 서비스키" 에러 발생. `serviceKey`만 인코딩 없이 URL에 직접 붙이는 방식으로 수정해서 해결
- 실제 호출 테스트: 해운대 좌표 초단기실황(기온 29.6도·습도 82%·강수없음), 단기예보(798개 항목, 3일치) 둘 다 정상 확인

### 2026-08-27: QA에서 Critical 발견 및 수정

`/qa` 진행 중 **타임존 버그** 발견: `getUltraSrtNcstBaseTime`/`getVilageFcstBaseTime`가 `Date.getHours()` 등 서버 프로세스의 로컬 타임존에 의존하고 있었음. 로컬 개발 환경(Asia/Seoul)에서는 문제없이 동작해서 안 보였지만, **Vercel 서버리스 함수는 기본 타임존이 UTC**라 배포하면 9시간 어긋난 발표시각을 계산하게 되는 상황이었음(로컬 테스트로는 절대 못 잡는 유형).

수정: UTC 시각에 9시간을 직접 더한 뒤 `getUTCHours()` 등 UTC 게터로 읽는 방식으로 변경 — 서버 프로세스의 타임존 설정과 무관하게 항상 올바른 KST를 계산하도록 함. `TZ=UTC` 강제 실행 검증으로 로컬(KST)과 동일한 결과 나옴을 확인.
