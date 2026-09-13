import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
import localFont from "next/font/local";
import { Providers } from "@/providers/Providers";
import "./globals.css";

/**
 * 본문 — Pretendard. 한글과 라틴이 한 가족이라 섞여도 크기·굵기가 어긋나지 않는다.
 * 로컬 파일로 둔 것은 Capacitor 오프라인에서 CDN 이 깨지기 때문이다.
 * 굵기는 셋만 쓴다 — 400 본문 · 600 제목 · 700 강조.
 */
const pretendard = localFont({
  variable: "--font-sans",
  display: "swap",
  src: [
    { path: "./fonts/Pretendard-Regular.subset.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Pretendard-SemiBold.subset.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Pretendard-Bold.subset.woff2", weight: "700", style: "normal" },
  ],
});

/** 숫자·브랜드 마크 전용. 한글이 없어 본문에는 쓰지 않는다. */
const instrumentSerif = Instrument_Serif({
  variable: "--font-serif-display",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SAIRO — Cultural Fit Busan",
    template: "%s | SAIRO",
  },
  description:
    "부산을 여행하는 외국인을 위한 문화 적합도 기반 관광 추천 서비스",
  keywords: ["Busan", "travel", "cultural fit", "tourism", "Korea"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2A5A48",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${pretendard.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
