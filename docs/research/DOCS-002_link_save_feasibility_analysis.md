# 링크 저장 가능성 조사와 소피 실행 계획

확인일: 2026-10-29 · 근거: 사용자 제공 10/20 회의록, 현재 체크아웃, 아래 공식 문서.
이 문서는 1차 조사와 범위 제안이다. 팀 합의·API 이용 승인·실기기 검증을 대신하지 않는다.

## 1. 먼저 검증할 범위

**링크·주소 붙여넣기 → 장소를 직접 확인 → 기기에 저장**을 첫 실험으로 제안한다.
다른 앱의 공유 메뉴 수신은 두 번째 실험으로 분리한다.

링크만 보관하는 성공과 실제 장소가 연결되는 성공을 별도로 측정한다. SNS 게시물 하나가
여러 장소를 다루거나 장소를 전혀 언급하지 않을 수 있으므로 자동 확정을 약속하지 않는다.
장소 미확정 상태에서도 링크는 남기고, 지도·추천에는 확인된 장소만 사용한다.

초기 제외 제안: 임의 영상 자막 수집, SNS 본문 스크래핑, 게시물 기반 취향 추론,
여행 코스 생성, 로그인·서버 동기화·커뮤니티·GA4 도입. 이는 회의의 확정 결정이 아니다.

## 2. 현재 코드에서 확인한 것

| 근거 | 현재 동작 | 계획에 미치는 영향 |
|---|---|---|
| `src/lib/storage.ts:91` | 저장 항목은 `{ id, savedAt }` | 외부 URL·미확정 장소를 표현하지 못함 |
| `src/app/[locale]/saved/SavedContent.tsx:77` | 추천 API를 카탈로그로 조회 | 외부 저장 항목의 정보 공급원을 따로 설계해야 함 |
| 같은 파일 `:94–96` | 카탈로그에 없는 ID는 화면에서 제외 | 임의 외부 ID를 기존 저장 배열에 넣는 방식으로 해결 불가 |
| `src/app/api/tour/route.ts:15` | `searchKeyword2` 프록시 허용 | 기존 장소 검색의 재사용 후보. 검색 적중률·API 실호출은 미검증 |
| `android/app/src/main/AndroidManifest.xml:20` | 실행용 MAIN/LAUNCHER 필터만 있음 | `ACTION_SEND` 수신 등록 필요 |
| `android/app/src/main/java/com/sairo/app/MainActivity.java:8` | BridgeActivity, 뒤로 가기 처리 | 공유 텍스트 수신·웹 전달·재실행 처리는 별도 구현 필요 |

현재 의존성은 Capacitor 8·Next.js 16·React 19이며 저장은 localStorage 기반이다.

## 3. 플랫폼별 1차 판정

아래의 ‘링크 보관’은 사용자가 전달한 URL을 기기에 남기는 설계안이다. 플랫폼에서 본문·사진·
리뷰를 가져와 재사용할 수 있다는 뜻이 아니다. 조회 API의 존재와 영구 저장·AI 분석 허용은 별개다.

