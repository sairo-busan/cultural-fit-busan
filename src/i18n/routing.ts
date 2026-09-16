import { defineRouting } from "next-intl/routing";

/**
 * 기본 로케일은 ko. 브라우저가 영어면 en 으로 간다(next-intl 이 Accept-Language 로 판정).
 *
 * 경로에 로케일을 드러낸다(`/en/feed`). 쿠키 방식은 Capacitor 정적 빌드에서
 * 프록시가 돌지 않아 로케일 판정을 못 한다.
 */
export const routing = defineRouting({
  locales: ["en", "ko"],
  defaultLocale: "ko",
});

export type Locale = (typeof routing.locales)[number];
