"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/common/AppHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { useRouter } from "@/i18n/navigation";

/** 화면이 그리다가 터지면 이 화면으로 바뀐다. 헤더 · 탭바도 같이 걷히므로 뒤로가기를 직접 그린다 */
export default function ScreenError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("screenError");
  const router = useRouter();

  useEffect(() => {
    console.error("[ScreenError]", error);
  }, [error]);

  const back = () => (window.history.length > 1 ? router.back() : router.push("/feed"));

  return (
    <>
      <AppHeader onBack={back} />
      <div className="screen flex min-h-[70dvh] items-center justify-center">
        <EmptyState title={t("title")} body={t("body")} onAction={retry} actionLabel={t("action")} />
      </div>
    </>
  );
}
