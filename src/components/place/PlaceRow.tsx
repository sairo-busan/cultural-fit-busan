"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SaveButton } from "./SaveButton";
import { draftPlaceType } from "@/data/placeTypeDraft";
import { districtLabel, secureImageUrl } from "@/lib/placeDisplay";
import type { RecommendedPlace } from "@/types/place";
import type { Locale } from "@/i18n/routing";

/** 앱 빌드에서만 끈다 — `scripts/build-app.sh` */
const DETAIL_ENABLED = process.env.NEXT_PUBLIC_DETAIL_ENABLED !== "false";

/**
 * 추천·저장이 함께 쓰는 목록 행.
 *
 * 추천 이유가 있으면 그 문장이 제목 자리를 차지한다 — 이 화면의 존재 이유가
 * "왜 이 순서인가" 라서 장소명보다 먼저 읽혀야 한다.
 *
 * 없으면 장소명이 올라오고 지표 줄이 근거를 대신한다. 영문은 `whyEn` 이
 * 49곳 중 20곳뿐이라 **이 분기가 기본값에 가깝다.**
 *
 * 제목 위 한 줄은 탭마다 쓰임이 다르다 — 추천은 분류 뱃지, 저장은 정렬 기준값.
 */

type PlaceRowProps = {
  place: RecommendedPlace;
  /**
   * 제목 위 한 줄. 지금 정렬 기준이 이 행에서 어떤 값인지 적는다
   * ("3일 전" · "잘 맞음"). 문구는 화면이 정한다 — 행은 무엇으로 정렬됐는지 모른다.
   *
   * 추천 피드에서는 넘기지 않는다 — 그 자리는 분류 뱃지가 쓴다.
   * 원래 순번(01·02)이 있던 자리인데, 순위 숫자는 장소를 설명하지 않아 뺐다.
   */
  note?: string | null;
  saved: boolean;
  onToggleSave: (contentId: string) => void;
};

export function PlaceRow({ place, note, saved, onToggleSave }: PlaceRowProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("place");

  const reason = locale === "en" ? place.whyEn : place.whyKo;
  // 9/15 QA 발견 — title은 그동안 locale 무관 항상 한국어였음. titleEn이 이제
  // 채워지므로(DB_02 place_name_en) 영문 모드에서 스위치한다. 없으면 한국어로 폴백
  const title = locale === "en" ? place.titleEn ?? place.title : place.title;
  // 시트가 비어 있는 동안만 초안에서 온다 — `placeTypeDraft.ts` 참고
  const placeType = place.placeType ?? draftPlaceType(place);
  const district = districtLabel(place.addr1);
  const hasImage = Boolean(place.firstImage);

  // 문장이 없으면 지표가 근거를 대신하므로 더 많이 보여준다
  // 9/15 — crowdLevel·stayMinutes·budgetLevel은 92번 시트 잔재라 API 응답에서
  // 빠짐(DB_01/02/03에 대응 컬럼 없음, BE-FEAT-011 리뷰) — QA 중 발견, 제거함
  const facts = [
    district,
    place.weatherType ? t(`weatherType.${place.weatherType}`) : null,
  ].filter(Boolean);

  const body = (
    <>
      <div className="min-w-0 flex-1">
        {/* 정렬 메타(저장 탭)와 분류 뱃지(추천 탭)가 같은 자리를 나눠 쓴다 */}
        {note ? (
          <span className="ds-label block leading-none text-primary">{note}</span>
        ) : (
          // 9/16 QA 발견 — 시트 place_type에 10종 밖 값("쇼핑" 등, 유나 확인 요청함)이
          // 섞여 들어오면 t()가 MISSING_MESSAGE로 던져서 피드 전체가 크래시났다.
          // 모르는 값은 원문 그대로 보여주고 넘어간다.
          placeType && (
            <span className="ds-label block leading-none text-secondary">
              {t.has(`placeType.${placeType}`) ? t(`placeType.${placeType}`) : placeType}
            </span>
          )
        )}

        {reason ? (
          <>
            <p className="ds-body-1 mt-2">{reason}</p>
            <p className="ds-caption mt-2 text-sub">
              <b className="font-semibold text-ink">{title}</b>
              {district ? ` · ${district}` : ""}
            </p>
          </>
        ) : (
          <p className="ds-title-2 mt-2">{title}</p>
        )}

        {facts.length > 0 && (
          <p className="ds-caption mt-3 text-sub">{facts.join(" · ")}</p>
        )}
      </div>

      <div className="relative w-24 shrink-0">
        <div className="relative grid size-24 place-items-center overflow-hidden rounded bg-surface">
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

          {/*
            저장 아이콘이 앉을 바탕. 사진마다 밝기가 다른데 아이콘 색을 사진에
            맞춰 바꾸면 같은 저장 상태가 행마다 다르게 보인다. 대신 모서리를
            일정하게 어둡게 깔아 어떤 사진 위에서도 흰 아이콘 하나로 통일한다.

            사진이 없는 자리에는 깔지 않는다 — 밝은 회색 박스에 어두운 얼룩만
            남아 렌더링 사고처럼 보인다. 그 자리만 먹색 아이콘으로 간다.
          */}
          {hasImage && (
            <span
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.28)_30%,transparent_62%)]"
              aria-hidden
            />
          )}
        </div>

        <SaveButton
          saved={saved}
          onToggle={() => onToggleSave(place.contentId)}
          placeName={title}
          onScrim={hasImage}
          className="absolute -top-1.5 -right-1.5"
        />
      </div>
    </>
  );

  const rowClass = "flex items-start gap-4 border-b border-hair px-[--gutter] py-6";

  // ponytail: 앱 빌드엔 S20 이 없어 링크가 404 로 간다. FE-FEAT-010 에서 상세가 붙으면 분기째 지운다
  if (!DETAIL_ENABLED) return <div className={rowClass}>{body}</div>;

  return (
    <Link
      href={`/place/${place.contentId}`}
      className={`${rowClass} transition-colors active:bg-surface`}
    >
      {body}
    </Link>
  );
}
