import { apiUrl } from "@/lib/apiBase";
import { PlaceContent } from "./PlaceContent";

/**
 * 앱 빌드에서만 장소 수만큼 페이지를 미리 만든다 — 정적 export 에는 요청 시 생성이 없다.
 * 웹은 빈 배열이라 지금까지처럼 요청 때 만든다.
 *
 * 빌드 뒤에 생긴 장소는 앱에 페이지가 없다. 장소를 늘리면 앱을 다시 빌드한다.
 */
export async function generateStaticParams() {
  if (process.env.BUILD_TARGET !== "app") return [];

  const res = await fetch(apiUrl("/api/recommend?limit=120"));
  if (!res.ok) throw new Error(`장소 목록을 받지 못했습니다: ${res.status}`);

  const places = (await res.json()) as { contentId: string }[];
  return places.map((place) => ({ id: place.contentId }));
}

export default function PlaceDetailPage() {
  return <PlaceContent />;
}
