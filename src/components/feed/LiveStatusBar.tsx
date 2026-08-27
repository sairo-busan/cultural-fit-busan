// W2에서 날씨 API + GPS 연동 후 동적 데이터로 교체 예정

type LiveStatusBarProps = {
  weather: string;
  temperature: number;
  location: string;
};

export function LiveStatusBar({ weather, temperature, location }: LiveStatusBarProps) {
  return (
    <div className="mb-[16px] flex items-center gap-[10px] bg-surface px-[24px] py-[10px]">
      <span className="inline-block size-[6px] shrink-0 rounded-full bg-accent animate-live-pulse" />
      <p className="text-[12px] font-light text-sub-text">
        {weather} {temperature}° · {location} 기준
      </p>
    </div>
  );
}
