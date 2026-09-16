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
 *
 * 폭은 탭바와 같은 `max-w-screen-sm` — 넓은 화면에서 헤더 · 본문 · 탭바가 한 기둥에 선다.
 */
export function TabScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-screen-sm flex-col pb-20">
      <AppHeader logo />
      <div className="screen flex-1">{children}</div>
      <BottomTabBar />
    </div>
  );
}

/**
 * 화면 제목 줄.
 *
 * `ScreenTitle`·`ListHeader` 가 여기 있는 이유 — 본문과 스켈레톤이 같은 골격을
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

/** 목록 바로 위 조건 줄. 왼쪽은 지금 상황(날씨), 오른쪽은 정렬 기준 */
export function ListHeader({
  children,
  aside,
}: {
  children?: React.ReactNode;
  aside: React.ReactNode;
}) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3 px-[--gutter]">
      <div className="flex min-w-0 items-center gap-1 text-sub">{children}</div>
      <span className="ds-caption shrink-0 font-semibold text-sub">{aside}</span>
    </div>
  );
}
