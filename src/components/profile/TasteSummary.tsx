"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/components/common/Skeleton";
import type { Cf8ProfileCopy } from "@/data/cf8Profiles";
import type { Cf8Code } from "@/types/cfp";

/**
 * "이 목록은 이 기준으로 골랐다" 를 선언하는 카드.
 *
 * 카드 전체가 S02 로 가는 링크다. 코드(`CLD`)는 노출하지 않고 유형명과
 * 3축 요약만 보여준다.
 *
 * 유형은 QUICK·CUSTOM 과 무관하게 항상 있다 — 조건을 건너뛴 사람도 진단은
 * 마쳤고, 목록이 그 유형으로 정렬되기 때문이다.
 *
 * 흰 바탕에 테두리만 두르면 아래 목록 행과 무게가 같아 "머리말" 로 안 읽힌다.
 * 브랜드 틴트를 깔아 이 블록만 층을 달리한다.
 *
 * 프로필 요약이라 날씨처럼 지금 상황은 넣지 않는다. 캐릭터는 인물 크롭
 * (`public/characters/card`) — 전체 장면은 이 크기에서 형체가 뭉개진다.
 */

type TasteSummaryProps = {
  code: Cf8Code;
  copy: Cf8ProfileCopy;
};

const CARD = "mx-[--gutter] block rounded-2xl bg-primary-tint px-6 py-4";

export function TasteSummary({ code, copy }: TasteSummaryProps) {
  const t = useTranslations("feed");

  const axes = [copy.atmosphere.title, copy.place.title, copy.rhythm.title];

  return (
    <Link href="/profile" className={`${CARD} transition-opacity active:opacity-70`}>
      <span className="flex items-center gap-3">
        {/* 선화라 옷의 흰 면이 바탕색을 비친다 — 틴트 위에서도 흰 원에 올린다 */}
        <span className="size-14 shrink-0 overflow-hidden rounded-full bg-page">
          <Image
            src={`/characters/card/${code}.webp`}
            alt=""
            width={56}
            height={56}
            className="size-full object-cover"
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="ds-label block text-primary">{t("yourType")}</span>
          <span className="ds-title-1 block">{copy.profileName}</span>
        </span>

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5 shrink-0 text-primary"
          aria-hidden
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </span>

      {/*
        한 줄로 고정하고 넘치면 옆으로 민다 — 영문은 세 축이 한 줄에 들어가지 않아
        접으면 카드 높이가 로케일마다 달라진다. 잘린 칩이 더 있다는 표시다.
        스크롤 영역은 키보드로도 움직일 수 있어야 해서 초점을 받는다.
      */}
      <span
        tabIndex={0}
        role="group"
        aria-label={t("yourType")}
        className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {axes.map((axis) => (
          <span
            key={axis}
            className="ds-caption shrink-0 rounded-full border border-primary/30 px-3 py-1.5 font-medium whitespace-nowrap text-primary"
          >
            {axis}
          </span>
        ))}
      </span>
    </Link>
  );
}

/** 진단 결과는 localStorage 라 하이드레이션 뒤에야 확정된다 — 그 전까지 자리를 잡는다 */
export function TasteSummarySkeleton() {
  return (
    <div className={CARD}>
      <div className="flex items-center gap-3">
        <Skeleton className="size-14 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton tone="tint" className="h-2.5 w-20" />
          <Skeleton tone="tint" className="mt-2.5 h-5 w-[70%]" />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Skeleton tone="tint" className="h-7 w-16 rounded-full" />
        <Skeleton tone="tint" className="h-7 w-24 rounded-full" />
        <Skeleton tone="tint" className="h-7 w-20 rounded-full" />
      </div>
    </div>
  );
}
