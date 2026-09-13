import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

/**
 * Next 16 에서 `middleware.ts` 가 `proxy.ts` 로 바뀌었다 (기능은 동일).
 * next-intl 이 로케일을 판정해 `/feed` → `/en/feed` 로 보낸다.
 */
export default createMiddleware(routing);

export const config = {
  // api·정적 파일·파일 확장자가 붙은 경로는 건드리지 않는다
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
