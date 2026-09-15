"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { EmptyState } from "@/components/common/EmptyState";
import { SaveButton } from "@/components/place/SaveButton";
import { useSavedPlaces } from "@/hooks/useSavedPlaces";
import { useStoredSnapshot } from "@/hooks/useStoredSnapshot";
import { useRouter } from "@/i18n/navigation";
import { districtLabel, districtLabelEn, reasonWithoutLead, secureImageUrl } from "@/lib/placeDisplay";
import { readCf8Code } from "@/lib/storage";
import { PlaceSkeleton } from "./PlaceSkeleton";
import type { Locale } from "@/i18n/routing";
import type { PlaceDetail } from "@/types/place";

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

  const { ids: savedIds, toggle } = useSavedPlaces();
  const cf8Code = useStoredSnapshot(readCf8Code, null);

  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoad({ status: "loading" });
      try {
        const res = await fetch(`/api/place/${encodeURIComponent(id)}`);
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

  if (load.status === "loading") return <PlaceSkeleton />;

  if (load.status === "notFound") {
    return (
      <div className="screen pt-safe-header">
        <EmptyState
          title={t("notFound.title")}
          body={t("notFound.body")}
          actionHref="/feed"
          actionLabel={t("notFound.action")}
        />
      </div>
    );
  }

  if (load.status === "failed") {
    return (
      <div className="screen pt-safe-header">
        <EmptyState
          title={t("loadFailed.title")}
          body={t("loadFailed.body")}
          onAction={retry}
          actionLabel={t("loadFailed.action")}
        />
      </div>
    );
  }

  const { place } = load;
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

  return (
    <article className="pb-12">
      <Hero
        images={place.images}
        name={name}
        saved={savedIds.has(place.contentId)}
        onToggleSave={() => toggle(place.contentId)}
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
          <Fact label={t("facts.rain")} value={place.weatherType ? t(`rain.${place.weatherType}`) : null} />
          <Fact
            label={t("facts.pet")}
            value={place.petAllowed === null ? null : t(place.petAllowed ? "pet.yes" : "pet.no")}
            note={!en && place.petAllowed ? place.petCondition : null}
          />
          <Fact label={t("facts.phone")} value={place.phone} tel={telNumber(place.phone)} />
          <Fact
            label={t("facts.accessibility")}
            value={place.accessibility.length > 0 ? t("facts.accessibilityYes") : null}
          />
        </dl>
      </div>
    </article>
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
  wide = false,
}: {
  label: string;
  value: string | null;
  tel?: string | null;
  /** 값 아래 작은 설명 — 반려동물 동반 조건 */
  note?: string | null;
  /** 한 줄 전체 폭. 긴 문단이라 굵기도 한 단 낮춘다 */
  wide?: boolean;
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
  saved,
  onToggleSave,
}: {
  images: string[];
  name: string;
  saved: boolean;
  onToggleSave: () => void;
}) {
  const t = useTranslations("placeDetail");
  const tPlace = useTranslations("place");
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  // 링크를 직접 열고 들어오면 돌아갈 기록이 없다
  const back = () => (window.history.length > 1 ? router.back() : router.push("/feed"));

  /** 스와이프가 없는 입력(키보드 · 마우스)을 위한 한 장씩 넘기기 */
  const go = (to: number) => {
    const el = scroller.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: to * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };

  const hasMany = images.length > 1;
  const arrow =
    "absolute top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-ink/65 text-white pointer-fine:grid";

  return (
    // 포커스 테두리는 사진 위에 겹쳐 그린다. 전역 테두리는 바깥쪽이라 화면 끝에서 잘린다
    <div className="relative aspect-[4/3] w-full bg-surface has-[[role=region]:focus-visible]:after:pointer-events-none has-[[role=region]:focus-visible]:after:absolute has-[[role=region]:focus-visible]:after:inset-0 has-[[role=region]:focus-visible]:after:shadow-[inset_0_0_0_3px_#fff,inset_0_0_0_5px_var(--ink)] has-[[role=region]:focus-visible]:after:content-['']">
      {images.length > 0 ? (
        <div
          ref={scroller}
          tabIndex={hasMany ? 0 : undefined}
          role="region"
          aria-label={t("photos", { name })}
          className="flex size-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] focus-visible:outline-none! [&::-webkit-scrollbar]:hidden"
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          onKeyDown={(e) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
            e.preventDefault();
            go(Math.min(images.length - 1, Math.max(0, index + (e.key === "ArrowRight" ? 1 : -1))));
          }}
        >
          {images.map((src, i) => (
            <div key={src} className="relative size-full shrink-0 snap-center">
              <Image
                src={secureImageUrl(src)}
                alt={i === 0 ? name : ""}
                fill
                sizes="100vw"
                className="object-cover"
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid size-full place-items-center">
          <span className="ds-serif ds-body-2 italic text-sub">{tPlace("noPhoto")}</span>
        </div>
      )}

      <div className="absolute inset-x-3 top-[calc(12px+env(safe-area-inset-top,0px))] flex justify-between">
        <button
          type="button"
          onClick={back}
          aria-label={t("back")}
          className="grid size-12 place-items-center rounded-full bg-white/95 text-ink transition-transform active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className="size-5" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <SaveButton
          saved={saved}
          onToggle={onToggleSave}
          placeName={name}
          onScrim={false}
          className="rounded-full bg-white/95"
        />
      </div>

      {/* 마우스 · 트랙패드에서만. 터치 기기에서는 스와이프가 있고 목업에도 없다 */}
      {hasMany && index > 0 && (
        <button type="button" onClick={() => go(index - 1)} aria-label={t("prevPhoto")} className={`${arrow} left-3`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className="size-5" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
      {hasMany && index < images.length - 1 && (
        <button type="button" onClick={() => go(index + 1)} aria-label={t("nextPhoto")} className={`${arrow} right-3`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} className="size-5" aria-hidden>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}

      {hasMany && (
        <span className="absolute right-3 bottom-3 rounded-full bg-ink/65 px-3 py-1 text-[11px] font-semibold text-white tabular-nums">
          {t("photoCount", { n: index + 1, total: images.length })}
        </span>
      )}
    </div>
  );
}
