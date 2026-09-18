# BE-FEAT-019: places 주간 자동 재적재 + hours·무장애 영문(Phase 4)

TourAPI 데이터 활용도를 높이기 위해 `places` 원본을 GitHub Actions로 매주
자동 재적재하고, 그 과정에서 stale해질 수 있는 LLM 번역 영문 필드(hours·
무장애)를 안전하게 관리한다.

---

## Metadata

| Key | Value |
|-----|-------|
| Prefix | BE |
| Type | FEAT |
| Severity | Medium |
| Layer | CI / Script / Lib |
| Status | Done — 머지 후 `workflow_dispatch` 1회 확인만 남음 |
| Screen | S20 (장소 상세) |
| Depends | BE-FEAT-013(placeDetail.ts) |
| Related | 심사 기준 "데이터 활용(20점)" |

---

## Problem

- **현재 동작**: `places`(TourAPI 원본) 갱신이 전부 수동 스크립트 실행뿐(cron
  없음) — 심사에서 "API 활용도"를 어필하기 약함. 또한 영업시간(49곳 중
  TourAPI 영문 소스 없는 곳)·무장애 정보(TourAPI 영문 서비스 자체 없음)는
  영문이 아예 비어있었다.
- **기대 동작**: 매주 자동으로 TourAPI에서 최신 데이터를 받아오고, 영문이
  없는 곳은 LLM 번역으로 채운다. 단, 자동 재적재가 번역 원본(한국어)을
  바꿔버리면 번역이 조용히 stale해지는 문제를 반드시 막는다.
- **영향 범위**: `.github/workflows/`, `places`·`place_info` 컬렉션,
  `src/lib/placeDetail.ts`.

---

## Context

```
관련 파일:
- .github/workflows/refresh-places.yml (신규)
- scripts/check-stale-en-fields.ts (신규)
- scripts/fill-hours-en-manual.ts (신규)
- scripts/fill-accessibility-en.ts (신규)
- src/lib/placeDetail.ts
```

### 왜 GitHub Actions인가

Vercel Cron도 검토했으나, 이 프로젝트는 이미 스크립트 기반 배치 파이프라인이
전부 `node --import tsx scripts/*.ts` 구조라 GitHub Actions가 그대로 재사용
가능 — Next.js 앱 라우트로 옮길 필요가 없다.

### 왜 매주고, 왜 이 시간대인가

TourAPI 콜 수(120곳×4종 API 이상, 480+콜/회)를 아끼고, 장소 운영정보가
하루 단위로 바뀔 일이 드물어 매주로 충분하다고 판단(사용자 결정). 시간대는
일요일 04:00 KST(=토요일 19:00 UTC) — 트래픽 가장 적은 시간대.

**확인 완료(9/17)**: TourAPI(공공데이터포털) 일일 트래픽 한도는 1,000건
(일반 계정 기준). 480+콜/회는 여유 있게 안에 들어온다. 운영계정으로
신청하면 한도가 더 늘어난다(필요 시 검토).

### `import-eng-content-id.ts`는 워크플로우에 안 넣는다

소피가 만든 개인 조사자료 CSV(`docs/TourAPI_영문_연결표_71.csv`)를 읽는데,
이 파일은 커밋하지 않아서 CI엔 없다. `places.engContentId`는 한 번
세팅되면 `ingest-places.ts`가 건드리지 않는 필드라 매주 재적재해도 유지된다
— 재실행 불필요.

### stale 감지 — 왜 필요하고 어떻게 하는가

`ingest-places.ts`는 `updateOne`+`$set`이라 지정 안 한 필드(영문 번역 필드
등)는 안 지워지지만, `...detail` 스프레드가 `operationInfo`·
`accessibilityInfo`(번역 원본이 되는 한국어)는 매번 최신 TourAPI 값으로
덮어쓴다. 자동 배치가 되면 이 값이 조용히 바뀌고 영문 번역만 옛날 그대로
남을 위험이 실제로 생긴다(수동 실행 때는 낮은 빈도라 무시했던 위험).

그래서 번역 당시 한국어 원문을 `*SourceKo` 필드에 스냅샷으로 저장해두고,
`check-stale-en-fields.ts`가 재적재 직후 현재 값과 대조한다. 달라졌으면:
1. 해당 영문 필드를 `$unset`(placeDetail.ts가 한국어로 안전하게 폴백)
2. GitHub 이슈 생성/코멘트(제목 고정, 중복 이슈 안 만듦) — 재번역 체크리스트

LLM 재번역 자체는 CI에서 안 한다(Anthropic API 연동 인프라 없음, 비용·
안정성 이슈) — 이슈 보고 사람이 나중에 처리.

### Phase 4 데이터 — 반복 패턴 발견

- 영업시간·휴무일: 49곳 중 실제 값 있는 22곳, 고유 문구 10개씩(하드코딩 매핑)
- 무장애: 43곳, 260개 값이 174개 고유 문구(병렬 번역 4배치)

---

## Scope

### 포함

