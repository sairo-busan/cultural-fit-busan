"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  districtLabel,
  districtLabelEn,
  isArchivePhoto,
  secureImageUrl,
} from "@/lib/placeDisplay";
import type { Locale } from "@/i18n/routing";
import type { PlaceDetail } from "@/lib/placeDetail";
import type { DocentAudio } from "./useDocentAudio";

type Length = "simple" | "detail";

/** 놓치기 쉬운 것 — 관람 순서는 뺀다(S20 과 같은 기준) */
const TIP_KEYS = ["photo", "caution"] as const;

/**
 * S23 음성 도슨트 — 오른쪽에서 들어오는 전체 화면.
 *
 * 브라우저 기본 `<dialog>` 라 포커스 가두기 · Esc · 닫을 때 포커스 되돌리기가 따라온다.
 * 닫으면 뒤의 S20 은 그대로 남아 스크롤 위치가 유지된다.
 */
export function Docent({
  place,
  open,
  onClose,
  audio: player,
}: {
  place: PlaceDetail;
  open: boolean;
  onClose: () => void;
  audio: DocentAudio;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const locale = useLocale() as Locale;
  const t = useTranslations("docent");
  const tDetail = useTranslations("placeDetail");
  const en = locale === "en";

  const [length, setLength] = useState<Length>("simple");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const scripts: Record<Length, string | null> = en
    ? { simple: place.guideSimpleEn, detail: place.guideDetailEn }
    : { simple: place.guideSimpleKo, detail: place.guideDetailKo };
  const audios: Record<Length, string | null> = en
    ? { simple: place.audioUrlSimpleEn, detail: place.audioUrlDetailEn }
    : { simple: place.audioUrlSimpleKo, detail: place.audioUrlDetailKo };

  // 두 원고가 다 있을 때만 전환을 그린다 — 한 가지뿐이면 있는 쪽을 보여준다
  const both = Boolean(scripts.simple && scripts.detail);
  const shown: Length = scripts[length]
    ? length
    : scripts.simple
      ? "simple"
      : "detail";
  const script = scripts[shown];
  const audio = audios[shown];

  const name = en ? (place.nameEn ?? place.nameKo) : place.nameKo;
  const district = en
    ? districtLabelEn(place.addr1)
    : districtLabel(place.addr1);
  const type = place.placeType
    ? en
      ? tDetail.has(`placeType.${place.placeType}`)
        ? tDetail(`placeType.${place.placeType}`)
        : null
      : place.placeType
    : null;

  const tips = en ? place.tipsEn : place.tipsKo;
  const tipList = TIP_KEYS.flatMap((key) =>
    tips[key] ? [{ key, text: tips[key]! }] : [],
  );

  const photo = place.images[0] ?? null;

  const playingThis = Boolean(audio && player.src === audio);
  // 재생 전에도 전체 길이를 보인다 — 음원 머리(메타데이터)만 받아 온다
  const previewTotal = useAudioDuration(open ? audio : null);
  const total = playingThis && player.total > 0 ? player.total : previewTotal;

  const paragraphs = script ? script.trim().split(/\n\s*\n/) : [];
  // 다른 길이의 음원이 돌고 있으면 이 스크립트는 굵게 하지 않는다
  const reading =
    audio && player.src === audio
      ? readingIndex(paragraphs, player.at, player.total)
      : -1;

  return (
    <dialog
      ref={ref}
      aria-labelledby="docent-name"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="slide-panel m-0 h-full max-h-none w-full max-w-none overscroll-contain bg-page text-ink"
    >
      <div className="flex h-full flex-col overflow-y-auto overscroll-contain">
        <div className="screen pt-safe-header flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="-ml-3 grid size-12 place-items-center text-sub active:bg-surface"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.9}
              className="size-5"
              aria-hidden
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="ds-label text-sub">{t("eyebrow")}</span>
          <span className="size-12" aria-hidden />
        </div>

        <div className="screen pb-safe-cta">
          <h1 id="docent-name" className="ds-title-1 mt-2">
            {name}
          </h1>
          {(district || type) && (
            <p className="ds-body-2 mt-1 text-sub">
              {[district, type].filter(Boolean).join(" · ")}
            </p>
          )}

          {both && (
            <div
              className="mt-5 flex gap-1 rounded-xl bg-surface p-1"
              role="group"
              aria-label={t("lengthGroup")}
            >
              {(["simple", "detail"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    // 간단히 · 자세히는 서로 다른 원고다 — 어느 쪽으로 바꾸든 듣던 음성은 멈춘다
                    if (key !== shown) player.stop();
                    setLength(key);
                  }}
                  aria-pressed={shown === key}
                  className={`ds-title-2 min-h-11 flex-1 rounded-lg ${
                    shown === key ? "bg-page text-ink" : "text-sub"
                  }`}
                >
                  {t(`length.${key}`)}
                </button>
              ))}
            </div>
          )}

          {/* 음원이 없는 길이는 재생 줄만 빠지고 스크립트는 그대로 읽힌다 */}
          {audio && (
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => player.toggle(audio)}
                aria-label={t(
                  playingThis && player.playing ? "pause" : "play",
                  { length: t(`length.${shown}`) },
                )}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-white active:bg-primary-press"
              >
                <PlayIcon paused={!(playingThis && player.playing)} />
              </button>
              <div className="h-0.75 flex-1 rounded-full bg-hair" aria-hidden>
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: progressWidth(playingThis ? player : null) }}
                />
              </div>
              <span className="ds-caption shrink-0 text-sub tabular-nums">
                {clock(playingThis ? player.at : 0)} /{" "}
                {total > 0 ? clock(total) : "--:--"}
              </span>
            </div>
          )}

          {script && (
            <div className="mt-5 overflow-hidden rounded-xl bg-surface">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={
                    photo ? secureImageUrl(photo) : "/placeholder/place-4x3.svg"
                  }
                  alt=""
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                {/* 재생 중에는 읽는 문단만 진하게, 나머지는 흐리게 — 색만으로 가르지 않게 흐린 쪽도 대비 4.5:1 을 지킨다 */}
                {paragraphs.map((para, i) => (
                  <p
                    key={i}
                    className={`ds-body-2 whitespace-pre-line transition-colors not-first:mt-3 ${
                      reading < 0
                        ? ""
                        : i === reading
                          ? "font-semibold"
                          : "text-sub"
                    }`}
                  >
                    {para}
                  </p>
                ))}
              </div>
            </div>
          )}

          {tipList.length > 0 && (
            <section className="mt-6">
              <h2 className="ds-title-2">{tDetail("tipsTitle")}</h2>
              {tipList.map(({ key, text }) => (
                <div key={key} className="mt-3 flex gap-3">
                  <span
                    className="w-0.75 shrink-0 rounded-full bg-primary"
                    aria-hidden
                  />
                  <div>
                    <p className="ds-caption font-semibold text-sub">
                      {tDetail(`tips.${key}`)}
                    </p>
                    <p className="ds-body-2 mt-0.5">{text}</p>
                  </div>
                </div>
              ))}
            </section>
          )}

          <section aria-labelledby="docent-source" className="mt-8">
            <h2
              id="docent-source"
              className="ds-caption font-semibold text-ink"
            >
              {tDetail("source.label")}
            </h2>
            <p className="ds-caption text-sub">{t("source.script")}</p>
            {audio && (
              <p className="ds-caption text-sub">{t("source.audio")}</p>
            )}
            {photo && (
              <p className="ds-caption text-sub">
                {isArchivePhoto(photo)
                  ? tDetail("source.photoArchive")
                  : t("source.photoTour")}
              </p>
            )}
          </section>
        </div>
      </div>
    </dialog>
  );
}

