import { Suspense } from "react";
import { DataPreview } from "../DataPreview";

export default function SavedFoldersAllPage() {
  return (
    <Suspense>
      <DataPreview view="all" />
    </Suspense>
  );
}
