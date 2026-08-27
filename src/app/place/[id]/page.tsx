"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/common/AppHeader";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { findRecommendedById, findPlaceById } from "@/data/mock-places";
import type { Place } from "@/types/place";

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

  const noise = place.noiseLevel ?? 0;
  const english = place.englishSupport ?? 0;
  const local = place.localDepth ?? 0;
  const alternatives = (place.alternativeIds ?? [])
    .map((altId) => findPlaceById(altId))
    .filter((item): item is Place => item !== undefined);

  return (
    <div className="min-h-full pb-[40px]">
      <AppHeader
        onBack={() => router.back()}
        logo
        onMenu={() => {/* S05 전체 메뉴 — W2 구현 예정 */}}
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

      {/* BEFORE YOU GO */}
      {place.tipHeadline && (
        <>
          <section className="px-[20px] pt-[20px] pb-[20px]">
            <div className="rounded-[12px] bg-surface px-[16px] py-[16px]">
              <p className="mb-[10px] text-[11px] font-light tracking-wider text-accent uppercase">
                BEFORE YOU GO
              </p>
              <p className="mb-[8px] text-[16px] font-normal text-foreground">
                {place.tipHeadline}
              </p>
              {place.pro && (
                <p className="text-[13px] font-light leading-relaxed text-sub-text">
                  {place.pro}
                </p>
              )}
              <p className="mt-[12px] text-[11px] font-light text-muted">
                자체 태깅 · {place.tipType === "etiquette" ? "에티켓 기준" : "예약 운영 방식 기준"}
              </p>
            </div>
          </section>
          <Divider />
        </>
      )}

      {/* 대안 장소 */}
      {alternatives.length > 0 && (
        <>
          <section className="px-[20px] pt-[20px] pb-[20px]">
            <p className="mb-[16px] text-[13px] font-light text-muted">
              이곳 대신 갈 만한 곳
            </p>
            <div className="flex flex-col gap-[16px]">
              {alternatives.map((alt) => (
                <Link
                  key={alt.contentId}
                  href={`/place/${alt.contentId}`}
                  className="flex items-center gap-[12px]"
                >
                  <div className="relative size-[56px] shrink-0 overflow-hidden rounded-[8px] bg-surface">
                    {alt.firstImage ? (
                      <Image
                        src={alt.firstImage}
                        alt={alt.title}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="h-full w-full bg-border" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-normal text-foreground">
                      {alt.title}
                    </p>
                    <p className="text-[12px] font-light text-sub-text">
                      {alt.pro ?? alt.overview?.slice(0, 30)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
          <Divider />
        </>
      )}

      {/* 지금 이곳은 — 실시간 막대 4축 */}
      <section className="px-[20px] pt-[20px] pb-[20px]">
        <div className="mb-[20px] flex items-baseline justify-between">
          <span className="text-[13px] font-light text-muted">지금 이곳은</span>
          <span className="text-[11px] font-light text-muted">
            {new Date().getHours()}:{String(new Date().getMinutes()).padStart(2, "0")} 기준
          </span>
        </div>
        <BarRow
          label="혼잡도"
          value={place.crowdLevel ?? 0}
          status={place.crowdLevel && place.crowdLevel <= 2 ? "한산한 편" : "혼잡한 편"}
          note={`${place.crowdCalm ?? ""}이 가장 여유롭습니다`}
        />
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
        <BarRow
          label="거리"
          value={place.distanceMin ? Math.max(1, 5 - Math.floor(place.distanceMin / 10)) : 5}
          status={place.distanceMin ? `도보 ${place.distanceMin}분` : "위치 정보 없음"}
        />
      </section>

      <Divider />

      {/* 이 장소는 — 고정 3축 (소음도/예산/로컬) */}
      <section className="px-[20px] pt-[20px] pb-[20px]">
        <p className="mb-[20px] text-[13px] font-light text-muted">이 장소는</p>
        <BarRow
          label="소음도"
          value={noise}
          status={noise <= 2 ? "조용한 편" : "사람이 많은 편"}
        />
        <BarRow
          label="예산"
          value={place.spiceLevel === 0 ? 2 : 3}
          status={place.spiceLevel === 0 ? "음료 수준" : "1인 2만원 선"}
        />
        <BarRow
          label="로컬"
          value={local}
          status={local >= 4 ? "현지인 분위기" : "관광객 중심"}
        />
      </section>

      <Divider />

      {/* 이용 방법 */}
      {place.howToUse && place.howToUse.length > 0 && (
        <>
          <section className="px-[20px] pt-[20px] pb-[20px]">
            <div className="mb-[16px] flex items-center gap-[8px]">
              <span className="flex size-[20px] items-center justify-center text-[11px] font-light text-accent">
                i
              </span>
              <span className="text-[14px] font-normal text-foreground">
                이용 방법
              </span>
            </div>
            <div className="flex flex-col gap-[16px]">
              {place.howToUse.map((step, stepIndex) => (
                <div key={stepIndex} className="flex gap-[12px]">
                  <span className="mt-[2px] flex size-[24px] shrink-0 items-center justify-center rounded-full bg-accent/10 text-[12px] font-normal text-accent">
                    {stepIndex + 1}
                  </span>
                  <p className="text-[13px] font-light leading-relaxed text-foreground">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <Divider />
        </>
      )}

      {/* 방문객 실제 후기 */}
      {(place.reviewGood || place.reviewBad || place.reviewTip) && (
        <>
          <section className="px-[20px] pt-[20px] pb-[20px]">
            <div className="mb-[16px] flex items-center gap-[8px]">
              <span className="flex size-[20px] items-center justify-center text-[11px] font-light text-accent">
                ii
              </span>
              <span className="text-[14px] font-normal text-foreground">
                방문객 실제 후기
              </span>
            </div>
            <div className="flex flex-col gap-[16px]">
              {place.reviewGood && (
                <ReviewItem label="좋았던 점" text={place.reviewGood} />
              )}
              {place.reviewBad && (
                <ReviewItem label="아쉬운 점" text={place.reviewBad} />
              )}
              {place.reviewTip && (
                <ReviewItem label="알아두기" text={place.reviewTip} />
              )}
            </div>
          </section>
          <Divider />
        </>
      )}

      {/* 기본 정보 */}
      <section className="px-[20px] pt-[20px] pb-[20px]">
        <div className="mb-[16px] flex items-center gap-[8px]">
          <span className="flex size-[20px] items-center justify-center text-[11px] font-light text-accent">
            iii
          </span>
          <span className="text-[14px] font-normal text-foreground">
            기본 정보
          </span>
        </div>
        <div className="flex flex-col gap-[12px]">
          {place.parking && (
            <InfoRow label="주차" text={place.parking} />
          )}
          <InfoRow
            label="영어"
            text={english >= 3 ? "안내 표지와 발권기 영문 병기" : "영어 소통 어려움"}
          />
          <InfoRow
            label="혼잡"
            text={place.crowdPeak ? `${place.crowdPeak} 대기 길어짐` : "정보 없음"}
          />
        </div>
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

function ReviewItem({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="mb-[4px] text-[12px] font-normal text-accent">{label}</p>
      <p className="text-[13px] font-light leading-relaxed text-foreground">
        {text}
      </p>
    </div>
  );
}

function InfoRow({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex gap-[16px]">
      <span className="w-[40px] shrink-0 text-[13px] font-normal text-accent">
        {label}
      </span>
      <span className="text-[13px] font-light text-foreground">{text}</span>
    </div>
  );
}