| 입력 | 공식 문서로 확인한 기술 범위 | 남은 정책·기술 확인 | 구현 난이도 | 초기 제안 |
|---|---|---|---|---|
| 주소·장소명 | 카카오 Local은 키워드 검색 및 주소 좌표 변환 제공 [S5] | 결과 저장·재사용 조건, 실제 지점 매칭. 현재 위치 없이 검색 | 낮음 | 우선 지원 후보. 기존 TourAPI/카탈로그 검색부터 검증 |
| 카카오 지도 링크 | Local 검색 응답에 장소 ID·이름·주소·좌표·상세 URL 제공 [S5] | 공유 URL→조회 데이터 역변환은 별도 문제. 단축 링크·앱 전용 URL 표본 필요 | 중간 | 원문 링크 보관 + 장소명 보완, 자동 해석은 표본 검증 후 |
| 네이버 지도 링크 | 지역 검색은 검색어 기반 업체·기관 조회 API [S6] | 지도 링크를 입력하는 API로 확인된 것은 아님. 검색 결과 저장·가공 조건도 미확정 | 중간 | 원문 링크 보관 우선, API 데이터 영구 복제 보류 |
| Google Maps 링크 | Maps URLs는 검색어·Place ID 등을 이용해 지도를 여는 규격 [S7]. 장소 조회는 Places API Text Search, `place_id`는 보관 허용 [S13] | 좌표 보관 기간은 현행 Places API 원문 미확인. API 키·과금 필요. 짧은 URL·주소 없는 URL은 별도 검증 | 중간 | 명시적 검색어가 있으면 후보로 취급, 사용자가 장소 확인 |
| YouTube | `videos.list(part=snippet,id=…)`로 제목·설명 등 조회 가능 [S1] | API 설정·쿼터·출처 표시·데이터 갱신, 장소 추출·취향 분석 용도 검토 | 낮음~중간 | URL 보관 우선. 메타정보 조회는 별도 제한 실험 후보 |
| YouTube oEmbed | 키 없이 제목·작성자·썸네일 응답, 설명은 없음 (실측, 부록) | 제목만으로 장소 식별되는 비율은 표본 확인 필요 | 낮음 | 첫 실험의 제목 보조 입력 후보 |
| TikTok oEmbed | 키 없이 호출되나 응답에 제목·작성자 없음, embed html만 (실측, 부록) [S11] | 장소 단서로 쓸 필드 없음 | 낮음 | 자동 해석 대상에서 제외, URL 보관만 |
| YouTube 자막 | 공식 다운로드에는 해당 영상 편집 권한과 OAuth 필요 [S2] | 일반 여행자가 저장한 타인 영상은 이 조건을 보통 충족하지 못함 | 높음 | 임의 영상 자막을 초기 기능의 전제로 삼지 않음 |
| Instagram | Meta oEmbed Read는 앱 심사 필요. 2025-11-03부터 응답에서 `author_name`·`thumbnail_url` 제거 [S8][S9] | 응답에 장소 식별 단서가 사실상 없음. 표시 외 저장·가공·분석 허용 범위 미확정 | 높음 | URL 보관 + 수동 장소 연결. API 수집 가능 판정 보류 |
| Facebook | Instagram과 같은 Meta oEmbed Read 조건. 페이지 게시물 oEmbed 엔드포인트는 폐지 [S8][S9] | 공개 게시물만 대상. 저장·분석 조건 미확정 | 높음 | URL 보관 + 수동 장소 연결. API 수집 가능 판정 보류 |
| TikTok | Display API는 사용자 영상·프로필 표시와 권한 범위를 설명. Embed Videos는 폐지 예정 안내 [S10][S11] | 임의 타인 영상 조회와 동일시할 수 없음. 접근 권한·추출/저장/분석 용도 확인 필요 | 중간 | URL 보관 + 수동 장소 연결. 구 Embed Videos 신규 의존 보류 |

YouTube 정책은 일부 API 데이터의 저장에 30일 후 삭제 또는 갱신 조건을 둔다 [S3].
소피의 1차 판단: 메타정보를 영구 저장하는 구조부터 만들지 말고, 에린과 데이터 종류별
보관·갱신 계약을 먼저 정한다. 제목 조회가 가능하다는 사실만으로 AI 취향 분석 허용을 확정하지 않는다.
## 4. ‘공유해서 사이로에 저장’의 구현 경로

| 경로 | 필요한 작업 | 검증 조건 |
|---|---|---|
| 일반 웹 | 사용자가 붙여넣기 버튼/입력으로 URL·텍스트 전달 | 설치 없이 입력·재방문·저장 유지 가능 |
| 설치된 PWA | 설치 조건 충족 및 manifest `share_target` 등록 [S4] | 지원 브라우저·설치 여부별 수신 확인. 일반 웹 탭과 구분 |
| 현재 Android 앱 | `ACTION_SEND`, `text/plain`, `EXTRA_TEXT` 수신 및 Capacitor 브리지 [S12] | 앱 종료/실행 중 두 경우, 준비 전 수신 보관, 중복 전달 방지 |

