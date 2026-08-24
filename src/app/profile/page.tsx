"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { buildCfpProfile } from "@/lib/cfp";
import { AppHeader } from "@/components/common/AppHeader";
import { AxisSlider } from "@/components/profile/AxisSlider";
import { DEFAULT_QUIZ_ANSWERS, DEFAULT_HARD_FILTER } from "@/data/quiz";
import {
  COMPANION_LABEL,
  WALKING_LABEL,
  AXIS_CONFIG,
  AXIS_GUIDE,
} from "@/data/profile";
import type { CfpAxes } from "@/types/cfp";

const LOADING_STEPS = [
  "분위기 취향을 분석하고 있어요",
  "장소 성향을 파악하고 있어요",
  "음식 취향을 확인하고 있어요",
  "동선을 계산하고 있어요",
  "프로필을 생성하고 있어요",
];

const STEP_DURATION = 450;

export function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [answers] = useLocalStorage(
    "cfb-quiz-answers",
    DEFAULT_QUIZ_ANSWERS,
  );
  const [hardFilter] = useLocalStorage(
    "cfb-hard-filter",
    DEFAULT_HARD_FILTER,
  );

  useEffect(() => {
    if (!loading) return;

    if (loadingStep < LOADING_STEPS.length) {
      const timer = setTimeout(() => {
        setLoadingStep((prev) => prev + 1);
      }, STEP_DURATION);
      return () => clearTimeout(timer);
    }

    // 마지막 step 표시 후 결과 화면 전환
    const finishTimer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(finishTimer);
  }, [loading, loadingStep]);

  const profile = buildCfpProfile(answers, hardFilter);

  const handleRetry = () => {
    localStorage.removeItem("cfb-quiz-answers");
    localStorage.removeItem("cfb-hard-filter");
    localStorage.removeItem("cfb-quiz-step");
    // 전체 새로고침으로 React 상태까지 확실히 초기화
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/onboarding";
  };

  const handleStart = () => {
    router.push("/feed");
  };

  const companionText = COMPANION_LABEL[profile.companion] ?? "혼자";
  const walkingText = WALKING_LABEL[profile.walkingDistance] ?? "도보 15분";

  const guideCodes = [
    profile.axes.atmosphere.code,
    profile.axes.placeType.code,
    profile.axes.palate.code,
    profile.axes.pace.code,
  ];

  if (loading) {
    const progress = (loadingStep / LOADING_STEPS.length) * 100;
    const currentMessage = LOADING_STEPS[Math.min(loadingStep, LOADING_STEPS.length - 1)];

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-[32px]">
        <p
          className="font-serif text-[18px] font-normal text-foreground"
          style={{ letterSpacing: "-0.36px" }}
        >
          Cultural Fit Busan
        </p>

        <div className="mt-[48px] w-full max-w-[260px]">
          <div className="h-[3px] w-full rounded-full bg-[#e8e9ea]">
            <div
              className="h-full rounded-full bg-[#368fff] transition-all duration-400 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <p
          className="mt-[20px] h-[20px] text-[12.5px] font-light text-muted transition-opacity duration-300"
          style={{ lineHeight: 1.6 }}
        >
          {currentMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        logo
        right={
          <button type="button" aria-label="메뉴">
            <Menu size={20} strokeWidth={1.5} />
          </button>
        }
      />

      {/* 스크롤 가능 콘텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {/* 프로필 결과 */}
        <div className="flex flex-col gap-[14px] px-[24px] pt-[46px]">
          <p
            className="animate-reveal animate-reveal-d1 typo-label text-muted"
            style={{ letterSpacing: "2.47px" }}
          >
            MY TRAVEL PROFILE
          </p>
          <h1
            className="animate-reveal animate-reveal-d2 text-[30px] font-thin text-foreground"
            style={{ lineHeight: 1.4, letterSpacing: "-1.35px" }}
          >
            {profile.nameKo}
          </h1>
          <p
            className="animate-reveal animate-reveal-d3 text-[13px] font-light text-muted"
            style={{ lineHeight: 1.9 }}
          >
            {profile.description}
          </p>
          <div className="animate-reveal animate-reveal-d3 flex gap-[8px]">
            <span className="rounded-full bg-[#f0f1f3] px-[10px] py-[4px] text-[11px] font-light text-muted">
              {companionText}
            </span>
            <span className="rounded-full bg-[#f0f1f3] px-[10px] py-[4px] text-[11px] font-light text-muted">
              {walkingText}
            </span>
          </div>
        </div>

        {/* 4축 슬라이더 */}
        <div className="animate-reveal animate-reveal-d4 mx-[24px] mt-[32px] flex flex-col gap-[24px] rounded-[16px] bg-[#f5f6f7] px-[20px] py-[24px]">
          {AXIS_CONFIG.map((axis) => {
            const axisData = profile.axes[axis.key as keyof CfpAxes];
            return (
              <AxisSlider
                key={axis.key}
                label={axis.label}
                left={axis.left}
                right={axis.right}
                value={axisData.value}
              />
            );
          })}
        </div>

        {/* 이렇게 안내하겠습니다 */}
        <div className="animate-reveal animate-reveal-d5 flex flex-col px-[24px] pt-[40px]">
          <p
            className="text-[12px] font-light text-muted pb-[16px]"
            style={{ letterSpacing: "2.16px" }}
          >
            이렇게 안내하겠습니다
          </p>
          {guideCodes.map((code) => {
            const guide = AXIS_GUIDE[code];
            if (!guide) return null;
            return (
              <div
                key={code}
                className="flex gap-[20px] border-t border-border py-[20px]"
              >
                <span
                  className="w-[72px] shrink-0 text-[15px] font-normal text-foreground"
                  style={{ letterSpacing: "-0.3px" }}
                >
                  {guide.title}
                </span>
                <p
                  className="flex-1 text-[12.5px] font-light text-muted"
                  style={{ lineHeight: 1.75 }}
                >
                  {guide.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* 안내 문구 */}
        <div className="animate-reveal animate-reveal-d5 flex items-start gap-[9px] px-[24px] pt-[32px] pb-[24px]">
          <span className="mt-[6px] size-[6px] shrink-0 rounded-full bg-[#368fff]" />
          <p
            className="flex-1 text-[11.5px] font-light text-[#163c8c]"
            style={{ lineHeight: 1.75 }}
          >
            지금 계신 해운대에서 두 시간 동선을 추천드립니다
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="animate-reveal animate-reveal-d6 flex flex-col gap-[10px] px-[20px] pt-[12px] pb-[16px] shadow-[0_-1px_8px_rgba(0,0,0,0.04)]">
        <button
          type="button"
          onClick={handleStart}
          className="flex h-[54px] w-full items-center justify-center rounded-[12px] bg-foreground text-[13px] font-light text-white transition-all active:scale-[0.98]"
          style={{ letterSpacing: "1.3px" }}
        >
          안내 시작하기
        </button>
        <button
          type="button"
          onClick={handleRetry}
          className="flex h-[54px] w-full items-center justify-center rounded-[12px] border border-border text-[13px] font-light text-foreground transition-all active:scale-[0.98]"
          style={{ letterSpacing: "1.3px" }}
        >
          다시 하기
        </button>
      </div>
    </div>
  );
}

export { ProfilePage as default };
