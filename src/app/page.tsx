"use client";

import { useRouter } from "next/navigation";
import { LocaleDropdown } from "@/components/common/LocaleDropdown";

export function LandingPage() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex justify-end px-[20px] py-[16px]">
        <LocaleDropdown />
      </div>

      {/* 상단 여백 */}
      <div className="flex-1" />

      {/* 콘텐츠 — 좌우 32px */}
      <div className="flex w-full flex-col items-center gap-[18px] px-8">
        {/* 타이틀 — 24px, Cormorant Garamond */}
        <h1
          className="font-serif text-[24px] font-normal text-foreground"
          style={{ lineHeight: 1.2, letterSpacing: "0.48px" }}
        >
          Cultural Fit Busan
        </h1>

        {/* 설명 — 12.5px, lineHeight 1.9 */}
        <div
          className="text-center text-[12.5px] font-light text-muted"
          style={{ lineHeight: 1.9 }}
        >
          <p>부산에 도착하셨나요?</p>
          <p>지금부터 안내를 시작합니다</p>
        </div>

        {/* CTA — 62px 높이 */}
        <div className="flex w-full flex-col gap-[10px] pt-[26px]">
          <button
            type="button"
            onClick={() => router.push("/onboarding")}
            className="h-[62px] w-full rounded-[8px] bg-foreground text-[14px] font-light text-white transition-colors"
            style={{ lineHeight: 2 }}
          >
            내 여행 스타일 찾기
          </button>
          <button
            type="button"
            onClick={() => router.push("/feed")}
            className="h-[62px] w-full rounded-[8px] border border-border text-[14px] font-light text-foreground transition-colors"
            style={{ lineHeight: 2 }}
          >
            둘러보기
          </button>
        </div>

        {/* 하단 안내 */}
        <p
          className="text-[10.5px] font-light text-muted"
          style={{ letterSpacing: "1.05px", lineHeight: 1.6 }}
        >
          6문항 1분 · 회원가입 없이 이용
        </p>
      </div>

      {/* 하단 여백 */}
      <div className="flex-1" />
    </div>
  );
}

export { LandingPage as default };