`MainActivity`는 `launchMode="singleTask"`라 실행 중 수신은 `onNewIntent`로 들어온다.
Capacitor 공유 수신 플러그인(send-intent 계열)과 직접 구현 중 하나를 고르기 전에 Capacitor 8 지원 여부를 확인한다.

`navigator.share()`는 보내기 기능이다. 이를 추가해도 사이로가 다른 앱의 공유 대상으로
등록되지는 않는다 [S4]. 현재 앱이 Capacitor이므로 Android 수신을 먼저 검증하고,
PWA 도입은 별도 선택지로 둔다.

## 5. 데이터·화면 계약 초안 — 구현 전에 확인할 항목

- 기존 `cfb_saved`에는 실제 연결된 내부 장소 ID만 저장한다.
- 외부 링크는 별도 기기 저장소에 보관하는 방식을 제안한다. 원문 URL, 제공자,
  저장 시각, 사용자가 입력한 장소명, 연결된 내부 장소 ID(선택)를 최소 후보로 둔다.
- 입력에 여러 URL이 있으면 사용자가 하나를 고른다. 여러 장소가 나와도 후보를 자동 확정하지 않는다.
- ‘장소 미확정’과 ‘저장 실패’를 구분한다. 전자는 링크가 남고 후자는 재시도 또는 복사가 가능해야 한다.
- 태깅이 없는 장소는 CF8 점수를 새로 만들지 않는다. 지도 연결·보관과 추천 엔진 참여를 분리한다.
- 원문 링크의 추적 파라미터는 제공자별로 확인한 것만 제거한다. 장소 식별 파라미터는 유지한다.
- 서버가 임의 URL을 가져오는 범용 메타데이터 프록시는 만들지 않는다. 단축 링크 해석이 필요해지면
  허용 호스트와 리다이렉트 각 단계·주소 검증·타임아웃을 갖춘 전용 처리를 별도 설계한다.
- 지도 앱의 공유 기본값은 단축 링크(`naver.me`·`kko.to`·`maps.app.goo.gl`)다. 자동 해석은 위 전용 처리가
  있어야 가능하고, 없으면 지도 링크도 수동 장소 연결로 처리한다.
- 앱 빌드는 정적 export라 Route Handler가 없다. 해석은 Vercel API 경유(`src/lib/apiBase.ts`) 또는
  CapacitorHttp(현재 `capacitor.config.ts` 미설정) 중 하나로 정한다.
- `kko.to`는 범용 단축 주소라 목적지가 지도가 아닐 수 있다. 허용 호스트는 최종 목적지 기준으로 판정한다.
- 실제 사용자 현재 좌표는 서버에 보내지 않는다. 붙여넣은 지도 URL에 현재 위치나 경로 정보가
  포함될 수 있어 원문 URL의 서버 전달도 기본값으로 삼지 않는다.
- 링크 원문·공유 텍스트를 분석 이벤트나 로그에 남기지 않는다. 외부 API 연동 시 전송 데이터와
  기존 개인정보처리방침의 정합성을 별도로 검토한다.

## 6. 소피 실행 순서와 분담 제안

아래 작업량은 소피의 실제 작업 시간에 대한 초안이며 팀 일정 약속이 아니다.
에린 항목은 전달할 확인 목록이다.

