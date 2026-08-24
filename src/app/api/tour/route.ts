import { NextRequest, NextResponse } from "next/server";

const TOUR_API_BASE = "https://apis.data.go.kr/B551011/KorService2";

const ALLOWED_OPERATIONS = [
  "areaBasedList2",
  "areaBasedSyncList2",
  "detailIntro2",
  "detailCommon2",
  "detailInfo2",
  "detailImage2",
  "detailPetTour2",
  "searchFestival2",
  "searchKeyword2",
  "searchStay2",
  "locationBasedList2",
  "ldongCode2",
  "lclsSystmCode2",
] as const;

type TourOperation = (typeof ALLOWED_OPERATIONS)[number];

function isAllowedOperation(op: string | null): op is TourOperation {
  return ALLOWED_OPERATIONS.includes(op as TourOperation);
}

export async function GET(request: NextRequest) {
  const serviceKey = process.env.TOUR_API_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "TOUR_API_KEY가 설정되지 않았습니다" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const op = searchParams.get("op");

  if (!isAllowedOperation(op)) {
    return NextResponse.json(
      { error: `op은 다음 중 하나여야 합니다: ${ALLOWED_OPERATIONS.join(", ")}` },
      { status: 400 }
    );
  }

  const upstreamParams = new URLSearchParams(searchParams);
  upstreamParams.delete("op");
  upstreamParams.set("serviceKey", serviceKey);
  upstreamParams.set("MobileOS", "ETC");
  upstreamParams.set("MobileApp", "CulturalFitBusan");
  upstreamParams.set("_type", "json");

  const upstreamUrl = `${TOUR_API_BASE}/${op}?${upstreamParams.toString()}`;

  const upstreamResponse = await fetch(upstreamUrl, { cache: "no-store" });
  const body = await upstreamResponse.json();

  if (!upstreamResponse.ok || body.response?.header?.resultCode !== "0000") {
    return NextResponse.json(
      { error: "TourAPI 호출 실패", detail: body },
      { status: 502 }
    );
  }

  return NextResponse.json(body.response.body);
}
