"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SaveButton } from "./SaveButton";
import { draftPlaceType } from "@/data/placeTypeDraft";
import { districtLabel, districtLabelEn, secureImageUrl } from "@/lib/placeDisplay";
import type { RecommendedPlace } from "@/types/place";
import type { Locale } from "@/i18n/routing";

/**
 * S10 추천 피드의 사진 카드.
 *
 * 사진이 먼저 오고 글이 그 아래에 붙는다. 제목은 장소명 — 목록에서 누른 이름이
 * 상세(S20) 제목으로 그대로 이어져야 한다. 설명 문장은 상세의 제목 아래 문장과
 * 같은 필드(`DB_02.place_desc`)다.
 *
 * 메타 줄은 상세와 같은 순서(구 · 유형)에 실내외를 덧붙인다. 카드 사이는 선이
 * 아니라 여백으로 나눈다.
 *
 * 사진을 옆으로 넘기는 것과 사진 번호는 PR #31 의 `Hero` 를 공용으로 옮긴 뒤 붙인다.
 */

type PlaceCardProps = {
  place: RecommendedPlace;
  saved: boolean;
  onToggleSave: (contentId: string) => void;
};

export function PlaceCard({ place, saved, onToggleSave }: PlaceCardProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("place");

  const en = locale === "en";
  const title = en ? place.titleEn ?? place.title : place.title;
  const description = en ? place.whyEn : place.whyKo;
  // 시트가 비어 있는 동안만 초안에서 온다 — `placeTypeDraft.ts` 참고
  const placeType = place.placeType ?? draftPlaceType(place);
  const hasImage = Boolean(place.firstImage);

  // 구 이름은 로케일을 따른다 — 목록 API 에 영문 주소가 없어 표에서 만든다
  const district = en ? districtLabelEn(place.addr1) : districtLabel(place.addr1);

  const meta = [
    district,
    // 시트 place_type 에 10종 밖 값이 섞여 들어오면 원문 그대로 보여준다
    placeType && (t.has(`placeType.${placeType}`) ? t(`placeType.${placeType}`) : placeType),
    place.weatherType ? t(`weatherType.${place.weatherType}`) : null,
  ].filter(Boolean);

  return (
    <Link
      href={`/place/${place.contentId}`}
      className="block px-[--gutter] py-4 transition-opacity active:opacity-70"
    >
      <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-surface">
        {hasImage ? (
          <Image
            src={secureImageUrl(place.firstImage!)}
            alt=""
            fill
            sizes="(min-width: 640px) 640px, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="ds-body-2 text-sub">{t("noPhoto")}</span>
        )}

        {/* 저장 아이콘이 앉을 바탕. 사진 밝기와 무관하게 흰 아이콘 하나로 통일한다 */}
        {hasImage && (
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-black/40 to-transparent"
            aria-hidden
          />
        )}

        <SaveButton
          saved={saved}
          onToggle={() => onToggleSave(place.contentId)}
          placeName={title}
          onScrim={hasImage}
          className="absolute top-1 right-1"
        />
      </div>

      {meta.length > 0 && (
        <p className="ds-caption mt-3 font-semibold text-sub">{meta.join(" · ")}</p>
      )}
      <p className="ds-title-1 mt-0.5">{title}</p>
      {description && <p className="ds-body-2 mt-1">{description}</p>}
    </Link>
  );
}
