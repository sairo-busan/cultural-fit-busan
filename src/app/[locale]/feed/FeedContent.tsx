"use client";

import { useLocale, useTranslations } from "next-intl";
import { RotateCw } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { ListHeader, ScreenTitle } from "@/components/common/TabScreen";
import { WeatherIcon } from "@/components/common/WeatherIcon";
import { TasteSummary } from "@/components/profile/TasteSummary";
import { PlaceCard } from "@/components/place/PlaceCard";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useSavedPlaces } from "@/hooks/useSavedPlaces";
import { CF8_PROFILES } from "@/data/cf8Profiles";
import { FeedSkeleton } from "./FeedSkeleton";
import { QuizPrompt } from "./QuizPrompt";
import type { Locale } from "@/i18n/routing";

/**
 * S10 추천 피드의 본문.
 *
 * 목록이 왜 이 순서인지 화면에서 읽히게 하는 것이 이 화면의 목적이다.
 * 유형 → 상황 → 목록 순으로 "이 기준으로 골랐다" 를 먼저 선언한다.
 *
 * 날씨는 관측 사실만 적는다. 순위에서 날씨 비중은 15% 라 "비가 와서 실내부터"
 * 같은 인과 문구는 쓰지 않는다.
 */
export function FeedContent() {
  const locale = useLocale() as Locale;
  const t = useTranslations("feed");

  const {
    places,
    loading,
    error,
    code,
    retry,
    weather,
    temperature,
    forecastSlot,
    weatherFailed,
    weatherLoading,
    reloadWeather,
  } = useRecommendations();
  const { ids: savedIds, toggle } = useSavedPlaces();

  if (loading) return <FeedSkeleton hasTaste={code !== null} />;

  const copy = code ? CF8_PROFILES[locale][code] : null;

  return (
    <>
      <ScreenTitle>{t("title")}</ScreenTitle>

      {/*
        목록을 못 받았으면 박스 · 정렬 라벨을 숨기고 재시도만 남긴다 — 보여줄 목록이
        없는데 "맞는 곳부터" 를 약속할 수 없고, 검은 버튼 둘이 겹친다.
      */}
      {error === null && (
        <>
          <div className="mt-4">
            {code && copy ? <TasteSummary code={code} copy={copy} /> : <QuizPrompt />}
          </div>

          {/*
            기상청 응답이 없으면 가짜 값 대신 안내와 다시 불러오기를 둔다.
            훅이 이미 한 번 더 요청한 뒤라 여기까지 온 건 실제로 안 되는 경우다.
          */}
          <ListHeader aside={t(code ? "sortByMatch" : "sortByLandmark")}>
            {weather && (
              <>
                <WeatherIcon weather={weather} className="size-4 shrink-0" />
                {temperature !== null && (
                  <span className="ds-caption font-semibold text-ink tabular-nums">
                    {Math.round(temperature)}°
                  </span>
                )}
                {/*
                  시각은 조회 시각이 아니라 예보 슬롯 시각이다 — 10:18 에 받아도
                  값은 10 시 예보다. 슬롯을 못 고르면 시각만 뺀다.
                */}
                <span className="ds-caption truncate">
                  {forecastSlot
                    ? t("nowIn", {
                        weather: t(`weather.${weather}`),
                        time: `${forecastSlot.time.slice(0, 2)}:${forecastSlot.time.slice(2)}`,
                      })
                    : t("nowInNoTime", { weather: t(`weather.${weather}`) })}
                </span>
              </>
            )}
            {!weather && weatherLoading && (
              <>
                <Skeleton className="size-4 rounded-full" />
                <Skeleton className="h-3 w-28" />
              </>
            )}
            {!weather && !weatherLoading && weatherFailed && (
              <>
                <span className="ds-caption truncate">{t("weatherFailed")}</span>
                {/* 아이콘은 글자 크기, 누르는 영역은 44px */}
                <button
                  type="button"
                  onClick={reloadWeather}
                  aria-label={t("reloadWeather")}
                  className="-my-3.5 grid size-11 shrink-0 place-items-center text-ink"
                >
                  <RotateCw size={16} strokeWidth={2} aria-hidden />
                </button>
              </>
            )}
          </ListHeader>
        </>
      )}

      {error === "LOAD_FAILED" && (
        <EmptyState
          title={t("loadFailed.title")}
          body={t("loadFailed.body")}
          onAction={retry}
          actionLabel={t("loadFailed.action")}
        />
      )}

      {error === null && places.length === 0 && (
        <EmptyState
          title={t("noResults.title")}
          body={t("noResults.body")}
          actionHref="/trip-setup"
          actionLabel={t("noResults.action")}
        />
      )}

      {error === null && (
        <div className="mt-2">
          {places.map((place) => (
            <PlaceCard
              key={place.contentId}
              place={place}
              saved={savedIds.has(place.contentId)}
              onToggleSave={toggle}
            />
          ))}
        </div>
      )}
    </>
  );
}
