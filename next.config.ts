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
  ...(isApp && { output: "export" }),
  images: {
    // 앱에는 이미지 최적화 서버가 없다. TourAPI 원본을 그대로 받는다
    unoptimized: isApp,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tong.visitkorea.or.kr",
        pathname: "/cms/resource/**",
      },
      {
        // customImage(9/16, upload-place-photos.ts) — 스토어별 서브도메인이라
        // 와일드카드로 잡는다. 스토어를 다시 만들면 서브도메인이 또 바뀌는데
        // 이 패턴은 그래도 깨지지 않는다.
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/places/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
