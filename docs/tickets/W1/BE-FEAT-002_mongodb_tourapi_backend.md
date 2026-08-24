# BE-FEAT-002: MongoDB 백엔드 기반 + TourAPI 프록시 + 부산 장소 초기 적재

TourAPI를 서버에서 프록시하고, 부산 관광지·문화시설·축제·음식점 데이터를 MongoDB `places` 컬렉션에 적재하는 백엔드 기반 구축.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | BE |
| Type | FEAT |
| Severity | Critical |
| Layer | Route / Lib / DB |
| Status | Done |
| Screen | S10, S20, S13 (place 데이터 쓰는 전체 화면의 전제조건) |
| Depends | - |
| Related | BE-FEAT-001 (Place 타입 — 이 티켓이 채우는 데이터의 응답 형태) |

---

## Problem

- **현재 동작**: 서버·DB 없음(원래 아키텍처 원칙). TourAPI 키를 직접 클라이언트에서 호출해야 해서 키 노출 위험. 장소 데이터를 매번 실시간 API 호출로만 가져와야 해서 추천엔진이 쓸 구조화된 데이터가 없음
- **기대 동작**: TourAPI 서비스키는 서버에만 존재(`/api/tour` 프록시 경유). 부산 장소 데이터를 MongoDB `places` 컬렉션에 적재해두고, 추천엔진·검색이 여기서 조회
- **영향 범위**: `src/app/api/tour/`, `src/app/api/health/`, `src/lib/mongodb.ts`, `src/lib/tourApiCodes.ts`, `scripts/ingest-places.ts`, `docs/데이터_마트_정의서.md`, `docs/TourAPI_오퍼레이션_정리.md`

---

## Context

```
관련 파일:
- src/app/api/tour/route.ts (TourAPI 프록시, 13개 오퍼레이션 화이트리스트)
- src/app/api/health/route.ts (MongoDB 연결 헬스체크)
- src/lib/mongodb.ts (연결 헬퍼, lazy-init)
- src/lib/tourApiCodes.ts (부산 시군구·분류체계 코드 상수)
- scripts/ingest-places.ts (초기 구축 스크립트, Node 단독 실행)

외부 의존:
- TOUR_API_KEY, MONGODB_URI (.env.local / Vercel 환경변수, docs/_internal/ENV_GUIDE.md)
- MongoDB Atlas M0 무료 클러스터
```

---

## Scope

### 포함

- TourAPI 프록시 라우트 (서비스키 서버 은닉)
- MongoDB 연결 + 헬스체크
- 부산 코드 상수 (법정동·분류체계)
- 장소 초기 적재 스크립트 (areaBasedList2 + 상세4종 + searchFestival2)

### 제외

- 추천엔진 로직 (별도 티켓)
- `유나` 태깅 데이터 → `placeTags` 임포트 스크립트 (별도 티켓, 태깅 시트 완성 후)
- `searchKeyword2` 검색 API 노출 (별도 티켓)

---

## Strategy

### Step 1: TourAPI 프록시 — op 화이트리스트로 임의 엔드포인트 호출 차단
### Step 2: MongoDB 연결 — 런타임 lazy-init (모듈 로드 시 throw 금지, 빌드 안 깨지게)
### Step 3: 코드 상수 — ldongCode2/lclsSystmCode2는 부산 범위만 정적 고정, 매 요청 호출 안 함
### Step 4: 적재 스크립트 — areaBasedList2로 목록 → 장소별 상세 병합 → upsert. 축제는 searchFestival2로 날짜 별도 보강

---

## Acceptance Criteria

- [x] TOUR_API_KEY가 클라이언트로 안 나감 (서버 프록시 경유만)
- [x] `MONGODB_URI` 미설정 상태에서도 `next build` 통과 (모듈 로드 시 throw 금지)
- [x] 부산 관광지·문화시설·축제·음식점 데이터 `places`에 적재
- [x] 축제(contentTypeId=15) 문서에 eventStartDate/eventEndDate 존재

---

## Testing Rules

- 외부 서비스(TourAPI, MongoDB Atlas) 대상 통합 스모크로 검증(유닛테스트 프레임워크 미도입 시점, 수동 검증으로 대체 — 아래 Verification 참고).
- 타입체크 통과 후 핸드오프.

---

## Verification

| # | 시나리오 | 입력/요청 | 기대 결과 |
|---|---|---|---|
| 1 | 정상 — TourAPI 프록시 | `GET /api/tour?op=areaBasedList2&areaCode=6&contentTypeId=12` | 200, 부산 관광지 목록 |
| 2 | 에러 — 화이트리스트 밖 op | `GET /api/tour?op=notARealOp` | 400 |
| 3 | 정상 — MongoDB 연결 | `GET /api/health` | `{"mongodb":"ok"}` |
| 4 | 회귀 — 빌드 (env 없음) | `.env.local` 제거 후 `npm run build` | 빌드 성공 (8/24 최초 버전은 여기서 실패했었음) |
| 5 | 정상 — 초기 적재 | `node --env-file=.env.local --import tsx scripts/ingest-places.ts` | 부산 530건 `places`에 upsert, 축제 22건 전부 eventStartDate 존재 |

---

## Implementation Notes

### 2026-08-24: 구현 완료 + 빌드 버그 수정

최초 버전은 `mongodb.ts`가 모듈 로드 시점에 `throw` 해서 Vercel 빌드가 env 미설정으로 실패(직접 main push 후 발견 → revert). lazy-init으로 수정 후 무-env 빌드 통과 확인. `docs/_internal/analysis/BE-FEAT-002_mongodb_tourapi_backend_report.md`에 상세 기록.
