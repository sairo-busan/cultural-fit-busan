"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/common/AppHeader";
import { BottomTabBar } from "@/components/common/BottomTabBar";
import { LiveStatusBar } from "@/components/feed/LiveStatusBar";
import { PlaceCard } from "@/components/feed/PlaceCard";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { buildCfpProfile } from "@/lib/cfp";
import { DEFAULT_QUIZ_ANSWERS, DEFAULT_HARD_FILTER } from "@/data/quiz";
import { MOCK_RECOMMENDED } from "@/data/mock-places";

// W1 하드코딩 — W2에서 추천 엔진 + 날씨 API + GPS로 교체 예정
const CATEGORY_CHIPS = [
  { label: "비를 피할 수 있는 곳", count: 4 },
  { label: "걸어서 10분", count: 3 },
  { label: "로컬 분위기", count: 2 },
  { label: "혼자 가기 좋은", count: 3 },
];

export default function FeedPage() {
  const [answers] = useLocalStorage("cfb-quiz-answers", DEFAULT_QUIZ_ANSWERS);
  const [hardFilter] = useLocalStorage("cfb-hard-filter", DEFAULT_HARD_FILTER);
  const [mounted, setMounted] = useState(false);
  const [activeChip, setActiveChip] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  const profile = buildCfpProfile(answers, hardFilter);
  const hasProfile = mounted && profile !== null;

  return (
    <div className="flex min-h-full flex-col pb-20">
      <AppHeader
        logo
        onMenu={() => {/* S50 전체 메뉴 (구 S05) — W2 구현 예정 */}}
      />

      <LiveStatusBar weather="맑음" temperature={27} location="해운대" />

      {/* 제목 + 부제 */}
      <section className="px-[20px] pb-[24px]">
        <h1 className="text-[24px] font-normal leading-tight text-foreground">
          해운대에서 지금
        </h1>
        <p className="mt-[8px] text-[14px] font-light leading-relaxed text-sub-text">
          비가 와서 실내부터, 도보 10분 안쪽으로 골랐어요
        </p>
      </section>

      {/* 카테고리 칩 — 가로 스크롤 */}
      <div className="mb-[24px] flex gap-[8px] overflow-x-auto px-[20px] scrollbar-hide">
        {CATEGORY_CHIPS.map((chip, chipIndex) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => setActiveChip(chipIndex)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-[14px] py-[8px] text-[12px] font-light transition-colors ${
              chipIndex === activeChip
                ? "border-accent bg-accent text-white"
                : "border-border text-foreground"
            }`}
          >
            {chip.label} {chip.count}곳
          </button>
        ))}
      </div>

      {/* 왜 이 묶음인지 */}
      <p className="mb-[24px] px-[20px] text-[12px] font-light text-muted">
        비가 시작돼서 이 묶음을 먼저 보여드립니다
      </p>

      {/* 장소 카드 세로 리스트 */}
      <section className="flex flex-col gap-[40px] px-[20px]">
        {MOCK_RECOMMENDED.map((place) => (
          <PlaceCard key={place.contentId} place={place} />
        ))}
      </section>

      {/* CFP 뱃지 (프로필 있을 때) */}
      {hasProfile && (
        <div className="mt-[32px] flex justify-center">
          <span className="rounded-full border border-accent px-[12px] py-[6px] text-[11px] font-light text-accent">
            {profile.typeCode} · {profile.nameKo}
          </span>
        </div>
      )}

      <BottomTabBar />
    </div>
  );
}
