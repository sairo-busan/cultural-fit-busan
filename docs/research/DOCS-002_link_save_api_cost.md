# 링크 저장 기능의 외부 API 과금 · 호출량

- 기준일: 2026-10-29 · 관련: [조사](./DOCS-002_link_save_feasibility_analysis.md) · [지도 API 결정](../decisions/2026-10-29_링크저장_지도API_선택.md) · 구현 `FE-FEAT-019`
- 서버 키는 Vercel API(`/api/link-resolve` · `/api/place-search`)에서만 쓴다. 앱(Capacitor)도 같은 API 를 부른다.

## API 별 과금

| API | 쓰는 곳 | 무료 한도 | 넘으면 | 출처 |
|---|---|---|---|---|
| YouTube Data API v3 `videos.list` | 링크 분석 — 영상 제목 · 설명란 | 프로젝트당 하루 10,000 단위(`search.list` 제외 전체 합산). `videos.list` 1건 = 1 단위 | 유료 요금제 없음 — 할당량 제한 방식. 늘리려면 약관 준수 감사 후 증설 신청 | [Y1] [Y2] |
| YouTube Data API v3 `search.list` | 쓰지 않음(표본 영상 찾을 때만) | 별도 할당량 하루 100회 | 〃 | [Y1] |
| 카카오 로컬 — 키워드 검색 | 링크 분석 · 직접 찾기 · 영상 상세(주소 · 좌표 다시 받기) | 앱별 일 · 월 무료 쿼터. **일일 수치 확인 필요**(앱 관리 [통계] > [쿼터]) | 429 오류. 결제 수단 등록 시 추가 호출 | [K1] [K2] |
| 카카오 지도 JavaScript SDK | L2 · 영상 상세 지도 | 앱별 무료 쿼터. **수치 확인 필요** | 〃 | [K1] |
| 구글 Places API (New) Text Search Pro | 쓰지 않음(비교 후 보류) | 월 5,000 건 | 1,000 건당 $32 · 결제 계정 필수 | [G1] |
| 구글맵 검색 링크 `google.com/maps/search/?api=1` | 장소 줄의 "구글맵" | 키 없음 · 과금 없음(지도 앱을 여는 주소) | — | — |
| TourAPI | 링크 저장에서는 쓰지 않음(장소 확정은 카카오) | — | — | — |

## 이 기능의 호출량

| 동작 | YouTube | 카카오 로컬 | 카카오 지도 SDK |
|---|---|---|---|
| YouTube 링크 1개 분석(L1) | 1 단위 | 단서 수만큼, 최대 30 건(10 건씩 나눠 보냄) | — |
| 지도 링크 1개 분석 | — | 1 건 | — |
| 직접 찾기 검색 1번 | — | 1 건(입력 후 0.3초 멈췄을 때) | — |
| 후보 확인 화면(L2) 열기 | — | — | 지도 1회 로드 |
| 영상 상세 열기 | — | 저장한 장소 수만큼(장소당 1 건) | 지도 1회 로드 |

- YouTube 는 하루 링크 약 10,000 개까지 무료다. 썸네일은 영상 id 로 주소를 만들어 API 를 부르지 않는다.
- 병목은 카카오 로컬이다. 링크 1개에 최대 30 건 + 영상 상세를 열 때마다 장소 수만큼 쓴다. 일일 쿼터 수치를 확인한 뒤 한도(단서 30 건)와 영상 상세의 재조회 방식을 다시 정한다.
- 카카오 응답은 저장하지 않는다(정책, [K2]) — 그래서 영상 상세는 열 때마다 다시 받는다.

## 확인할 것

- 카카오 로컬 · 지도 SDK 일일 무료 쿼터 수치
- YouTube 할당량을 넘었을 때 응답(공식 문서에 없음 — 콘솔 할당량 페이지에서 사용량만 확인 가능)
- 카카오 응답 저장 제한의 약관 원문(포럼 FAQ 만 확인)

## 출처

- [Y1] YouTube Data API — Determine quota cost — https://developers.google.com/youtube/v3/determine_quota_cost
- [Y2] YouTube Data API — Quota and Compliance Audits — https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits
- [K1] 카카오 디벨로퍼스 쿼터 — https://developers.kakao.com/docs/latest/ko/getting-started/quota
- [K2] 카카오맵 API FAQ — https://devtalk.kakao.com/t/faq-api/125610
- [G1] Google Maps Platform 가격표 — https://developers.google.com/maps/billing-and-pricing/pricing
