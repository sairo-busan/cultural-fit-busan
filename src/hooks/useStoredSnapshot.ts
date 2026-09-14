"use client";

import { useSyncExternalStore } from "react";

/**
 * localStorage 값을 하이드레이션 안전하게 읽는다.
 *
 * 지연 초기화(`useState(() => localStorage...)`)로 읽으면 첫 렌더부터 클라이언트
 * 값을 써서 서버 HTML 과 어긋난다. `useSyncExternalStore` 는 첫 렌더에
 * `serverValue` 를 쓰고 하이드레이션이 끝난 뒤 실제 값으로 다시 그린다.
 *
 * `read` 는 매 렌더 `Object.is` 로 비교되므로 원시값만 돌려줘야 한다 —
 * 객체를 만들어 돌려주면 렌더가 멈추지 않는다.
 */
const NO_SUBSCRIBE = () => () => {};

export function useStoredSnapshot<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(NO_SUBSCRIBE, read, () => serverValue);
}
