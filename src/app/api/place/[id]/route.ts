import { NextRequest, NextResponse } from "next/server";
import { getPlaceDetail } from "@/lib/placeDetail";

/**
 * GET /api/place/[id]   (id = contentId)
 * S20 상세 화면용 — BE-FEAT-013 계약. 개인화 없음(하드필터·CF8 매칭은 목록 API 소관).
 */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/place/[id]">) {
  const { id } = await ctx.params;

  try {
    const detail = await getPlaceDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "장소를 찾을 수 없습니다" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      { error: "장소 상세 조회 실패", detail: (error as Error).message },
      { status: 500 }
    );
  }
}
