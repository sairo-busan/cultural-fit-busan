/**
 * API 호출 기준 주소.
 *
 * 웹은 화면과 API 가 같은 출처라 빈 문자열이면 된다. 앱(Capacitor)은 **화면만**
 * 기기 안에 들어가고 API 는 Vercel 에 남으므로 절대 주소가 필요하다 — 앱의
 * 출처에는 `/api` 가 존재하지 않는다.
 *
 * API 를 앱에 같이 넣을 수는 없다. 셋 다 `MONGODB_URI` · `KMA_API_KEY` ·
 * `TOUR_API_KEY` 를 숨기려고 만든 프록시라, 클라이언트로 옮기면 APK 디컴파일로
 * 공공데이터포털 키가 그대로 노출된다.
 *
 * 값은 빌드 시점에 박힌다(`NEXT_PUBLIC_`). 앱 빌드에서만 채우면 된다.
 */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "").replace(/\/$/, "");

/** `apiUrl("/api/recommend?limit=100")` — 웹에서는 그대로, 앱에서는 절대 주소가 된다 */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
