import { defineRouting } from "next-intl/routing";

/**
 * 기본 로케일은 en — 타겟이 부산에 도착한 외국인 관광객이다 (요구사항 §1.4).
 *
 * 경로에 로케일을 드러낸다(`/en/feed`). 쿠키 방식은 Capacitor 정적 빌드에서
 * 프록시가 돌지 않아 로케일 판정을 못 한다.
 */
export const routing = defineRouting({
  locales: ["en", "ko"],
  defaultLocale: "en",
});

export type Locale = (typeof routing.locales)[number];
