import { NextRequest, NextResponse } from "next/server";
import { latLonToGrid, getUltraSrtNcstBaseTime, getVilageFcstBaseTime } from "@/lib/kma";

const KMA_BASE = "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0";

const OPERATIONS = {
  ncst: "getUltraSrtNcst", // 초단기실황 — 지금 이 순간
  forecast: "getVilageFcst", // 단기예보 — 최대 3일
} as const;

type WeatherOp = keyof typeof OPERATIONS;

function isWeatherOp(op: string | null): op is WeatherOp {
  return op === "ncst" || op === "forecast";
}

/** 부산시청 좌표 — 추천 대상이 전부 부산이라 기상 격자가 사실상 하나다(9/10 회의, GPS 제거) */
const BUSAN_CITY_HALL = { lat: 35.1796, lng: 129.0756 };

export async function GET(request: NextRequest) {
  const serviceKey = process.env.KMA_API_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "KMA_API_KEY가 설정되지 않았습니다" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const op = searchParams.get("op") ?? "ncst";

  if (!isWeatherOp(op)) {
    return NextResponse.json({ error: `op은 다음 중 하나여야 합니다: ncst, forecast` }, { status: 400 });
  }

  const { nx, ny } = latLonToGrid(BUSAN_CITY_HALL.lat, BUSAN_CITY_HALL.lng);
  const now = new Date();
  const { base_date, base_time } =
    op === "ncst" ? getUltraSrtNcstBaseTime(now) : getVilageFcstBaseTime(now);

  // serviceKey는 공공데이터포털에서 이미 URL 인코딩된 값으로 발급됨(Encoding 키) —
  // URLSearchParams에 같이 넣으면 이중 인코딩돼서 깨지므로 별도로 붙인다.
  const params = new URLSearchParams({
    numOfRows: "1000",
    pageNo: "1",
    dataType: "JSON",
    base_date,
    base_time,
    nx: String(nx),
    ny: String(ny),
  });

  const upstreamUrl = `${KMA_BASE}/${OPERATIONS[op]}?serviceKey=${serviceKey}&${params.toString()}`;

  try {
    const upstreamResponse = await fetch(upstreamUrl, { cache: "no-store" });
    const body = await upstreamResponse.json();

    if (!upstreamResponse.ok || body.response?.header?.resultCode !== "00") {
      return NextResponse.json(
        { error: "기상청 API 호출 실패", detail: body.response?.header ?? body },
        { status: 502 }
      );
    }

    return NextResponse.json({
      nx,
      ny,
      baseDate: base_date,
      baseTime: base_time,
      items: body.response.body.items?.item ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "기상청 API 호출 실패", detail: (error as Error).message },
      { status: 502 }
    );
  }
}
