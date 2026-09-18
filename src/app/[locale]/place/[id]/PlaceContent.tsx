"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AppHeader } from "@/components/common/AppHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { PhotoSwipe } from "@/components/place/PhotoSwipe";
import { useSavedPlaces } from "@/hooks/useSavedPlaces";
import { useStoredSnapshot } from "@/hooks/useStoredSnapshot";
import { Link, useRouter } from "@/i18n/navigation";
import { districtLabel, districtLabelEn, googleMapsUrl, isArchivePhoto, reasonWithoutLead, secureImageUrl } from "@/lib/placeDisplay";
import { readCf8Code } from "@/lib/storage";
import { PlaceSkeleton } from "./PlaceSkeleton";
import type { Locale } from "@/i18n/routing";
// 응답 타입은 API 쪽 정의를 그대로 쓴다. 타입만 가져와 서버 코드는 번들에 들어가지 않는다
import type { NearbyPlace } from "@/lib/nearbyPlaces";
import type { PlaceDetail } from "@/lib/placeDetail";
import { apiUrl } from "@/lib/apiBase";

/**
 * 없는 id 와 불러오기 실패를 가른다. 목록이 바뀌어 사라진 곳에 "다시 시도" 를
 * 띄우면 몇 번을 눌러도 같은 화면이다.
 */
type Load =
  | { status: "loading" }
  | { status: "ready"; place: PlaceDetail }
  | { status: "notFound" }
  | { status: "failed" };

