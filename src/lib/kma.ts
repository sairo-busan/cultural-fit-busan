/**
 * 기상청 단기예보 조회서비스(VilageFcstInfoService_2.0) 관련 유틸.
 * 참고: 참고 문헌/기상청41_단기예보 조회서비스_오픈API활용가이드_2607/
 *
 * 위경도 → 격자(nx, ny) 변환 공식은 기상청 공식 LCC 투영 공식이며,
 * 가이드 첨부 엑셀(부산 4개 지점: 부산광역시청·중구·중앙동·영주제1동)의
 * 실제 nx/ny 값과 대조해서 일치함을 확인했다 (8/27).
 */

const RE = 6371.00877; // 지구 반경(km)
const GRID = 5.0; // 격자 간격(km)
const SLAT1 = 30.0; // 투영 위도1
const SLAT2 = 60.0; // 투영 위도2
const OLON = 126.0; // 기준점 경도
const OLAT = 38.0; // 기준점 위도
const XO = 43; // 기준점 X좌표(GRID)
const YO = 136; // 기준점 Y좌표(GRID)
const DEGRAD = Math.PI / 180.0;

export function latLonToGrid(lat: number, lon: number): { nx: number; ny: number } {
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + (lat * DEGRAD) * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2 * Math.PI;
  if (theta < -Math.PI) theta += 2 * Math.PI;
  theta *= sn;

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
  return { nx, ny };
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 서버 프로세스의 로컬 타임존에 의존하지 않고 KST(UTC+9) 벽시계 시각을 얻는다.
 * (로컬 개발 환경은 보통 Asia/Seoul이라 문제가 안 보이지만, Vercel 서버리스 함수는
 * 기본 타임존이 UTC라서 getHours() 등 로컬 게터를 그대로 쓰면 9시간 어긋난다.
 * UTC 기준 시각에 9시간을 더한 뒤 UTC 게터로 읽어서 우회한다.)
 */
function toKstShifted(now: Date): Date {
  return new Date(now.getTime() + KST_OFFSET_MS);
}

function formatBaseDate(kst: Date): string {
  return `${kst.getUTCFullYear()}${pad2(kst.getUTCMonth() + 1)}${pad2(kst.getUTCDate())}`;
}

/** 초단기실황(getUltraSrtNcst): 매시 정각 발표, 10분 이후 호출 가능 */
export function getUltraSrtNcstBaseTime(now: Date): { base_date: string; base_time: string } {
  const kst = toKstShifted(now);
  if (kst.getUTCMinutes() < 10) {
    kst.setUTCHours(kst.getUTCHours() - 1);
  }
  kst.setUTCMinutes(0, 0, 0);
  return { base_date: formatBaseDate(kst), base_time: `${pad2(kst.getUTCHours())}00` };
}

/** 단기예보(getVilageFcst): 02/05/08/11/14/17/20/23시 발표, 10분 이후 호출 가능 */
export function getVilageFcstBaseTime(now: Date): { base_date: string; base_time: string } {
  const slots = [2, 5, 8, 11, 14, 17, 20, 23];
  const kst = toKstShifted(now);
  const currentMinuteOfDay = kst.getUTCHours() * 60 + kst.getUTCMinutes();

  let chosenHour: number | null = null;
  for (let i = slots.length - 1; i >= 0; i--) {
    const slotMinute = slots[i] * 60 + 10; // 발표 후 10분부터 제공
    if (currentMinuteOfDay >= slotMinute) {
      chosenHour = slots[i];
      break;
    }
  }
  if (chosenHour === null) {
    // 자정~02:10 사이 → 전날 23시 발표분
    kst.setUTCDate(kst.getUTCDate() - 1);
    chosenHour = 23;
  }
  kst.setUTCHours(chosenHour, 0, 0, 0);
  return { base_date: formatBaseDate(kst), base_time: `${pad2(chosenHour)}00` };
}
