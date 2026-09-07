"use client";

import Image from "next/image";
import Link from "next/link";
import type { RecommendedPlace } from "@/types/place";

type PlaceCardProps = {
  place: RecommendedPlace;
};

export function PlaceCard({ place }: PlaceCardProps) {
  const weatherLabel =
    place.weatherType === "indoor"
      ? "실내"
      : place.weatherType === "mixed"
        ? "실내외"
        : "야외";

  return (
    <Link
      href={`/place/${place.contentId}`}
      className="group block overflow-hidden rounded-[16px] border border-border bg-white transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] active:scale-[0.98] active:shadow-none"
    >
      {/* 이미지 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
        {place.firstImage ? (
          <Image
            src={place.firstImage}
            alt={place.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="100vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <span className="text-[12px]">이미지 없음</span>
          </div>
        )}
      </div>

      {/* 콘텐츠 영역 */}
      <div className="px-[16px] pt-[14px] pb-[16px]">
        {/* 카테고리 태그 + 지역 */}
        {place.placeType && (
          <p className="text-[11px] font-light tracking-wider text-muted uppercase">
            {place.placeType} · {place.addr1.split(" ").slice(1, 2).join("")}
          </p>
        )}

        {/* 장소명 한국어 + 영문 */}
        <p className="mt-[6px] text-[16px] font-normal text-foreground">
          {place.title}
        </p>
        {place.titleEn && (
          <p className="mt-[2px] text-[13px] font-light text-sub-text">
            {place.titleEn}
          </p>
        )}

        {/* 매칭 퍼센트 */}
        <div className="mt-[10px] flex items-baseline gap-[6px]">
          <span className="font-serif text-[20px] font-normal text-foreground">
            {place.fitScore}%
          </span>
          <span className="text-[13px] font-light text-foreground">
            잘 맞아요
          </span>
        </div>

        {/* 개인화 설명 */}
        <p className="mt-[6px] text-[13px] font-light leading-relaxed text-sub-text">
          {place.reasons[0]}
        </p>

        {/* 하단 메타 */}
        <div className="mt-[12px] flex items-center justify-between">
          <p className="text-[11px] font-light text-muted">
            {place.distanceMin ? `도보 ${place.distanceMin}분` : "거리 정보 없음"}
            {place.info[0] && ` · ${place.info[0].text}`}
            {` · ${weatherLabel}`}
          </p>
          <div className="flex gap-[6px]">
            {place.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface px-[8px] py-[2px] text-[11px] font-light text-accent"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
