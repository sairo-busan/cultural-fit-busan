import { Suspense } from "react";
import { DataPreview } from "./DataPreview";

export default function SavedFoldersPage() {
  return (
    <Suspense>
      <DataPreview view="main" />
    </Suspense>
  );
}