/** S20 장소 상세의 본문 */
export function PlaceContent() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale() as Locale;
  const t = useTranslations("placeDetail");
  // 실내 · 야외 문구는 목록 행과 같은 것을 쓴다
  const tPlace = useTranslations("place");

  const { ids: savedIds, toggle } = useSavedPlaces();
  const cf8Code = useStoredSnapshot(readCf8Code, null);
  const router = useRouter();

  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoad({ status: "loading" });
      try {
        const res = await fetch(apiUrl(`/api/place/${encodeURIComponent(id)}`));
        const next: Load =
          res.status === 404
            ? { status: "notFound" }
            : res.ok
              ? { status: "ready", place: (await res.json()) as PlaceDetail }
              : { status: "failed" };
        if (!cancelled) setLoad(next);
      } catch {
        if (!cancelled) setLoad({ status: "failed" });
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  // 링크를 직접 열고 들어오면 돌아갈 기록이 없다
  const back = () => (window.history.length > 1 ? router.back() : router.push("/feed"));

  if (load.status === "loading") return <PlaceSkeleton />;

  // 실패 화면엔 사진이 없어 흰 원 대신 헤더 뒤로 버튼을 쓴다
  if (load.status === "notFound") {
    return (
      <>
        <AppHeader onBack={back} />
        <div className="screen">
          <EmptyState
            title={t("notFound.title")}
            body={t("notFound.body")}
            actionHref="/feed"
            actionLabel={t("notFound.action")}
          />
        </div>
      </>
    );
  }

  if (load.status === "failed") {
    return (
      <>
        <AppHeader onBack={back} />
        <div className="screen">
          <EmptyState
            title={t("loadFailed.title")}
            body={t("loadFailed.body")}
            onAction={retry}
            actionLabel={t("loadFailed.action")}
          />
        </div>
      </>
    );
  }

  const { place } = load;
  const saved = savedIds.has(place.contentId);
  const en = locale === "en";
  const name = en ? (place.nameEn ?? place.nameKo) : place.nameKo;
  const desc = en ? place.descEn : place.descKo;
  const district = en ? districtLabelEn(place.addr1) : districtLabel(place.addr1);
  // 시트 값이 10종 밖이면 영문 이름이 없다. 한국어를 섞지 않고 뺀다
  const type = place.placeType
    ? en
      ? t.has(`placeType.${place.placeType}`) ? t(`placeType.${place.placeType}`) : null
      : place.placeType
    : null;
  // 이유 문장은 한국어뿐이다. 영문 화면에 한국어 문장을 섞지 않는다
  const rawReason = !en && cf8Code ? place.reasonByCf8[cf8Code] : null;
  const reason = rawReason ? reasonWithoutLead(rawReason, place.descKo) : null;

  const hours = en ? (place.hoursEn ?? place.hours) : place.hours;
  const closedDays = en ? (place.closedDaysEn ?? place.closedDays) : place.closedDays;
  // 둘 중 하나라도 길면 둘 다 한 줄 전체를 쓴다. 한쪽만 펴면 짝이 반 칸에 혼자 남는다
  const wideHours = [hours, closedDays].some((v) => (v?.length ?? 0) > WIDE_AT);

  const guide = en ? place.guideEn : place.guideDetailKo;
  // 놓치기 쉬운 것 · 무장애 원문은 한국어뿐이다
  const tips = en
    ? []
    : TIP_KEYS.flatMap((key) => (place.tipsKo[key] ? [{ key, text: place.tipsKo[key] }] : []));
  const access = en ? [] : place.accessibility.filter((a) => t.has(`accessibility.${a.key}`));

  // 출처 — 사진만 출처가 갈린다. 둘 다 TourAPI 면 한 줄로 합치고, 사진이 없으면 사진 줄을 뺀다
  const archivePhoto = place.images.some(isArchivePhoto);
  const tourPhoto = place.images.some((url) => !isArchivePhoto(url));
  const photoSource = archivePhoto ? (tourPhoto ? "photoBoth" : "photoArchive") : null;
  const restSource = photoSource || !tourPhoto ? "rest" : "all";

  return (
    // 다른 장소로 넘어가면 갤러리 위치 · 근처 목록을 처음부터 다시 그린다
    <article key={place.contentId}>
      <Hero
        images={place.images}
        name={name}
        onBack={back}
      />

      <div className="screen">
        {(district || type) && (
          <p className="ds-label mt-6 text-primary">{[district, type].filter(Boolean).join(" · ")}</p>
        )}
        <h1 className="ds-headline mt-2">{name}</h1>
        {desc && <p className="ds-body-1 mt-2">{desc}</p>}
        <p className="ds-body-2 mt-2 font-medium text-sub">{en ? (place.addr1En ?? place.addr1) : place.addr1}</p>

        {reason && (
          <div className="mt-4 rounded-xl bg-primary-tint p-4">
            <p className="ds-label text-primary">{t("fitTitle")}</p>
            <p className="ds-body-1 mt-2">{reason}</p>
          </div>
        )}

        {/* 원천이 있는 칸은 이 장소에 값이 없어도 라벨을 남긴다 — 줄이 사라지면 그런 정보가 있다는 걸 알 수 없다 */}
        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-hair pt-4">
          <Fact label={t("facts.hours")} value={hours} wide={wideHours} />
          <Fact label={t("facts.closedDays")} value={closedDays} wide={wideHours} />
          <Fact
            label={t("facts.indoorOutdoor")}
            value={place.weatherType ? tPlace(`weatherType.${place.weatherType}`) : null}
          />
          <Fact
            label={t("facts.pet")}
            value={place.petAllowed === null ? null : t(place.petAllowed ? "pet.yes" : "pet.no")}
            note={!en && place.petAllowed ? place.petCondition : null}
          />
          <Fact label={t("facts.phone")} value={place.phone} tel={telNumber(place.phone)} />
          <Fact
            label={t("facts.accessibility")}
            value={place.accessibility.length > 0 ? t("facts.accessibilityYes") : null}
            // 목록이 가이드 아래라 "안내 있음" 만 보고 내용을 못 찾는다. 해시를 쓰면 뒤로 가기가 이 페이지에 한 번 더 걸린다
            onPress={access.length > 0 ? () => scrollToSection("accessibility") : undefined}
          />
        </dl>

        {guide && (
          <section className="mt-6 border-t border-hair pt-6">
            <h2 className="ds-title-1">{t("guideTitle")}</h2>
            {guide.split(/\n\s*\n/).map((para, i) => (
              <p key={i} className="ds-body-2 mt-3 whitespace-pre-line">
                {para}
              </p>
            ))}
          </section>
        )}

        {tips.length > 0 && (
          <section className="mt-6">
            <h3 className="ds-title-2">{t("tipsTitle")}</h3>
            {tips.map(({ key, text }) => (
              <div key={key} className="mt-3 flex gap-3">
                <span className="w-0.75 shrink-0 rounded-full bg-primary" aria-hidden />
                <div>
                  <p className="ds-caption font-semibold text-sub">{t(`tips.${key}`)}</p>
                  <p className="ds-body-2 mt-0.5">{text}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {access.length > 0 && (
          <section className="mt-6 border-t border-hair pt-6">
            <h2 id="accessibility" tabIndex={-1} className="ds-title-1 scroll-mt-6 outline-none">
              {t("accessibilityTitle")}
            </h2>
            <dl className="mt-2">
              {access.map((a) => (
                <div key={a.key} className="flex gap-4 border-b border-hair py-3 last:border-0">
                  <dt className="ds-caption w-18 shrink-0 font-semibold text-sub">{t(`accessibility.${a.key}`)}</dt>
                  <dd className="ds-body-2 min-w-0 whitespace-pre-line">{a.text}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <Nearby contentId={place.contentId} en={en} />

        {/* 공공누리는 제1 · 제3유형 모두 출처표시가 필수다. 라벨을 붙여 출처를 적었다는 것이 화면에서 보이게 한다 */}
        <section aria-labelledby="source" className="mt-8">
          <h2 id="source" className="ds-caption font-semibold text-ink">
            {t("source.label")}
          </h2>
          {photoSource && <p className="ds-caption text-sub">{t(`source.${photoSource}`)}</p>}
          <p className="ds-caption text-sub">{t(`source.${restSource}`)}</p>
        </section>
      </div>

      {/* 지도는 구글맵으로 넘긴다 — 외국인 사용자에게 카카오맵은 설치돼 있지 않은 앱이다. 길찾기는 구글맵 안에서 이어간다 */}
      <div className="screen sticky bottom-0 mt-6 flex gap-3 border-t border-hair bg-page pt-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
        <a
          href={googleMapsUrl(place.nameKo)}
          target="_blank"
          rel="noopener noreferrer"
          className="ds-title-2 flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-line text-ink active:bg-surface"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="size-4.5" aria-hidden>
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {t("map")}
          <span className="sr-only">({t("newWindow")})</span>
        </a>
        {/* 저장은 이 버튼 한 곳이다. 사진 위에 또 두면 같은 일을 두 번 배운다 */}
        <button
          type="button"
          onClick={() => toggle(place.contentId)}
          aria-pressed={saved}
          className="ds-title-2 flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-white active:bg-primary-press"
        >
          <svg
            viewBox="0 0 24 24"
            fill={saved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.9}
            strokeLinejoin="round"
            className="size-4.5"
            aria-hidden
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
          {t(saved ? "saved" : "save")}
        </button>
      </div>
    </article>
  );
}

/** 관람 순서는 뺀다 — 120곳 중 119곳이 도슨트 자세히 본문의 문장과 같아 바로 위 문단을 되풀이한다 */
const TIP_KEYS = ["photo", "caution"] as const;

/** 이 분 수까지는 걸어갈 거리로 적는다. 넘으면 직선거리 km — 도보 40분을 권하지 않는다 */
const WALK_MAX_MIN = 20;

/** 섹션 제목으로 스크롤하고 포커스를 옮긴다. 스크린리더도 같은 자리로 간다 */
function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  el.focus({ preventScroll: true });
}

/** 함께 둘러볼 곳 — 비었거나 불러오지 못하면 섹션째 그리지 않는다 */
function Nearby({ contentId, en }: { contentId: string; en: boolean }) {
  const t = useTranslations("placeDetail");
  const [places, setPlaces] = useState<NearbyPlace[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl(`/api/place/nearby?contentId=${encodeURIComponent(contentId)}&limit=3`))
      .then((res) => (res.ok ? (res.json() as Promise<NearbyPlace[]>) : []))
      .then((list) => {
        if (!cancelled) setPlaces(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [contentId]);

  if (places.length === 0) return null;

  return (
    <section className="mt-6 border-t border-hair pt-6">
      <h2 className="ds-title-1">{t("nearbyTitle")}</h2>
      <ul className="mt-2">
        {places.map((p) => {
          const line = en ? p.descEn : p.placeDesc;
          return (
            <li key={p.contentId} className="border-b border-hair last:border-0">
              <Link href={`/place/${p.contentId}`} className="flex min-h-12 items-center gap-3 py-3 active:bg-surface">
                <span className="relative size-13 shrink-0 overflow-hidden rounded bg-surface">
                  {p.firstImage && (
                    <Image src={secureImageUrl(p.firstImage)} alt="" fill sizes="52px" className="object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="ds-body-2 block font-semibold">{en ? (p.nameEn ?? p.nameKo) : p.nameKo}</span>
                  {line && <span className="ds-caption mt-0.5 block truncate text-sub">{line}</span>}
                </span>
                <span className="ds-caption shrink-0 font-bold text-ink tabular-nums">
                  {p.distanceMin <= WALK_MAX_MIN
                    ? t("walkAbout", { m: p.distanceMin })
                    : t("distanceKm", { km: ((p.distanceMin * 80) / 1000).toFixed(1) })}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** "부산종합관광안내소 051-253-8253" → "051-253-8253". 번호 모양이 없으면 전화 걸기를 붙이지 않는다 */
function telNumber(text: string | null): string | null {
  return text?.match(/0\d{1,2}-\d{3,4}-\d{4}|1\d{3}-\d{4}/)?.[0] ?? null;
}

/** 이 글자 수를 넘는 영업시간 · 휴무일은 반 칸에 넣으면 여러 줄로 길어진다 */
const WIDE_AT = 40;

function Fact({
  label,
  value,
  tel,
  note,
  onPress,
  wide = false,
}: {
  label: string;
  value: string | null;
  tel?: string | null;
  /** 값 아래 작은 설명 — 반려동물 동반 조건 */
  note?: string | null;
  /** 한 줄 전체 폭. 긴 문단이라 굵기도 한 단 낮춘다 */
  wide?: boolean;
  /** 값을 눌러 아래 섹션으로 간다 */
  onPress?: () => void;
}) {
  const t = useTranslations("placeDetail");

  return (
    <div className={`min-w-0 ${wide ? "col-span-2" : ""}`}>
      <dt className="ds-caption font-semibold text-sub">{label}</dt>
      <dd className={`ds-body-2 mt-1 whitespace-pre-line ${wide ? "" : "font-semibold"}`}>
        {value === null ? (
          <>
            <span className="text-line" aria-hidden>
              —
            </span>
            <span className="sr-only">{t("facts.none")}</span>
          </>
        ) : onPress ? (
          <button type="button" onClick={onPress} className="text-left underline decoration-line underline-offset-4">
            {value}
          </button>
        ) : tel ? (
          <a href={`tel:${tel}`} className="underline decoration-line underline-offset-4">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
      {note && <dd className="ds-caption mt-1 text-sub">{note}</dd>}
    </div>
  );
}

/**
 * 사진 갤러리 — 화면 끝까지 채우고, 버튼은 사진 위에 흰 원으로 올린다.
 *
 * 흰 원 위 먹색 아이콘이라 사진 밝기와 무관하게 읽힌다. 목록 행의 스크림 방식은
 * 22px 아이콘 하나를 위한 것이라, 48px 버튼 두 개를 올리는 여기엔 맞지 않는다.
 */
function Hero({
  images,
  name,
  onBack,
}: {
  images: string[];
  name: string;
  onBack: () => void;
}) {
  const t = useTranslations("placeDetail");

  return (
    <PhotoSwipe images={images} name={name} sizes="100vw" className="aspect-[4/3] w-full bg-surface">
      <div className="absolute inset-x-3 top-[calc(12px+env(safe-area-inset-top,0px))] flex justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label={t("back")}
          className="grid size-12 place-items-center rounded-full bg-white/95 text-ink transition-transform active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className="size-5" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>
    </PhotoSwipe>
  );
}
