import { notFound } from "next/navigation";

/** 실험 화면은 LINK_LAB_ENABLED=true 인 환경(Development · Preview)에서만 연다 */
export default function SavedFoldersLayout({ children }: { children: React.ReactNode }) {
  if (process.env.LINK_LAB_ENABLED !== "true") notFound();
  return children;
}
