import { NextRequest, NextResponse } from "next/server";
import { getNearbyPlaces } from "@/lib/nearbyPlaces";

/**
 * GET /api/place/nearby?contentId={contentId}&limit={n}
 * 9/10 회의 — 코스 기능 대신 상세 화면에 "근처 장소" 한 줄. 개인화 없음(유저
 * 위치 아니라 장소 간 고정 좌표 거리).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contentId = searchParams.get("contentId");
  if (!contentId) {
    return NextResponse.json({ error: "contentId는 필수 파라미터입니다" }, { status: 400 });
  }

  const limitParam = searchParams.get("limit");
  const parsedLimit = limitParam ? parseInt(limitParam, 10) : undefined;
  const limit =
    parsedLimit === undefined || Number.isNaN(parsedLimit) || parsedLimit < 1
      ? 3
      : Math.min(parsedLimit, 5);

  try {
    const results = await getNearbyPlaces(contentId, limit);
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: "근처 장소 조회 실패", detail: (error as Error).message },
      { status: 500 }
    );
  }
}
