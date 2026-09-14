import { AppHeader } from "./AppHeader";
import { BottomTabBar } from "./BottomTabBar";

/**
 * 하단 탭 세 화면이 공유하는 껍데기 — 로고 헤더 · 좌우 여백 · 탭바.
 *
 * 데이터를 모르는 층이라 로딩 상태가 없다. 그래서 본문이 스켈레톤으로 바뀌어도
 * 헤더와 탭바는 깜빡이지 않는다.
 *
 * `pb-20` 은 고정된 탭바 높이만큼 목록 끝을 띄우는 값이다. 탭바 자체가 안전영역
 * 인셋을 따로 먹으므로 여기서 더하지 않는다.
 */
export function TabScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col pb-20">
      <AppHeader logo />
      <div className="screen flex-1">{children}</div>
      <BottomTabBar />
    </div>
  );
}

/**
 * 화면 제목 줄.
 *
 * `ScreenTitle`·`SectionHeader` 가 여기 있는 이유 — 본문과 스켈레톤이 같은 골격을
 * 그리는데, 마크업을 양쪽에 복제하면 한쪽만 고쳐도 **타입 에러도 테스트 실패도
 * 나지 않고** 조용히 어긋난다. 정적인 뼈대는 한 곳에서만 정의한다.
 */
export function ScreenTitle({
  children,
  aside,
}: {
  children: React.ReactNode;
  /** 제목 오른쪽 — 개수처럼 데이터에서 오는 것 */
  aside?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-[--gutter] pt-3">
      <h1 className="ds-display">{children}</h1>
      {aside}
    </div>
  );
}

/** 목록 위 구분선 + 섹션 제목. 오른쪽엔 정렬 기준처럼 짧은 설명이 붙는다 */
export function SectionHeader({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mx-[--gutter] mt-6 flex items-baseline justify-between gap-3 border-t border-ink pt-4">
      <h2 className="ds-title-1">{children}</h2>
      {aside && <span className="ds-caption shrink-0 text-sub">{aside}</span>}
    </div>
  );
}