/**
 * 지금 읽고 있는 문단 — 문단 글자 수 비율로 어림한다. 음원에 문장별 시각이 오면
 * 이 함수만 바꿔 끼운다(에린 요청 중).
 */
export function readingIndex(paragraphs: string[], at: number, total: number): number {
  if (paragraphs.length < 2 || total <= 0 || at <= 0) return -1;
  const chars = paragraphs.reduce((sum, p) => sum + p.length, 0);
  const ratio = Math.min(1, at / total);
  let seen = 0;
  for (const [i, para] of paragraphs.entries()) {
    seen += para.length;
    if (ratio <= seen / chars) return i;
  }
  return paragraphs.length - 1;
}

/** 음원 전체 길이 — 재생하지 않고 메타데이터만 읽는다 */
function useAudioDuration(src: string | null): number {
  const [meta, setMeta] = useState<{ src: string; total: number } | null>(null);

  useEffect(() => {
    if (!src) return;
    const el = new Audio();
    el.preload = "metadata";
    const onMeta = () => setMeta({ src, total: el.duration });
    el.addEventListener("loadedmetadata", onMeta);
    el.src = src;
    return () => {
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeAttribute("src");
      el.load();
    };
  }, [src]);

  return meta && meta.src === src ? meta.total : 0;
}

/** 83.4 → "1:23" */
export function clock(seconds: number): string {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** 진행 막대 폭 */
export function progressWidth(
  played: { at: number; total: number } | null,
): string {
  if (!played || played.total <= 0) return "0%";
  return `${Math.min(100, (played.at / played.total) * 100)}%`;
}

/** 재생 · 일시정지 아이콘 */
export function PlayIcon({ paused }: { paused: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
      {paused ? (
        <path d="M8 5v14l11-7z" />
      ) : (
        <path d="M7 5h4v14H7zm6 0h4v14h-4z" />
      )}
    </svg>
  );
}
