import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Cormorant_Garamond } from "next/font/google";
import { Providers } from "@/providers/Providers";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["200", "300", "400"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
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
      className={`${notoSansKr.variable} ${cormorantGaramond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans font-light">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
