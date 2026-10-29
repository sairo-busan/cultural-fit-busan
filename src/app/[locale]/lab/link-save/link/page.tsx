import { Suspense } from "react";
import { LinkDetail } from "./LinkDetail";

/** 주소의 `?url=` 을 읽으므로 정적 export 에서는 클라이언트에서 그린다 */
export default function LinkDetailPage() {
  return (
    <Suspense>
      <LinkDetail />
    </Suspense>
  );
}
