"use client";

import { useCallback, useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useStoredSnapshot } from "@/hooks/useStoredSnapshot";
import { buildCf8Profile } from "@/lib/cfp";
import { AppHeader } from "@/components/common/AppHeader";
import { AxisSlider } from "@/components/profile/AxisSlider";
import { CharacterReveal } from "@/components/profile/CharacterReveal";
import { DEFAULT_QUIZ_ANSWERS, DEFAULT_HARD_FILTER } from "@/data/quiz";
import { AXIS_CONFIG, AXIS_LABELS, PROFILE_COPY } from "@/data/profile";
import { CF8_PROFILES } from "@/data/cf8Profiles";
import {
  STORAGE_KEYS,
  clearDiagnosis,
  clearJustDiagnosed,
  readJustDiagnosed,
  setTripSetupMode,
} from "@/lib/storage";
import type { Cf8Axes } from "@/types/cfp";
import type { Locale } from "@/i18n/routing";

export function ProfilePage() {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const copy = PROFILE_COPY[locale];
  const axisLabels = AXIS_LABELS[locale];
  /**
   * 캐릭터 공개는 온보딩에서 막 넘어왔을 때만 돈다.
   *
   * 서버 스냅샷이 `false` 라 `/profile` 을 직접 열면(북마크·새로고침·유형 카드)
   * 결과가 바로 그려진다. 온보딩에서 오는 길은 클라이언트 네비게이션이라 첫
   * 렌더부터 실제 값을 읽으므로 결과가 스쳤다 가리는 깜빡임이 없다.
   */
  const justDiagnosed = useStoredSnapshot(readJustDiagnosed, false);
  const [revealDone, setRevealDone] = useState(false);
  const revealing = justDiagnosed && !revealDone;
  const [answers] = useLocalStorage(STORAGE_KEYS.answers, DEFAULT_QUIZ_ANSWERS);
  const [, setCf8Code] = useLocalStorage(STORAGE_KEYS.cf8Code, "");
  const [hardFilter] = useLocalStorage(
    STORAGE_KEYS.hardFilter,
    DEFAULT_HARD_FILTER,
  );

  const finishReveal = useCallback(() => {
    setRevealDone(true);
    // 연출이 끝난 뒤에 지운다 — 도중에 지우면 신호가 사라지며 연출이 끊긴다
    clearJustDiagnosed();
  }, []);

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

  // S02의 두 갈래가 trip_setup_mode를 결정한다 (04_추천로직 R024).
  // QUICK이면 엔진이 CF8 + 자동상황(날씨·계절·시간대)만 쓰고 S03 조건은 보지 않는다.
  const handleStart = () => {
    setTripSetupMode("QUICK");
    router.push("/feed");
  };

  const handleMoreConditions = () => {
    setTripSetupMode("CUSTOM");
    router.push("/trip-setup");
  };

  // S02 표시 문구는 전부 시트(2_03A_CF8프로필) 사본에서 온다
  const typeCopy = CF8_PROFILES[locale][profile.code];

  if (revealing) {
    return (
      <CharacterReveal
        code={profile.code}
        name={typeCopy.profileName}
        onDone={finishReveal}
      />
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
            {copy.retry}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* 유형 — 상단 첫 요소 32px */}
        <div className="flex flex-col gap-2 px-6 pt-8">
          <p className="animate-reveal animate-reveal-d1 ds-caption text-gray-600">
            {copy.sectionLabel}
          </p>
          <p className="animate-reveal animate-reveal-d2 ds-caption text-gray-600">
            {copy.typeLabel}
          </p>
          <h1 className="animate-reveal animate-reveal-d2 ds-headline text-ink">
            {typeCopy.profileName}
          </h1>
          <p className="animate-reveal animate-reveal-d3 ds-body-1 text-gray-600">
            {typeCopy.resultIntro}
          </p>
          <p className="animate-reveal animate-reveal-d3 ds-body-1 text-gray-600">
            {typeCopy.recommendationPromise}
          </p>
        </div>

        {/* 부산에서 이렇게 여행해요 — 섹션 간격 48px */}
        <div className="animate-reveal animate-reveal-d4 flex flex-col gap-4 px-6 pt-12 pb-8">
          <p className="ds-caption text-gray-600">
            {copy.styleHeading}
          </p>

          <div className="flex flex-col gap-3">
            {AXIS_CONFIG.map((axis) => {
              const axisData = profile.axes[axis.key as keyof Cf8Axes];
              const card = typeCopy[axis.card];

              return (
                <div
                  key={axis.key}
                  className="flex flex-col gap-2 rounded-xl bg-ds-surface px-6 py-5"
                >
                  <p className="ds-title-1 text-ink">{card.title}</p>
                  <p className="ds-body-2 text-gray-600">{card.body}</p>
                  <div className="pt-2">
                    <AxisSlider
                      left={axisLabels[axis.key].left}
                      right={axisLabels[axis.key].right}
                      value={axisData.value}
                    />
                  </div>
                  <p className="ds-caption text-center text-gray-600">
                    {card.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="animate-reveal animate-reveal-d6 flex shrink-0 flex-col gap-3 px-6 pt-4 pb-8">
        <p className="ds-caption text-center text-gray-600">
          {copy.actionHint}
        </p>
        <button
          type="button"
          onClick={handleStart}
          className="ds-title-2 flex h-13 w-full items-center justify-center rounded-xl bg-ink text-white transition-all active:scale-[0.98]"
        >
          {copy.primaryCta}
        </button>
        <button
          type="button"
          onClick={handleMoreConditions}
          className="ds-title-2 flex h-13 w-full items-center justify-center rounded-xl border border-gray-300 text-ink transition-all active:scale-[0.98]"
        >
          {copy.secondaryCta}
        </button>
      </div>
    </div>
  );
}

export { ProfilePage as default };
