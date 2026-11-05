"use client";

import { AppHeader } from "@/components/common/AppHeader";

/** 가운데 제목이 있는 헤더. AppHeader 는 양쪽 칸만 받는다 */
export function FolderHeader({
  title,
  onBack,
  right,
}: {
  title?: string;
  onBack: () => void;
  right?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <AppHeader onBack={onBack} right={right} />
      {title && (
        <span className="ds-title-2 pointer-events-none absolute inset-x-16 bottom-3 truncate text-center leading-8">
          {title}
        </span>
      )}
    </div>
  );
}
