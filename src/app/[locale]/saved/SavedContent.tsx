"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ItemBoundary } from "@/components/common/ItemBoundary";
import { ScreenTitle } from "@/components/common/TabScreen";
import { PlaceRow } from "@/components/place/PlaceRow";
import { useSavedPlaces } from "@/hooks/useSavedPlaces";
import { useStoredSnapshot } from "@/hooks/useStoredSnapshot";
import { apiUrl } from "@/lib/apiBase";
import { cf8FitScoreFromCode } from "@/lib/cf8Match";
import {
  districtLabel,
  districtLabelEn,
  fitBand,
  formatSavedAt,
} from "@/lib/placeDisplay";
import { readCf8Code } from "@/lib/storage";
import { SavedSkeleton } from "./SavedSkeleton";
import type { RecommendedPlace } from "@/types/place";
import type { Locale } from "@/i18n/routing";

type SortKey = "recent" | "fit";
const ALL = "__all__";

/** 저장 시점과 적합도는 장소 자체의 값이 아니라 이 화면에서 붙인다 */
type SavedEntry = {
  place: RecommendedPlace;
  savedAt: string;
  /** CF8 3축 적합도(0~100). 진단 전이거나 태그가 없으면 null */
  fit: number | null;
  district: string | null;
};

/**
 * 저장한 곳의 본문.
 *
 * 정렬은 두 가지다. 기본은 최근 저장순 — 저장은 "이따 다시 볼 것" 이라 방금 넣은
 * 것이 위에 있어야 한다. 적합도순은 쌓인 목록에서 나와 맞는 것부터 보는 쪽이다.
 *
 * 정렬 기준이 되는 값은 행에 같이 적는다. 무엇으로 줄 세웠는지 안 보이면 순서가
 * 임의로 읽힌다.
 *
 * 적합도는 CF8 3축 매칭만 쓴다 — 피드의 최종 점수와 달리 날씨·시간·위치 보정이
 * 없다. 저장 탭에서 위치 권한을 묻지 않기 위해서다. 그래서 라벨도 "추천순" 이
 * 아니라 "적합도순" 이다.
 *
 * 지역으로 거르되 묶지는 않는다. 외국인에게 `Haeundae` 는 목적지 이름이지
 * 분류 체계가 아니라, 섹션으로 쪼개면 목록이 짧아 보이기만 한다.
 */
