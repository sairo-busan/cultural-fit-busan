"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/common/AppHeader";
import { BottomTabBar } from "@/components/common/BottomTabBar";
import { LiveStatusBar } from "@/components/feed/LiveStatusBar";
import { PlaceCard } from "@/components/feed/PlaceCard";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useRecommendations } from "@/hooks/useRecommendations";
import { buildCf8Profile } from "@/lib/cfp";
import { STORAGE_KEYS } from "@/lib/storage";
import { DEFAULT_QUIZ_ANSWERS, DEFAULT_HARD_FILTER } from "@/data/quiz";

export default function FeedPage() {
  const router = useRouter();
  const [answers] = useLocalStorage(STORAGE_KEYS.answers, DEFAULT_QUIZ_ANSWERS);
  const [hardFilter] = useLocalStorage(
    STORAGE_KEYS.hardFilter,
    DEFAULT_HARD_FILTER,
  );
  const [mounted, setMounted] = useState(false);
  const { places, loading, error } = useRecommendations();

  useEffect(() => { setMounted(true); }, []);

  const profile = buildCf8Profile(answers, hardFilter);
  const hasProfile = mounted && profile !== null;

  return (
    <div className="flex min-h-full flex-col pb-20">
      <AppHeader
        logo
        onMenu={() => {/* S50 전체 메뉴 (구 S05) — W2 구현 예정 */}}
      />

      {/* TODO: 날씨·기온·현재 위치가 아직 하드코딩이다.
          useRecommendations가 내부에서만 날씨를 쓰고 밖으로 내주지 않아
          별도 티켓에서 훅 반환값 확장과 함께 처리한다. */}
      <LiveStatusBar weather="맑음" temperature={27} location="해운대" />

      <section className="px-[20px] pb-[24px]">
        <h1 className="ds-headline text-ink">지금 가기 좋은 곳</h1>
        <p className="ds-body-2 mt-[8px] text-gray-600">
          {loading
            ? "취향과 조건에 맞는 장소를 고르고 있어요"
            : `내 취향에 맞춰 ${places.length}곳을 골랐어요`}
        </p>
      </section>

      <section className="flex flex-col gap-[40px] px-[20px]">
        {loading && (
          <p className="ds-body-2 py-[40px] text-center text-gray-500">
            불러오는 중이에요
          </p>
        )}

        {/* 진단 전이면 추천을 만들 수 없다 — S01로 보낸다 */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-[16px] py-[40px]">
            <p className="ds-body-2 text-center text-gray-600">{error}</p>
            <button
              type="button"
              onClick={() => router.push("/onboarding")}
              className="ds-title-2 flex h-[48px] items-center justify-center rounded-[12px] bg-ink px-[24px] text-white transition-all active:scale-[0.98]"
            >
              취향 진단하기
            </button>
          </div>
        )}

        {!loading && !error && places.length === 0 && (
          <div className="flex flex-col items-center gap-[16px] py-[40px]">
            <p className="ds-body-2 text-center text-gray-600">
              조건에 맞는 장소를 찾지 못했어요
            </p>
            <button
              type="button"
              onClick={() => router.push("/trip-setup")}
              className="ds-title-2 flex h-[48px] items-center justify-center rounded-[12px] border border-gray-300 px-[24px] text-ink transition-all active:scale-[0.98]"
            >
              조건 다시 고르기
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          places.map((place) => (
            <PlaceCard key={place.contentId} place={place} />
          ))}
      </section>

      {/* CF8 유형 뱃지 (프로필 있을 때) — 코드·점수는 노출하지 않는다 */}
      {hasProfile && !loading && !error && places.length > 0 && (
        <div className="mt-[32px] flex justify-center">
          <span className="ds-caption rounded-full border border-gray-300 px-[12px] py-[6px] text-gray-600">
            {profile.nameKo}
          </span>
        </div>
      )}

      <BottomTabBar />
    </div>
  );
}
