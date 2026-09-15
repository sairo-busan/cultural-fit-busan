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

/**
 * 유저 무관 공통 데이터라 서버 메모리에 캐싱(9/15, QA 중 발견 — 매 요청마다 KMA를
 * 새로 호출하고 있었음). base_date/base_time이 이미 예보 슬롯 단위라 그걸 캐시 키로
 * 쓰면 슬롯이 바뀔 때 자연히 갱신된다. TTL은 안전망(로직 버그로 슬롯이 안 바뀌는
 * 경우까지 대비) — ncst는 10분마다, forecast는 slot이 몇 시간 단위라 30분으로 넉넉히.
 */
const weatherCache = new Map<string, { body: unknown; cachedAt: number }>();
const CACHE_TTL_MS: Record<WeatherOp, number> = { ncst: 10 * 60_000, forecast: 30 * 60_000 };

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

  const cacheKey = `${op}:${base_date}:${base_time}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS[op]) {
    return NextResponse.json(cached.body);
  }

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

    const responseBody = {
      nx,
      ny,
      baseDate: base_date,
      baseTime: base_time,
      items: body.response.body.items?.item ?? [],
    };
    weatherCache.set(cacheKey, { body: responseBody, cachedAt: Date.now() });
    return NextResponse.json(responseBody);
  } catch (error) {
    return NextResponse.json(
      { error: "기상청 API 호출 실패", detail: (error as Error).message },
      { status: 502 }
    );
  }
}
