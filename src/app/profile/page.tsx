"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { buildCf8Profile } from "@/lib/cfp";
import { useToast } from "@/contexts/ToastContext";
import { AppHeader } from "@/components/common/AppHeader";
import { AxisSlider } from "@/components/profile/AxisSlider";
import { DEFAULT_QUIZ_ANSWERS, DEFAULT_HARD_FILTER } from "@/data/quiz";
import {
  AXIS_CONFIG,
  AXIS_STYLE,
  AXIS_GUIDE,
  PROFILE_COPY,
} from "@/data/profile";
import { STORAGE_KEYS, clearDiagnosis } from "@/lib/storage";
import type { Cf8Axes } from "@/types/cfp";

const LOADING_STEPS = [
  "분위기 취향을 분석하고 있어요",
  "장소 성향을 파악하고 있어요",
  "여행 방식을 확인하고 있어요",
  "프로필을 생성하고 있어요",
];

const STEP_DURATION = 450;

export function ProfilePage() {
  const router = useRouter();
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [answers] = useLocalStorage(STORAGE_KEYS.answers, DEFAULT_QUIZ_ANSWERS);
  const [, setCf8Code] = useLocalStorage(STORAGE_KEYS.cf8Code, "");
  const [hardFilter] = useLocalStorage(
    STORAGE_KEYS.hardFilter,
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

    const finishTimer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(finishTimer);
  }, [loading, loadingStep]);

  const profile = buildCf8Profile(answers, hardFilter);

  // 진단 결과 코드를 저장한다 (재방문 시 진단 건너뛰기 분기에 사용)
  useEffect(() => {
    setCf8Code(profile.code);
  }, [profile.code, setCf8Code]);

  const handleRetry = () => {
    clearDiagnosis();
    // 전체 새로고침으로 React 상태까지 확실히 초기화
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/onboarding";
  };

  const handleStart = () => {
    router.push("/feed");
  };

  const handleMoreConditions = () => {
    // S03 조건 입력 — FE-FEAT-004에서 구현
    show("조건 입력은 곧 제공됩니다. 먼저 추천을 확인해보세요.");
  };

  const axisCodes = [
    profile.axes.atmosphere.code,
    profile.axes.placeType.code,
    profile.axes.experience.code,
  ];

  if (loading) {
    const progress = (loadingStep / LOADING_STEPS.length) * 100;
    const currentMessage =
      LOADING_STEPS[Math.min(loadingStep, LOADING_STEPS.length - 1)];

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-[32px]">
        <p className="ds-title-1 font-serif text-ink">Cultural Fit Busan</p>

        <div className="mt-[48px] w-full max-w-[260px]">
          <div className="h-[3px] w-full rounded-full bg-gray-300">
            <div
              className="h-full rounded-full bg-ink transition-all duration-400 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <p className="ds-caption mt-[20px] h-[20px] text-gray-600 transition-opacity duration-300">
          {currentMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        onBack={() => router.push("/onboarding")}
        right={
          <button
            type="button"
            onClick={handleRetry}
            className="ds-caption text-gray-600"
          >
            {PROFILE_COPY.retry}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* 유형 — 상단 첫 요소 32px */}
        <div className="flex flex-col gap-[8px] px-[24px] pt-[32px]">
          <p className="animate-reveal animate-reveal-d1 ds-caption text-gray-500">
            {PROFILE_COPY.sectionLabel}
          </p>
          <p className="animate-reveal animate-reveal-d2 ds-caption text-gray-600">
            {PROFILE_COPY.typeLabel}
          </p>
          <h1 className="animate-reveal animate-reveal-d2 ds-headline text-ink">
            {profile.nameKo}
          </h1>
          <p className="animate-reveal animate-reveal-d3 ds-body-1 text-gray-600">
            {profile.description}
          </p>
        </div>

        {/* 이런 스타일이에요 — 섹션 간격 48px */}
        <div className="animate-reveal animate-reveal-d4 flex flex-col gap-[16px] px-[24px] pt-[48px]">
          <p className="ds-caption text-gray-500">
            {PROFILE_COPY.styleHeading}
          </p>

          <div className="flex flex-col gap-[12px]">
            {AXIS_CONFIG.map((axis, index) => {
              const axisData = profile.axes[axis.key as keyof Cf8Axes];
              const copy = AXIS_STYLE[axisCodes[index]];
              if (!copy) return null;

              return (
                <div
                  key={axis.key}
                  className="flex flex-col gap-[8px] rounded-[12px] bg-ds-surface px-[24px] py-[20px]"
                >
                  <p className="ds-title-1 text-ink">{copy.title}</p>
                  <p className="ds-body-2 text-gray-600">{copy.description}</p>
                  <div className="pt-[8px]">
                    <AxisSlider
                      left={axis.left}
                      right={axis.right}
                      value={axisData.value}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 이렇게 안내하겠습니다 */}
        <div className="animate-reveal animate-reveal-d5 flex flex-col px-[24px] pt-[48px] pb-[32px]">
          <p className="ds-caption pb-[16px] text-gray-500">
            {PROFILE_COPY.guideHeading}
          </p>
          {axisCodes.map((code) => {
            const guide = AXIS_GUIDE[code];
            if (!guide) return null;
            return (
              <div
                key={code}
                className="flex flex-col gap-[4px] border-t border-gray-300 py-[16px]"
              >
                <span className="ds-title-2 text-ink">{guide.title}</span>
                <p className="ds-body-2 text-gray-600">{guide.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="animate-reveal animate-reveal-d6 flex shrink-0 flex-col gap-[12px] px-[24px] pt-[16px] pb-[32px]">
        <p className="ds-caption text-center text-gray-500">
          {PROFILE_COPY.actionHint}
        </p>
        <button
          type="button"
          onClick={handleStart}
          className="ds-title-2 flex h-[52px] w-full items-center justify-center rounded-[12px] bg-ink text-white transition-all active:scale-[0.98]"
        >
          {PROFILE_COPY.primaryCta}
        </button>
        <button
          type="button"
          onClick={handleMoreConditions}
          className="ds-title-2 flex h-[52px] w-full items-center justify-center rounded-[12px] border border-gray-300 text-ink transition-all active:scale-[0.98]"
        >
          {PROFILE_COPY.secondaryCta}
        </button>
      </div>
    </div>
  );
}

export { ProfilePage as default };
