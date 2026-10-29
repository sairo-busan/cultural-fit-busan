/**
 * 카카오 로컬 API 키워드 검색 (서버 전용 — 키를 쓴다).
 * 응답은 실시간 표시용이다. 원본을 저장하지 않는다(카카오 정책).
 */

export type KakaoPlace = {
  kakaoId: string;
  name: string;
  addr: string | null;
  category: string | null;
  x: number;
  y: number;
};

/** 부산 전역을 덮는 사각형(경도·위도) */
const BUSAN_RECT = "128.76,34.88,129.32,35.40";

export async function searchKakao(query: string, size: number): Promise<KakaoPlace[]> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) throw new Error("KAKAO_REST_API_KEY 없음");

  const params = new URLSearchParams({ query, rect: BUSAN_RECT, size: String(size) });
  const res = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?${params}`, {
    headers: { Authorization: `KakaoAK ${key}` },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`카카오 로컬 ${res.status}`);

  const docs: {
    id: string;
    place_name: string;
    road_address_name?: string;
    address_name?: string;
    category_name?: string;
    x: string;
    y: string;
  }[] = (await res.json()).documents ?? [];

  return docs.map((d) => ({
    kakaoId: d.id,
    name: d.place_name,
    addr: d.road_address_name || d.address_name || null,
    // "음식점 > 일식 > 우동" → "우동"
    category: d.category_name?.split(" > ").at(-1) ?? null,
    x: Number(d.x),
    y: Number(d.y),
  }));
}
