/**
 * 거리 계산. 공식은 추천_알고리즘_명세서_v2.md 5번 섹션(haversine → 80m/분).
 *
 * 유저 GPS 계산에는 더 안 쓴다(9/10 회의 — 위치정보 완전 제거). 지금은
 * nearbyPlaces.ts가 큐레이션된 장소끼리(고정 좌표 대 고정 좌표) 거리를 잴 때만
 * 쓴다 — 사용자 위치가 안 들어가서 위치정보 원칙과 무관.
 */

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 두 좌표 사이 도보 분 — haversine 거리(m) / 80m분 */
export function distanceMinutes(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const meters = EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(meters / 80);
}
