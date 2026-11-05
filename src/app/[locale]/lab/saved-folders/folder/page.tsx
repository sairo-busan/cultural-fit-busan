import { Suspense } from "react";
import { FolderDetail } from "../FolderScreens";

/** 주소의 `?id=` 를 읽으므로 정적 export 에서는 클라이언트에서 그린다 */
export default function SavedFolderPage() {
  return (
    <Suspense>
      <FolderDetail />
    </Suspense>
  );
}
