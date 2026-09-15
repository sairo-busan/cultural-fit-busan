import type { WeatherBucket } from "@/lib/kma";

/**
 * 날씨 3종 — `WeatherBucket` 과 1:1.
 *
 * 색을 넣지 않는다. 날씨는 상태 경고가 아니라 사실 전달이라, 노랑·파랑을 쓰면
 * "주의" 로 읽힌다. 기상청 응답이 없으면 이 아이콘을 그리지 않는다 —
 * 기본값을 두면 맑음으로 오해된다.
 */

const PATHS: Record<WeatherBucket, React.ReactNode> = {
  sunny: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M6 18l-1.4 1.4M19.4 4.6L18 6" />
    </>
  ),
  cloudy: (
    <path d="M17.5 18.5a4.5 4.5 0 0 0 .4-8.96 6 6 0 0 0-11.6 1.6A3.5 3.5 0 0 0 6.5 18.5z" />
  ),
  rainy: (
    <>
      <path d="M16.5 16a4.5 4.5 0 0 0 .4-8.96 6 6 0 0 0-11.6 1.6A3.5 3.5 0 0 0 5.5 16" />
      <path d="M8.5 18.5l-1 2.5M12.5 18.5l-1 2.5M16.5 18.5l-1 2.5" />
    </>
  ),
};

type WeatherIconProps = {
  weather: WeatherBucket;
  className?: string;
};

export function WeatherIcon({ weather, className }: WeatherIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      className={className ?? "size-5 shrink-0"}
      aria-hidden
    >
      {PATHS[weather]}
    </svg>
  );
}