| 순서 | 소피가 할 일 | 작업량 초안 | 완료 기준 | 에린에게 확인할 것 |
|---|---|---|---|---|
| A · 1차 조사 | 현재 코드·공식 문서·지원 후보 정리 | Meta·TikTok·네이버 저장·분석 정책 미확정 | 사실/제안/미검증 구분, 출처와 코드 위치 명시 | 조사 결론 공동 검토 |
| B · 입력 검증 | 실제 공개 링크 표본 확보, URL/함께 온 텍스트/장소 식별 단서 기록 | 1–2시간 | 아래 20건 표본표 작성, 모든 상태에 후속 경로 존재 | 내부 카탈로그·TourAPI에서 실제 장소를 찾을 수 있는가 |
| C · 웹 최소 구현 | 붙여넣기·수동 장소 연결·기기 보관과 목록 복원 | 0.5–1일 | 기존 저장 회귀 없음, 외부 링크가 연결 전에도 사라지지 않음 | 검색 응답·내부 ID 계약, 외부 장소 관리 방법 |
| D · Android 실험 | 공유 수신과 화면 전달만 독립 검증. RN 전환 결정 후 착수 | 0.5–1일 | 앱 종료/실행 중 각각 동일한 텍스트 수신, 1회 저장 | 서버 작업 없이 진행 가능 |
| E · API 제한 실험 | 허용 범위 확인된 공급자부터 메타정보·검색 연동 | 키·정책 확인 후 재산정 | 실제 응답·실패 케이스·보관 정책 기록 | 키/권한, 필드별 저장·갱신·출처 표시, 요청 제한 |
| F · 결과 판단 | 입력 마찰·연결 성공·재방문 사용성 검토 | 1–2시간 | 유지/축소할 초기 범위를 근거와 함께 제안 | 공동 검토 |

B는 인증 없이 공개 표본으로 먼저 진행할 수 있다. C는 수동 장소 연결을 포함해 API 자동 추출에
의존하지 않게 한다. D는 C의 입력·보관 계약을 재사용한다. E가 늦어져도 C·D의 검증은 가능하다.
각 구현은 별도 소규모 티켓·브랜치로 나눈다. 새 UI 구현 시 DS v1과 화면 목적·흐름 정본을 확인한다.

## 7. 다음 실험 표본과 판정

아래 수량은 실험 설계안이며 성공률 결과가 아니다. YouTube 표본 실측은 아래 「7-1」에 있다.

| 표본 | 수량 | 확인 내용 |
|---|---|---|
| Instagram / Facebook / TikTok 공개 링크 | 각 2건, 6건 | 링크만 전달/텍스트 동반 여부, 장소명 수동 보완으로 연결 가능한가 |
| YouTube 일반 영상·Shorts | 2건 | URL 형태 구분, 장소 단서 없음/복수 장소 시 수동 확인 |
| 카카오 / 네이버 / Google Maps | 각 2건, 6건 | 일반·단축 링크, 장소 ID/검색어 존재 여부, 실제 지점 대조 |
| 한글 주소 / 영문 장소명 | 각 1건, 2건 | 동일 장소·지점 판별 및 부산 범위 |
| 예외 | 4건 | 삭제/비공개 링크, 여러 URL, URL 없는 무관한 텍스트, 같은 URL 재입력 |
| 합계 | 20건 | 표본 URL·기기·일시·실제 결과·수동 보완 여부 기록 |

각 건은 ‘입력 수신 / 링크 보관 / 장소 후보 / 사용자 확정 / 재방문 복원’으로 나눠 기록한다.
자동 연결률과 수동 보완 후 연결률의 분모를 명시한다. 20건 결과를 전체 플랫폼 성공률로 일반화하지 않는다.

첫 실험 통과 조건 제안:

1. 저장 완료로 표시한 항목은 재방문 시 모두 복원된다. 저장소 오류는 성공으로 표시하지 않는다.
2. 장소가 없거나 여러 곳일 때 잘못된 한 곳을 자동 확정하지 않는다.
3. 기존 저장 데이터는 유지되고 외부 링크는 추천 카탈로그 누락 때문에 사라지지 않는다.
4. Android 종료/실행 중 수신이 가능하고 재수신으로 중복 저장되지 않는다.
5. 링크 보관과 장소 연결 결과를 따로 보고한다. 자동 연결이 낮으면 수동 보완 방식의 사용성을 판단한다.

