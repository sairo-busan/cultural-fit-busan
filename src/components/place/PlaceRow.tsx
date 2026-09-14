"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SaveButton } from "./SaveButton";
import {
  districtLabel,
  formatStayMinutes,
  secureImageUrl,
} from "@/lib/placeDisplay";
import type { RecommendedPlace } from "@/types/place";
import type { Locale } from "@/i18n/routing";

/**
 * 추천·저장이 함께 쓰는 목록 행.
 *
 * 추천 이유가 있으면 그 문장이 제목 자리를 차지한다 — 이 화면의 존재 이유가
 * "왜 이 순서인가" 라서 장소명보다 먼저 읽혀야 한다.
 *
 * 없으면 장소명이 올라오고 지표 줄이 근거를 대신한다. 영문은 `whyEn` 이
 * 49곳 중 20곳뿐이라 **이 분기가 기본값에 가깝다.**
 *
 * 순번은 추천에서만 쓴다. 저장 목록은 내가 고른 것이라 순위가 없다.
 */

type PlaceRowProps = {
  place: RecommendedPlace;
  /** 1부터. 없으면 순번을 그리지 않는다 */
  rank?: number;
  saved: boolean;
  onToggleSave: (contentId: string) => void;
};

export function PlaceRow({ place, rank, saved, onToggleSave }: PlaceRowProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("place");

  const reason = locale === "en" ? place.whyEn : place.whyKo;
  const district = districtLabel(place.addr1);
  const hasImage = Boolean(place.firstImage);

  // 문장이 없으면 지표가 근거를 대신하므로 더 많이 보여준다
  const facts = [
    district,
    place.weatherType ? t(`weatherType.${place.weatherType}`) : null,
    formatStayMinutes(place.stayMinutes, (k, v) => t(k, v)),
    !reason && place.crowdLevel !== null
      ? t(place.crowdLevel <= 2 ? "crowd.low" : "crowd.high")
      : null,
    !reason && place.budgetLevel !== null && place.budgetLevel <= 1
      ? t("budget.low")
      : null,
  ].filter(Boolean);

  return (
    <Link
      href={`/place/${place.contentId}`}
      className="flex items-start gap-4 border-b border-hair px-[--gutter] py-6 transition-colors active:bg-surface"
    >
      <div className="min-w-0 flex-1">
        {rank !== undefined && (
          <span className="ds-serif block text-sm leading-none tracking-[0.1em] text-primary">
            {String(rank).padStart(2, "0")}
          </span>
        )}

        {reason ? (
          <>
            <p className="ds-body-1 mt-2">{reason}</p>
            <p className="ds-caption mt-2 text-sub">
              <b className="font-semibold text-ink">{place.title}</b>
              {district ? ` · ${district}` : ""}
            </p>
          </>
        ) : (
          <p className="ds-title-2 mt-2">{place.title}</p>
        )}

        {facts.length > 0 && (
          <p className="ds-caption mt-3 text-sub">{facts.join(" · ")}</p>
        )}
      </div>

      <div className="relative w-24 shrink-0">
        <div className="grid size-24 place-items-center overflow-hidden rounded bg-surface">
          {hasImage ? (
            <Image
              src={secureImageUrl(place.firstImage!)}
              alt=""
              width={96}
              height={96}
              className="size-full object-cover"
            />
          ) : (
            <span className="ds-serif ds-caption italic text-sub">
              {t("noPhoto")}
            </span>
          )}
        </div>

        <SaveButton
          saved={saved}
          onToggle={() => onToggleSave(place.contentId)}
          placeName={place.title}
          onPlain={!hasImage}
          className="absolute -top-1.5 -right-1.5"
        />
      </div>
    </Link>
  );
}
