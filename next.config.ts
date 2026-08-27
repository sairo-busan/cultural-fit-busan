import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tong.visitkorea.or.kr",
        pathname: "/cms/resource/**",
      },
    ],
  },
};

export default nextConfig;
