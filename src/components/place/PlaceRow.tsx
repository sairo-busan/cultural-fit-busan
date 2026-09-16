"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SaveButton } from "./SaveButton";
import { districtLabel, secureImageUrl } from "@/lib/placeDisplay";
import type { RecommendedPlace } from "@/types/place";
import type { Locale } from "@/i18n/routing";


/**
 * 저장 탭의 목록 행.
 *
 * 모아둔 곳을 찾는 화면이라 한 화면에 여러 곳이 보여야 한다. 추천(S10)의 큰
 * 사진 카드와 달리 사진은 88px 이고, 제목 · 설명은 카드와 같은 규칙을 쓴다 —
 * 제목은 장소명, 설명은 상세 제목 아래 문장.
 *
 * 저장 버튼은 링크 밖에 둔다. 행 전체가 상세로 가는 링크라서, 버튼이 안에
 * 있으면 저장할 때마다 이동을 막아야 한다.
 */

type PlaceRowProps = {
  place: RecommendedPlace;
  /**
   * 메타 줄 맨 앞 — 지금 정렬 기준이 이 행에서 어떤 값인지 적는다
   * ("3일 전 저장" · "잘 맞음"). 문구는 화면이 정한다.
   */
  note?: string | null;
  saved: boolean;
  onToggleSave: (contentId: string) => void;
};

export function PlaceRow({ place, note, saved, onToggleSave }: PlaceRowProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("place");

  const title = locale === "en" ? place.titleEn ?? place.title : place.title;
  const description = locale === "en" ? place.whyEn : place.whyKo;
  const hasImage = Boolean(place.firstImage);

  const meta = [
    districtLabel(place.addr1),
    place.weatherType ? t(`weatherType.${place.weatherType}`) : null,
  ].filter(Boolean);

  return (
    <div className="flex items-start gap-2 px-[--gutter] py-4">
      <Link
        href={`/place/${place.contentId}`}
        className="flex min-w-0 flex-1 gap-4 transition-opacity active:opacity-70"
      >
        <div className="relative grid size-22 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface">
          {hasImage ? (
            <Image
              src={secureImageUrl(place.firstImage!)}
              alt=""
              fill
              sizes="88px"
              className="object-cover"
            />
          ) : (
            <span className="ds-caption text-sub">{t("noPhoto")}</span>
          )}
        </div>

        <div className="min-w-0">
          <p className="ds-caption font-semibold text-sub">
            {note && <b className="font-bold text-ink">{note}</b>}
            {note && meta.length > 0 ? " · " : ""}
            {meta.join(" · ")}
          </p>
          <p className="ds-title-2 mt-0.5">{title}</p>
          {description && <p className="ds-body-2 mt-0.5 line-clamp-2">{description}</p>}
        </div>
      </Link>

      <SaveButton
        saved={saved}
        onToggle={() => onToggleSave(place.contentId)}
        placeName={title}
        onScrim={false}
        className="-mt-2.5 -mr-3.5"
      />
    </div>
  );
}
