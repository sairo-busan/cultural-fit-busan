/**
 * 거리 계산 (FE-FEAT-005). 원래 서버(BE-FEAT-003)에 있던 로직을 BE-FEAT-006에서
 * 위치정보 원칙(GPS 서버 전송 금지)에 따라 그대로 옮겨온 것 — 공식은
 * 추천_알고리즘_명세서_v2.md 5번 섹션(haversine → 80m/분) 그대로 재사용.
 *
 * 용도: 순위(최종점수)엔 반영 안 함(CALC_04에 거리 항목 없음) — 카드·상세
 * 화면에 "도보 O분" 표시 전용.
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
