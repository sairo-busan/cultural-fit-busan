"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { EmptyState } from "@/components/common/EmptyState";
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
  const name = locale === "en" ? (place.nameEn ?? place.nameKo) : place.nameKo;

  return (
    <article className="screen pt-safe-header pb-12">
      <h1 className="ds-headline mt-6">{name}</h1>
    </article>
  );
}
