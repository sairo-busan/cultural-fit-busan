import { NextRequest, NextResponse } from "next/server";
import { getRecommendations } from "@/lib/recommend";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json(
      { error: "lat, lng는 필수 숫자 파라미터입니다" },
      { status: 400 }
    );
  }

  const contentTypeId = searchParams.get("contentTypeId") ?? undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  const results = await getRecommendations({ lat, lng, contentTypeId, limit });
  return NextResponse.json(results);
}