export function SavedContent() {
  const locale = useLocale() as Locale;
  const t = useTranslations("saved");
  const tPlace = useTranslations("place");

  // 칩과 행의 구 이름은 같은 글자여야 한다 — 다르면 걸러지지 않는다
  const en = locale === "en";

  const cf8Code = useStoredSnapshot(readCf8Code, null);
  const { places: saved, toggle } = useSavedPlaces();

  /**
   * 장소 상세는 한 번만 받아 둔다. 저장을 해제해도 다시 부르지 않는다 —
   * 목록은 아래에서 `saved` 로부터 매번 다시 만들어지므로, 해제한 행은 저절로
   * 빠진다. 예전에는 토글할 때마다 배열에서 손으로 걸러냈다.
   */
  const [catalog, setCatalog] = useState<Map<string, RecommendedPlace> | null>(null);
  const [sort, setSort] = useState<SortKey>("recent");
  const [district, setDistrict] = useState<string>(ALL);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch(apiUrl("/api/recommend?limit=120"));
        const all = res.ok ? ((await res.json()) as RecommendedPlace[]) : [];
        if (!cancelled) setCatalog(new Map(all.map((p) => [p.contentId, p])));
      } catch {
        if (!cancelled) setCatalog(new Map());
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const entries = useMemo<SavedEntry[] | null>(() => {
    if (catalog === null) return null;

    return saved.flatMap<SavedEntry>((s) => {
      const place = catalog.get(s.id);
      if (!place) return [];
      return [
        {
          place,
          savedAt: s.savedAt,
          fit: cf8Code ? cf8FitScoreFromCode(cf8Code, place) : null,
          district: en ? districtLabelEn(place.addr1) : districtLabel(place.addr1),
        },
      ];
    });
  }, [catalog, saved, cf8Code, en]);

  /** 저장된 곳에 실제로 있는 지역만 — 고를 수 없는 칩을 두면 목록이 없는 것처럼 보인다 */
  const districts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of entries ?? []) {
      if (e.district) counts.set(e.district, (counts.get(e.district) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [entries]);

  const visible = useMemo(() => {
    const filtered = (entries ?? []).filter(
      (e) => district === ALL || e.district === district,
    );

    // 적합도가 없는 곳(진단 전·태그 없음)은 아래로. 0 으로 치면 "안 맞음" 이 된다
    return sort === "fit"
      ? [...filtered].sort((a, b) => (b.fit ?? -1) - (a.fit ?? -1))
      : filtered;
  }, [entries, district, sort]);

  if (entries === null) return <SavedSkeleton />;

  const now = new Date();
  const total = entries.length;

  if (total === 0) {
    return (
      <>
        <ScreenTitle>{t("title")}</ScreenTitle>
        <div className="flex flex-col items-center gap-4 px-[--gutter] py-16 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-surface text-sub-on-surface">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinejoin="round"
              className="size-6"
              aria-hidden
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
            </svg>
          </span>
          <p className="ds-title-1">{t("empty.title")}</p>
          <p className="ds-body-2 max-w-[30ch] text-sub">{t("empty.body")}</p>
          <Link
            href="/feed"
            className="ds-title-2 mt-2 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 text-white transition-colors active:bg-primary-press"
          >
            {t("empty.action")}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <ScreenTitle
        aside={
          <span className="ds-caption shrink-0 font-semibold text-sub">
            {t("count", { count: total })}
          </span>
        }
      >
        {t("title")}
      </ScreenTitle>

      {/* 진단 전에는 적합도를 낼 수 없으므로 고를 수 있는 척하지 않는다 */}
      <div
        role="group"
        aria-label={t("sortLabel")}
        className="mx-[--gutter] mt-4 flex gap-1 rounded-xl bg-surface p-1"
      >
        {(["recent", "fit"] as const).map((key) => {
          const disabled = key === "fit" && !cf8Code;

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              aria-pressed={sort === key}
              onClick={() => setSort(key)}
              className={`ds-caption min-h-10 flex-1 rounded-lg font-semibold transition-colors ${
                sort === key
                  ? "bg-page text-ink shadow-sm"
                  : disabled
                    ? "text-line"
                    : "text-sub"
              }`}
            >
              {t(`sort.${key}`)}
            </button>
          );
        })}
      </div>

      {districts.length > 1 && (
        <div
          role="group"
          aria-label={t("filterLabel")}
          className="mt-3 flex gap-2 overflow-x-auto px-[--gutter] pb-1"
        >
          <FilterChip
            label={t("filterAll")}
            active={district === ALL}
            onClick={() => setDistrict(ALL)}
          />
          {districts.map(([name, count]) => (
            <FilterChip
              key={name}
              label={`${name} ${count}`}
              active={district === name}
              onClick={() => setDistrict(name)}
            />
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="ds-body-2 px-[--gutter] py-12 text-center text-sub">
          {t("noneInDistrict")}
        </p>
      ) : (
        <div className="mt-4">
          {visible.map((entry) => {
            const band = fitBand(entry.fit);

            return (
              <ItemBoundary key={entry.place.contentId}>
                <PlaceRow
                  place={entry.place}
                  note={
                    sort === "fit"
                      ? band && tPlace(`fit.${band}`)
                      : formatSavedAt(entry.savedAt, now, (k, v) => t(k, v))
                  }
                  saved
                  onToggleSave={toggle}
                />
              </ItemBoundary>
            );
          })}
        </div>
      )}
    </>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`ds-caption min-h-10 shrink-0 rounded-full border px-4 font-medium transition-colors ${
        active ? "border-ink bg-ink text-white" : "border-line text-sub active:bg-surface"
      }`}
    >
      {label}
    </button>
  );
}
