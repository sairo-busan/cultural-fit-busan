import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * 빌드가 둘로 갈린다.
 *
 *   웹 (Vercel)        화면 + API 가 한 몸. 지금까지와 같다
 *   앱 (Capacitor)     화면만 정적 파일로 뽑는다. API 는 Vercel 에 남는다
 *
 * 정적 export 는 미들웨어 · 요청 파라미터를 읽는 Route Handler · 이미지 최적화를
 * 지원하지 않는다. 그래서 `BUILD_TARGET=app` 일 때만 켠다 — 웹 빌드에 이 설정이
 * 걸리면 `/api/*` 가 통째로 깨진다.
 */
const isApp = process.env.BUILD_TARGET === "app";

const nextConfig: NextConfig = {
  ...(isApp && {
    output: "export",
    /**
     * 앱은 파일을 경로로 연다. 이게 없으면 `out/en.html` 로 나와서
     * `/en/feed` 같은 내부 링크가 파일을 못 찾는다. 켜면 `out/en/index.html`
     * 이 되어 디렉터리 경로가 그대로 열린다.
     */
    trailingSlash: true,
  }),
  ...(!isApp && {
    /**
     * 앱은 출처가 달라(`https://localhost`) 이 헤더가 있어야 API 응답을 읽는다.
     * 인증 · 쿠키가 없는 공개 조회 API 라 출처를 좁히지 않는다.
     * 새 라우트도 자동으로 적용된다. 정적 export 는 headers 를 지원하지 않아 웹 빌드에만 건다.
     */
    async headers() {
      return [
        {
          source: "/api/:path*",
          headers: [
            { key: "Access-Control-Allow-Origin", value: "*" },
            { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          ],
        },
      ];
    },
  }),
  images: {
    // 앱에는 이미지 최적화 서버가 없다. TourAPI 원본을 그대로 받는다
    unoptimized: isApp,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tong.visitkorea.or.kr",
        pathname: "/cms/resource/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
