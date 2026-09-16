"use client";

import { useLocale, useTranslations } from "next-intl";
import { EmptyState } from "@/components/common/EmptyState";
import { ListHeader, ScreenTitle } from "@/components/common/TabScreen";
import { WeatherIcon } from "@/components/common/WeatherIcon";
import { TasteSummary } from "@/components/profile/TasteSummary";
import { PlaceCard } from "@/components/place/PlaceCard";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useSavedPlaces } from "@/hooks/useSavedPlaces";
import { useStoredSnapshot } from "@/hooks/useStoredSnapshot";
import { CF8_PROFILES } from "@/data/cf8Profiles";
import { isCf8Code } from "@/lib/cfp";
import { readCf8Code } from "@/lib/storage";
import { FeedSkeleton } from "./FeedSkeleton";
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

  const { places, loading, error, retry, weather, temperature, forecastSlot } =
    useRecommendations();
  const cf8Code = useStoredSnapshot(readCf8Code, null);
  const { ids: savedIds, toggle } = useSavedPlaces();

  if (loading) return <FeedSkeleton />;

  const code = cf8Code && isCf8Code(cf8Code) ? cf8Code : null;
  const copy = code ? CF8_PROFILES[locale][code] : null;

  return (
    <>
      <ScreenTitle>{t("title")}</ScreenTitle>

      {code && copy && (
        <div className="mt-4">
          <TasteSummary code={code} copy={copy} />
        </div>
      )}

      {/* 기상청 응답이 없으면 날씨를 비우고 정렬 기준만 남긴다. 가짜 값을 쓰지 않는다 */}
      <ListHeader aside={t("sortByMatch")}>
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
      </ListHeader>

      {/* 진단 전이면 추천을 만들 수 없다 — S01 로 보낸다 */}
      {error === "NEED_QUIZ" && (
        <EmptyState
          title={t("needQuiz.title")}
          body={t("needQuiz.body")}
          actionHref="/onboarding"
          actionLabel={t("needQuiz.action")}
        />
      )}

      {/*
        네트워크 실패를 진단 안내로 덮으면 안 된다 — 진단은 이미 마친 사람이라
        S01 로 보내면 답한 문항을 다시 풀게 된다. 여기서 필요한 건 재시도다.
      */}
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