사용자 테스트 대상·행동 지표·제품 통과 수치는 유나와 별도 합의할 항목이다.
시장·찜질방 꿀팁 테스트나 배포·추적 담당을 소피 업무로 임의 편입하지 않는다.

### 7-1. YouTube 표본 실측 (FE-FEAT-019, 2026-10-29)

설명란 · 제목의 단서 → 카카오 로컬 키워드 검색(부산 범위). 판정은 단서와 가게 이름 · 동네 대조이며 영상 재생 대조가 아니다.

| 항목 | 값 |
|---|---|
| 후보가 나온 영상 | 16 / 19 |
| 후보 · ✓ · △(지점 불확실) · ✗ | 157 · 138 · 13 · 6 |
| 후보 0 | 3건 — 장소가 영상 안에만 있음 |
| 지도 링크 | 구글 `/maps/place/` 는 찾음. 카카오 · 네이버 장소 페이지는 자동 요청이 막혀 직접 찾기로 |

TourAPI 로 장소를 확정하면 식당 · 매장이 빠진다(`izp9Vn3ZNGM` 5곳 중 2곳). 장소 확정은 카카오로 정했다 —
[결정 기록](../decisions/2026-10-29_링크저장_지도API_선택.md). 영상별 표: [FE-FEAT-019 실측](./FE-FEAT-019_link_save_lab_verification.md)

## 8. 에린과 확인할 질문

1. 기존 내부 장소만 연결할 것인가, 카탈로그 밖 장소도 별도로 보관할 것인가?
2. `searchKeyword2`의 검색 결과와 추천 가능한 태깅 장소를 어떻게 구분할 것인가?
3. YouTube 메타정보를 조회할 실제 용도·키·갱신/삭제·출처 표시 조건은 무엇인가?
4. Meta 공식 문서가 열리는 환경에서 현재 권한과 저장·분석 조건을 재확인할 수 있는가?
5. 카카오·네이버 검색 데이터를 저장할 필드와 해당 이용 조건은 무엇인가?

## 공식 출처

모두 2026-10-29 확인. 문서 접근과 실제 API 호출은 구분한다.

- [S1 · YouTube videos.list](https://developers.google.com/youtube/v3/docs/videos/list)
- [S2 · YouTube captions.download](https://developers.google.com/youtube/v3/docs/captions/download)
- [S3 · YouTube Developer Policies](https://developers.google.com/youtube/terms/developer-policies), 특히 III.E.4
- [S4 · Chrome Web Share Target](https://developer.chrome.com/docs/capabilities/web-apis/web-share-target)
- [S5 · 카카오 Local 개발 가이드](https://developers.kakao.com/docs/ko/local/dev-guide)
- [S6 · 네이버 지역 검색](https://developers.naver.com/docs/serviceapi/search/local/local.md)
- [S7 · Google Maps URLs](https://developers.google.com/maps/documentation/urls/guide)
- [S8 · Meta oEmbed Read](https://developers.facebook.com/docs/features-reference/oembed-read)
- [S9 · Graph API 2025 Non-versioned Changes](https://developers.facebook.com/docs/graph-api/changelog/non-versioned-changes/nvc-2025)
- [S10 · TikTok Display API](https://developers.tiktok.com/docs/en/display-api-overview)
- [S11 · TikTok Embed Videos](https://developers.tiktok.com/docs/en/embed-videos) — 폐지 예정 안내 확인
- [S12 · Android 공유 수신](https://developer.android.com/training/sharing/receive)
- [S13 · Google Maps Platform Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms)
## 부록 · 실측 명령

```sh
curl -s "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&format=json"
curl -s "https://www.tiktok.com/oembed?url=https://www.tiktok.com/@scout2015/video/6718335390845095173"
```
