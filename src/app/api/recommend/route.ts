import { NextRequest, NextResponse } from "next/server";
import { getRecommendations } from "@/lib/recommend";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const contentTypeId = searchParams.get("contentTypeId") ?? undefined;
  const limitParam = searchParams.get("limit");
  const parsedLimit = limitParam ? parseInt(limitParam, 10) : undefined;
  // 1~100으로 고정 — 비정상값(NaN·음수·상한초과)은 전부 기본값(20)이나 상한(100)으로 흡수
  const limit =
    parsedLimit === undefined || Number.isNaN(parsedLimit) || parsedLimit < 1
      ? undefined
      : Math.min(parsedLimit, 100);

  try {
    const results = await getRecommendations({ contentTypeId, limit });
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: "추천 조회 실패", detail: (error as Error).message },
      { status: 500 }
    );
  }
}
