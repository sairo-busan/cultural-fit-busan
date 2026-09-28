---
paths:
  - "src/app/api/**"
---

# API Route Handler

- 에러 응답은 `{ error: string, detail?: unknown }` 한 가지 형태로. 예외: `health` 는 `{ mongodb: "ok" | "error" }`.
- 상태코드: 필수 파라미터 누락·허용 목록 밖 값 400 · 대상 없음 404 · 환경변수 미설정·DB 실패 500 · 상류 API 실패(HTTP 실패, `resultCode` 불일치, 네트워크 오류) 502.
- `limit` 처럼 생략 가능한 값이 비정상이면 에러 대신 기본값·상한으로 흡수한다 (`recommend/route.ts`).
- 공공데이터포털 키는 Encoding 키라 URL 에 그대로 들어간다. 상류 URL 이나 `params.toString()` 을 `detail`·`console.error` 에 넣지 않는다.
- 앱(Capacitor) 빌드는 `src/app/api` 를 빼고 정적 export 한다 (`scripts/build-app.sh`). 앱은 Vercel 에 배포된 API 를 부르므로, 새 Route 는 웹 배포 후에야 앱에서 동작한다.
