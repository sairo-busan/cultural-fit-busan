"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { AppHeader } from "@/components/common/AppHeader";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { findRecommendedById } from "@/data/mock-places";

/**
 * 9/15 QA — 이 파일이 main merge 중 통째로 삭제돼서 카드 클릭 시 404 났던 문제 수정.
 * BE-FEAT-011 리뷰로 뺀 옛 92번 시트 잔재 필드(noiseLevel·crowdLevel·tipHeadline·
 * howToUse·reviewGood 등)를 쓰던 섹션은 걷어냈다 — 어차피 그 필드들은 실데이터에서도
 * 항상 null이라 원래도 빈 화면이었다. 새 S20(BE-FEAT-013 기반, feat/s20-place-detail)이
 * 머지되면 이 파일 전체를 교체한다 — 소피에게 요청함.
 */
export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = params.id as string;
  const place = findRecommendedById(contentId);

  const [savedIds, setSavedIds] = useLocalStorage<string[]>("cfb_saved", []);
  const isSaved = savedIds.includes(contentId);

  function toggleSave() {
    setSavedIds(
      isSaved
        ? savedIds.filter((savedId) => savedId !== contentId)
        : [...savedIds, contentId],
    );
  }

  if (!place) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-[20px]">
        <p className="typo-body text-sub-text">장소를 찾을 수 없습니다</p>
        <button
          type="button"
          onClick={() => router.push("/feed")}
          className="mt-[16px] text-[13px] font-light text-accent underline underline-offset-2"
        >
          피드로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-[40px]">
      <AppHeader
        onBack={() => router.back()}
        logo
        onMenu={() => {/* S50 전체 메뉴 (구 S05) — W2 구현 예정 */}}
      />

      {/* 히어로 이미지 */}
      <div className="relative mx-[20px] aspect-[4/3] w-auto overflow-hidden rounded-[16px] bg-surface">
        {place.firstImage ? (
          <Image
            src={place.firstImage}
            alt={place.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface text-[12px] text-muted">
            이미지 없음
          </div>
        )}
      </div>

      {/* 장소 정보 */}
      <section className="px-[20px] pt-[24px] pb-[20px]">
        {place.placeType && (
          <p className="mb-[8px] text-[11px] font-light tracking-wider text-muted uppercase">
            {place.placeType} · {place.addr1.split(" ").slice(1, 2).join("")}
          </p>
        )}
        <h1 className="text-[24px] font-normal leading-tight text-foreground">
          {place.title}
        </h1>
        {place.titleEn && (
          <p className="mt-[4px] text-[14px] font-light text-sub-text">
            {place.titleEn}
          </p>
        )}
        <p className="mt-[8px] text-[12px] font-light text-muted">
          {place.addr1}
          {place.info[0] && ` · ${place.info[0].text}`}
        </p>
      </section>

      <Divider />

      {/* 매칭 섹션 */}
      <section className="px-[20px] pt-[20px] pb-[20px]">
        <div className="mb-[12px] flex items-baseline gap-[8px]">
          <span className="font-serif text-[28px] font-normal text-foreground">
            {place.fitScore}%
          </span>
          <span className="text-[16px] font-normal text-foreground">
            잘 맞아요
          </span>
        </div>
        <p className="mb-[16px] text-[12px] font-light text-muted">
          내 여행 스타일 기준
        </p>

        {/* 매칭 태그 */}
        <div className="mb-[12px] flex gap-[6px]">
          {place.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-surface px-[10px] py-[3px] text-[13px] font-light text-accent"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 개인화 설명 */}
        <p className="text-[14px] font-light leading-relaxed text-foreground">
          {place.reasons.join(" ")}
        </p>
      </section>

      <Divider />

      {/* 지금 이곳은 — 운영/날씨 */}
      <section className="px-[20px] pt-[20px] pb-[20px]">
        <div className="mb-[20px] flex items-baseline justify-between">
          <span className="text-[13px] font-light text-muted">지금 이곳은</span>
          <span className="text-[11px] font-light text-muted">
            {new Date().getHours()}:{String(new Date().getMinutes()).padStart(2, "0")} 기준
          </span>
        </div>
        <BarRow
          label="운영"
          value={4}
          status="영업 중"
          note={place.info[0]?.text ?? "운영시간 정보 없음"}
        />
        <BarRow
          label="날씨"
          value={place.weatherType === "indoor" ? 5 : 4}
          status={place.weatherType === "indoor" ? "비 가림 있음" : "야외"}
          note="맑음 27° · 야외 활동 좋음"
        />
      </section>

      <Divider />

      {/* 출처 */}
      <p className="px-[20px] pt-[16px] pb-[24px] text-[11px] font-light leading-relaxed text-muted">
        기본 정보 · 영업시간 · 이미지 — 한국관광공사 OpenAPI
        <br />
        실체험 요약 — 공개 리뷰 큐레이션 · 2026.08
      </p>

      {/* 하단 액션: 저장 / 길찾기 */}
      <div className="sticky bottom-0 flex gap-[12px] bg-white/80 px-[20px] pb-[20px] pt-[12px] backdrop-blur-md">
        <button
          type="button"
          onClick={toggleSave}
          className="flex-1 rounded-[12px] border border-border py-[14px] text-center text-[14px] font-light text-foreground transition-colors active:bg-surface"
        >
          {isSaved ? "저장됨" : "저장"}
        </button>
        <a
          href={`https://map.kakao.com/link/to/${place.title},${place.mapY},${place.mapX}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-[12px] bg-accent py-[14px] text-center text-[14px] font-light text-white transition-colors active:opacity-90"
        >
          길찾기
        </a>
      </div>
    </div>
  );
}

// === 내부 컴포넌트 ===

function Divider() {
  return <div className="mx-[20px] h-px bg-border" />;
}

function DotBar({ value }: { value: number }) {
  return (
    <div className="flex gap-[6px]">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={`h-[8px] w-[20px] rounded-full ${index < value ? "bg-accent" : "bg-border"}`}
        />
      ))}
    </div>
  );
}

function BarRow({
  label,
  value,
  status,
  note,
}: {
  label: string;
  value: number;
  status: string;
  note?: string;
}) {
  return (
    <div className="mb-[24px] last:mb-0">
      <div className="flex items-center gap-[16px]">
        <span className="w-[48px] shrink-0 text-[13px] font-normal text-foreground">
          {label}
        </span>
        <DotBar value={value} />
        <span className="text-[12px] font-light text-sub-text">{status}</span>
      </div>
      {note && (
        <p className="mt-[6px] pl-[64px] text-[11px] font-light text-muted">
          {note}
        </p>
      )}
    </div>
  );
}
