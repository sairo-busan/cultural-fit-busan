"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PhotoSwipe } from "./PhotoSwipe";
import { SaveButton } from "./SaveButton";
import { draftPlaceType } from "@/data/placeTypeDraft";
import { districtLabel, districtLabelEn } from "@/lib/placeDisplay";
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
 * 사진은 옆으로 넘긴다. 밀면 사진만 넘어가고, 탭하면 상세로 간다.
 */

type PlaceCardProps = {
  place: RecommendedPlace;
  saved: boolean;
  onToggleSave: (contentId: string) => void;
  /** 첫 화면에 보이는 카드 — 사진을 바로 받는다 */
  priority?: boolean;
};

export function PlaceCard({ place, saved, onToggleSave, priority = false }: PlaceCardProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("place");

  const en = locale === "en";
  const title = en ? place.titleEn ?? place.title : place.title;
  const description = en ? place.whyEn : place.whyKo;
  // 시트가 비어 있는 동안만 초안에서 온다 — `placeTypeDraft.ts` 참고
  const placeType = place.placeType ?? draftPlaceType(place);
  const images = [...new Set([place.firstImage, ...place.images].filter((src): src is string => Boolean(src)))];
  const hasImage = images.length > 0;

  // 구 이름은 로케일을 따른다 — 목록 API 에 영문 주소가 없어 표에서 만든다
  const district = en ? districtLabelEn(place.addr1) : districtLabel(place.addr1);

  const meta = [
    district,
    // 시트 place_type 에 10종 밖 값이 섞여 들어오면 원문 그대로 보여준다
    placeType && (t.has(`placeType.${placeType}`) ? t(`placeType.${placeType}`) : placeType),
    place.weatherType ? t(`weatherType.${place.weatherType}`) : null,
  ].filter(Boolean);

  return (
    // 사진을 누를 때는 흐리지 않는다 — iOS Safari 는 스와이프하는 동안에도 :active 를 유지한다
    <Link
      href={`/place/${place.contentId}`}
      className="block px-[--gutter] py-4 transition-opacity active:not-has-[[role=region]:active]:opacity-70"
    >
      <PhotoSwipe
        images={images}
        name={title}
        sizes="(min-width: 640px) 640px, 100vw"
        className="aspect-[4/3] overflow-hidden rounded-2xl bg-surface"
        hoverArrows
        priority={priority}
      >
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
      </PhotoSwipe>

      {meta.length > 0 && (
        <p className="ds-caption mt-3 font-semibold text-sub">{meta.join(" · ")}</p>
      )}
      <p className="ds-title-1 mt-0.5">{title}</p>
      {description && <p className="ds-body-2 mt-1">{description}</p>}
    </Link>
  );
}
