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
    // DB 드리프트(9/18 addr1 null 사고 같은 것)를 응답 직전에 로그로 남긴다 —
    // 요청은 막지 않는다(화면은 null-safe해야 하지만, 발생 사실은 추적 가능해야 함).
    if (!detail.addr1 || detail.mapX == null || detail.mapY == null) {
      console.warn(`[place/${id}] 핵심 필드 결측: addr1=${detail.addr1} mapX=${detail.mapX} mapY=${detail.mapY}`);
    }
    return NextResponse.json(detail);
  } catch (error) {
    return NextResponse.json(
      { error: "장소 상세 조회 실패", detail: (error as Error).message },
      { status: 500 }
    );
  }
}
