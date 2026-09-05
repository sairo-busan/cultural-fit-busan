"use client";

import { useRouter } from "next/navigation";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { AppHeader } from "@/components/common/AppHeader";
import { Chip } from "@/components/common/Chip";
import {
  TRIP_SECTIONS,
  TRIP_SETUP_COPY,
  CHILD_AGE_EXPANSION,
  PET_EXPANSION,
  DEFAULT_TRIP_SETUP,
  summaryLabels,
} from "@/data/tripSetup";
import { STORAGE_KEYS } from "@/lib/storage";
import type { TripSetup, ChipOption } from "@/types/trip";

/** 음식 제약에서 이걸 고르면 나머지가 해제된다 */
const FOOD_NONE = "none";

export function TripSetupPage() {
  const router = useRouter();
  const [setup, setSetup] = useLocalStorage<TripSetup>(
    STORAGE_KEYS.tripSetup,
    DEFAULT_TRIP_SETUP,
  );

  const labels = summaryLabels(setup);

  /** 복수 선택 토글 */
  const toggleMulti = (key: keyof TripSetup, value: string) => {
    const current = (setup[key] as string[]) ?? [];
    let next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    // 음식 제약 — "특별히 없어요"는 다른 선택과 공존하지 않는다
    if (key === "foodRestriction") {
      if (value === FOOD_NONE && !current.includes(FOOD_NONE)) {
        next = [FOOD_NONE];
      } else if (value !== FOOD_NONE) {
        next = next.filter((v) => v !== FOOD_NONE);
      }
    }

    const patch: Partial<TripSetup> = { [key]: next } as Partial<TripSetup>;

    // 트리거가 해제되면 하위 확장 값도 비운다
    if (key === "travelWith") {
      if (!next.includes(CHILD_AGE_EXPANSION.trigger)) patch.childAgeGroup = null;
      if (!next.includes(PET_EXPANSION.trigger)) patch.petTravelMode = null;
    }

    setSetup({ ...setup, ...patch });
  };

  /** 단일 선택 토글 — 같은 값을 다시 누르면 해제 */
  const toggleSingle = (key: keyof TripSetup, value: string) => {
    const current = setup[key];
    const next = current === value ? null : value;
    setSetup({ ...setup, [key]: next } as TripSetup);
  };

  const isSelected = (key: keyof TripSetup, value: string) => {
    const current: string[] | string | null = setup[key];
    return Array.isArray(current) ? current.includes(value) : current === value;
  };

  const handleSubmit = () => router.push("/feed");

  const handleSkip = () => {
    setSetup(DEFAULT_TRIP_SETUP);
    router.push("/feed");
  };

  const renderChips = (
    key: keyof TripSetup,
    options: readonly ChipOption[],
    multiple: boolean,
  ) => (
    <div className="flex flex-wrap gap-[8px]">
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          selected={isSelected(key, option.value)}
          onClick={() =>
            multiple
              ? toggleMulti(key, option.value)
              : toggleSingle(key, option.value)
          }
        />
      ))}
    </div>
  );

  /** 조건부 확장 블록 */
  const renderExpansion = (
    config: typeof CHILD_AGE_EXPANSION | typeof PET_EXPANSION,
    key: "childAgeGroup" | "petTravelMode",
  ) => {
    if (!setup.travelWith.includes(config.trigger as never)) return null;

    return (
      <div className="flex flex-col gap-[8px] rounded-[12px] bg-ds-surface px-[20px] py-[16px]">
        <p className="ds-title-2 text-ink">{config.title}</p>
        <p className="ds-caption text-gray-600">{config.helperText}</p>
        <div className="pt-[8px]">
          {renderChips(key, config.options, false)}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader onBack={() => router.push("/profile")} />

      {/* 선택 요약 고정 바 */}
      <div className="flex items-center gap-[12px] border-b border-gray-200 px-[24px] py-[12px]">
        <p className="ds-caption flex-1 truncate text-gray-600">
          {labels.length > 0 ? labels.join(" · ") : TRIP_SETUP_COPY.description}
        </p>
        {labels.length > 0 && (
          <span className="ds-caption shrink-0 text-ink">
            {TRIP_SETUP_COPY.summaryCount(labels.length)}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-[8px] px-[24px] pt-[32px]">
          <h1 className="ds-headline text-ink">{TRIP_SETUP_COPY.title}</h1>
          <p className="ds-body-1 text-gray-600">
            {TRIP_SETUP_COPY.description}
          </p>
        </div>

        <div className="flex flex-col gap-[32px] px-[24px] pt-[32px] pb-[32px]">
          {TRIP_SECTIONS.map((section) => (
            <div key={section.key} className="flex flex-col gap-[12px]">
              <div className="flex flex-col gap-[4px]">
                <p className="ds-title-2 text-ink">{section.title}</p>
                {section.helperText && (
                  <p className="ds-caption text-gray-500">
                    {section.helperText}
                  </p>
                )}
              </div>

              {renderChips(section.key, section.options, section.multiple)}

              {/* 함께하는 분 뒤에 조건부 확장 */}
              {section.key === "travelWith" && (
                <div className="flex flex-col gap-[12px] pt-[4px]">
                  {renderExpansion(CHILD_AGE_EXPANSION, "childAgeGroup")}
                  {renderExpansion(PET_EXPANSION, "petTravelMode")}
                </div>
              )}
            </div>
          ))}

          <p className="ds-caption text-gray-500">
            {TRIP_SETUP_COPY.footnote}
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="flex shrink-0 flex-col gap-[12px] px-[24px] pt-[16px] pb-[32px]">
        <button
          type="button"
          onClick={handleSubmit}
          className="ds-title-2 flex h-[52px] w-full items-center justify-center rounded-[12px] bg-ink text-white transition-all active:scale-[0.98]"
        >
          {TRIP_SETUP_COPY.primaryCta}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          className="ds-title-2 flex h-[52px] w-full items-center justify-center rounded-[12px] border border-gray-300 text-ink transition-all active:scale-[0.98]"
        >
          {TRIP_SETUP_COPY.secondaryCta}
        </button>
      </div>
    </div>
  );
}

export { TripSetupPage as default };