1. `.github/workflows/refresh-places.yml` — 매주 일요일 04:00 KST,
   `ingest-places.ts` → `ingest-eng-address.ts` → `ingest-eng-operation-info.ts`
   → `check-stale-en-fields.ts` 순서
2. `scripts/fill-hours-en-manual.ts` — `places.hoursEnManual`·
   `closedDaysEnManual`(+ `*SourceKo` 스냅샷) 적재, 22건
3. `scripts/fill-accessibility-en.ts` — `place_info.accessibilityInfoEn`
   (+ `accessibilityInfoSourceKo` 스냅샷) 적재, 43곳
4. `scripts/check-stale-en-fields.ts` — 스냅샷 대조, stale 시 `$unset` +
   GitHub 이슈
5. `src/lib/placeDetail.ts` — `hoursEn`/`closedDaysEn`에 manual 필드 폴백
   추가, `accessibilityEn` 배열 신규

### 제외

- LLM 자동 재번역(CI 내) — 사람이 이슈 보고 수동 처리
- `place_info`·`score_board`(유나 태깅) 자동 갱신 — 스코프 아님, 수동 유지

---

## Verification

1. `npx tsc --noEmit` — 통과
2. `fill-hours-en-manual.ts`: hoursEnManual 22/22, closedDaysEnManual 22/22
3. `fill-accessibility-en.ts`: accessibilityInfoEn 43/43곳
4. `check-stale-en-fields.ts` 로컬 실행 — stale 0건(방금 채운 값과 원본이
   아직 같으므로 정상)
5. 워크플로우는 main 머지 후(`workflow_dispatch`는 기본 브랜치에 파일이
   있어야 실행 가능 — GitHub 제약) 수동 1회 실행해 확인 필요

---

## Implementation Notes

### 2026-09-17: 배치 설정 + Phase 4 데이터 적재

- GitHub Actions 시크릿(`TOUR_API_KEY`, `MONGODB_URI`) 등록 완료(사용자
  승인 후).
- TourAPI 일일 트래픽 한도 확인 완료 — 일반 계정 1,000건/일, 480+콜/회로
  안전. 운영계정 전환 시 한도 더 늘어남(필요 시 검토).

### 2026-09-18: 복구 스크립트 자체 버그 — 2721157 title·주소·좌표 null (소피 발견)

`refresh-curated-places.ts`의 "실패 시 스킵" 로직에 허점이 있었다:
`callTourApi`는 TourAPI가 `resultCode` 에러를 줄 때만 throw하는데,
`detailCommon2`가 **성공(resultCode 0000)하면서 item이 없는** 경우엔
throw가 안 걸려서 `commonItem`이 `undefined`가 되고 `title`/`addr1`/
`mapX`/`mapY`가 전부 `undefined`인 채로 `$set`에 들어갔다. MongoDB
드라이버가 undefined 필드를 null로 직렬화해서, 2721157(영주하늘눈전망대)
장소의 이름·주소·좌표가 전부 null로 손상됐다.

**수정**:
1. `fetchDetail`에서 `commonItem.title`이 없으면 명시적으로 throw해서
   이 장소를 스킵(장소의 정체성 자체가 없으면 "실패"로 취급)
2. 범용 안전장치로 `omitUndefined()` 헬퍼 추가 — `$set` 페이로드에서
   undefined 값을 가진 키를 아예 제거. TourAPI가 다른 필드를 부분적으로
   빠뜨려도 같은 사고가 재발하지 않는다
3. 2721157 복구: `place_info`(유나 원고)의 이름으로 title 복구, 웹 검색으로
   확인한 주소로 addr1 복구, 정확한 지번 좌표를 못 구해 OpenStreetMap
   Nominatim으로 **동 단위 근사 좌표**만 넣고 `coordApprox: true` 플래그
   남김 — 나중에 정확한 좌표로 교체 필요
4. 재실행해서 이번엔 안전하게 스킵되는지 확인(118곳 갱신, 1곳 스킵) — 통과

### 2026-09-18: any 타입 lint 에러 정리(소피 발견)

`fill-recommendation-reason-en.ts`·`generate-docent-audio-ko.ts`·
`generate-docent-audio-en.ts`의 `any` 캐스팅을 전부 MongoDB 컬렉션
제네릭 타입으로 교체. 같이 작업하던 `check-stale-en-fields.ts`·
`fill-accessibility-en.ts`·`fill-hours-en-manual.ts`·
`refresh-curated-places.ts`도 같은 패턴이라 함께 정리. 번역 데이터
파일도 `/tmp`에서 `scripts/data/`로 옮겨 레포에 커밋(재현 가능하게).

재검증 겸 세 fill 스크립트를 다시 돌려보니, 오늘 재적재로 TourAPI 원본이
살짝 바뀌어서 매칭 커버리지가 늘었다(hoursEnManual 22→36건,
accessibilityInfoEn 43→52곳) — 사전에 없는 새 문구는 매칭 실패로 남아
있지만(화면은 한국어로 폴백), 안전 장치가 잘 작동함을 재확인했다.
`check-stale-en-fields.ts` 최종 실행 — stale 0건.
