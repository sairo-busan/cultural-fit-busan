import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
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
