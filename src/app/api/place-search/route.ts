import { NextRequest, NextResponse } from "next/server";
import { searchKakao } from "@/lib/kakaoLocal";

/**
 * GET /api/place-search?q=[&id=]
 * 부산 안 장소 이름 검색(lab/link-save 직접 찾기). 카카오 키를 숨기려는 프록시다.
 * `id` 를 주면 그 카카오 장소 하나만 돌려준다 — 카카오에 id 조회가 없어, 저장해 둔 이름으로 다시 찾는다.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length > 50) {
    return NextResponse.json({ error: "q 는 1~50자여야 합니다" }, { status: 400 });
  }

  const id = request.nextUrl.searchParams.get("id");

  try {
    const places = await searchKakao(q, id ? 15 : 10);
    if (!id) return NextResponse.json(places);
    const place = places.find((p) => p.kakaoId === id);
    return place
      ? NextResponse.json(place)
      : NextResponse.json({ error: "장소를 찾을 수 없습니다" }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: "장소 검색 실패", detail: (error as Error).message },
      { status: 502 },
    );
  }
}
