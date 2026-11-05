"use client";

import { useEffect, useRef, useState } from "react";

/** `n` 은 마커 번호(없으면 목록 순서). `plain` 은 고르기가 없는 화면 — 체크 배지를 달지 않는다 */
export type MapPin = { x: number; y: number; on: boolean; label: string; n?: number; plain?: boolean };

/* eslint-disable @typescript-eslint/no-explicit-any -- 카카오 지도 SDK 는 타입을 내주지 않는다 */
declare global {
  interface Window {
    kakao?: { maps: any };
  }
}

const KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

let sdk: Promise<any> | null = null;

/** SDK 는 한 번만 붙인다. 실패하면 다음 시도에서 다시 붙인다 */
function loadSdk(): Promise<any> {
  if (!KEY) return Promise.reject(new Error("NEXT_PUBLIC_KAKAO_JS_KEY 없음"));
  sdk ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false`;
    script.onload = () => window.kakao!.maps.load(() => resolve(window.kakao!.maps));
    script.onerror = () => {
      sdk = null;
      script.remove();
      reject(new Error("카카오 지도 SDK 로드 실패"));
    };
    document.head.appendChild(script);
  });
  return sdk;
}

/**
 * 번호 핀 지도. 핀은 목록 순서와 같은 번호를 단다.
 * 고른 곳은 채운 핀, 안 고른 곳은 빈 핀, 지금 보는 곳은 크게.
 */
export function KakaoMap({
  pins,
  selected,
  onSelect,
  onMapClick,
  coverBottom,
}: {
  pins: MapPin[];
  selected: number;
  onSelect: (index: number) => void;
  /** 마커가 아닌 빈 곳을 눌렀을 때 */
  onMapClick: () => void;
  /** 지도 아래쪽이 시트에 가려진 높이(px). 핀을 그 위 보이는 칸에 둔다 */
  coverBottom: number;
}) {
  const el = useRef<HTMLDivElement>(null);
  const [maps, setMaps] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const [failed, setFailed] = useState(false);
  const onSelectRef = useRef(onSelect);
  const onMapClickRef = useRef(onMapClick);

  useEffect(() => {
    onSelectRef.current = onSelect;
    onMapClickRef.current = onMapClick;
  });

  useEffect(() => {
    let cancelled = false;
    loadSdk()
      .then((m) => {
        if (cancelled || !el.current) return;
        setMaps(m);
        const created = new m.Map(el.current, { center: new m.LatLng(35.18, 129.08), level: 8 });
        m.event.addListener(created, "click", () => onMapClickRef.current());
        setMap(created);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** 사용자가 핀이나 줄을 고른 뒤로는 전체 맞춤 대신 고른 곳을 따라간다 */
  const touched = useRef(false);

  /** 고른 핀을 보이는 칸(가려진 아래쪽을 뺀 부분) 가운데로 */
  function panToVisible(p: MapPin) {
    const proj = map.getProjection();
    const pt = proj.pointFromCoords(new maps.LatLng(p.y, p.x));
    map.panTo(proj.coordsFromPoint(new maps.Point(pt.x, pt.y + coverBottom / 2)));
  }

  // 처음에는 후보 전체가 보이는 칸에 들어오게 맞춘다
  const bounds = pins.map((p) => `${p.x},${p.y}`).join("|");
  useEffect(() => {
    if (!map || !maps || pins.length === 0 || touched.current) return;
    const b = new maps.LatLngBounds();
    pins.forEach((p) => b.extend(new maps.LatLng(p.y, p.x)));
    map.setBounds(b, 48, 32, 48 + coverBottom, 32);
    if (pins.length === 1) map.setLevel(4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, maps, bounds, coverBottom]);

  useEffect(() => {
    if (!map || !maps) return;
    const overlays = pins.map((p, i) => {
      const focused = i === selected;
      const overlay = new maps.CustomOverlay({
        position: new maps.LatLng(p.y, p.x),
        content: marker(p.n ?? i + 1, p, focused, () => onSelectRef.current(i)),
        yAnchor: 1,
        zIndex: focused ? 3 : p.on ? 2 : 1,
      });
      overlay.setMap(map);
      return overlay;
    });
    return () => overlays.forEach((o) => o.setMap(null));
  }, [map, maps, pins, selected]);

  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /**
   * 고른 곳으로 날아간다. 카카오 `panTo` 는 화면보다 먼 거리면 애니메이션 없이 순간 이동하므로,
   * 먼 곳은 둘이 한 화면에 들어올 만큼 물러났다가 옮겨 가서 다시 당긴다.
   */
  function flyTo(p: MapPin) {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const target = new maps.LatLng(p.y, p.x);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      map.setLevel(Math.min(map.getLevel(), FOCUS_LEVEL));
      panToVisible(p);
      return;
    }

    const after = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    const zoomIn = () => {
      if (map.getLevel() > FOCUS_LEVEL) {
        map.setLevel(FOCUS_LEVEL, { animate: { duration: ZOOM_MS }, anchor: target });
      }
    };

    const proj = map.getProjection();
    const from = proj.pointFromCoords(map.getCenter());
    const to = proj.pointFromCoords(target);
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const box = el.current!;
    const reach = Math.min(box.clientWidth, box.clientHeight - coverBottom) * 0.8;

    if (dist <= reach) {
      panToVisible(p);
      after(PAN_MS, zoomIn);
      return;
    }
    // 한 단계 물러날 때마다 거리가 반으로 준다
    const out = Math.ceil(Math.log2(dist / reach));
    map.setLevel(map.getLevel() + out, { animate: { duration: ZOOM_MS } });
    after(ZOOM_MS + 50, () => panToVisible(p));
    after(ZOOM_MS + 50 + PAN_MS, zoomIn);
  }

  // 고르면 겹친 핀이 갈라지게 동네 수준으로 당긴다. 첫 렌더의 0번은 고른 게 아니다
  const lastSelected = useRef(selected);
  useEffect(() => {
    const p = pins[selected];
    if (!map || !maps || !p || lastSelected.current === selected) return;
    lastSelected.current = selected;
    touched.current = true;
    flyTo(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, maps, selected]);

  // 시트를 접고 펼치면 보이는 칸이 바뀐다 — 고른 곳을 다시 가운데로
  useEffect(() => {
    const p = pins[selected];
    if (map && maps && p && touched.current) panToVisible(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverBottom]);

  return (
    <div className="relative size-full bg-surface">
      <div ref={el} className="size-full" />
      {failed && (
        <p className="ds-caption absolute inset-0 grid place-items-center text-sub">
          지도를 불러오지 못했어요
        </p>
      )}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const INK = "#101318";
/** 고른 곳을 볼 때의 확대 수준 — 겹친 핀이 갈라지는 동네 수준 */
const FOCUS_LEVEL = 5;
const ZOOM_MS = 350;
/** 카카오 panTo 애니메이션 길이(고정값, 약 0.4초)에 여유를 둔 값 */
const PAN_MS = 450;

/**
 * 물방울 마커. 번호는 머리 안에 쓴다. 목록과 같은 기호를 쓴다 —
 * 체크 배지는 "고름", 잉크 채움 + 이름표는 "지금 보는 곳"(하나뿐). 뺀 곳은 회색으로 물러난다.
 */
function marker(n: number, p: MapPin, focused: boolean, onClick: () => void): HTMLElement {
  const w = focused ? 36 : p.on ? 30 : 26;
  const h = Math.round(w * 1.25);
  const fill = focused ? INK : p.on ? "#fff" : "#eceef0";
  const stroke = focused || p.on ? INK : "#b9bdc3";
  const text = focused ? "#fff" : p.on ? INK : "#8a8f96";
  const badge = p.on && !p.plain
    ? `<circle cx="25" cy="4" r="5.5" fill="${focused ? "#fff" : INK}" stroke="${focused ? INK : "#fff"}" stroke-width="1.5"/>
       <path d="M22.6 4.1l1.6 1.6 3.2-3.3" fill="none" stroke="${focused ? INK : "#fff"}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`
    : "";

  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", `${n}. ${p.label}${p.on && !p.plain ? " (고름)" : ""}`);
  el.style.cssText = `display:flex;flex-direction:column;align-items:center;cursor:pointer;background:none;border:0;padding:0;${
    !focused && !p.on ? "opacity:.85" : ""
  }`;
  el.innerHTML = `
    ${focused ? `<span style="margin-bottom:4px;max-width:160px;padding:4px 10px;border-radius:999px;background:#fff;color:${INK};font:600 12px/1.4 inherit;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 1px 4px rgba(0,0,0,.18)"></span>` : ""}
    <svg width="${w}" height="${h}" viewBox="-1 -2 32 38" style="overflow:visible;filter:drop-shadow(0 1px 2px rgba(0,0,0,.2))">
      <path d="M14 35C14 35 1.5 22.6 1.5 13.5a12.5 12.5 0 0 1 25 0C26.5 22.6 14 35 14 35z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
      <text x="14" y="14" text-anchor="middle" dominant-baseline="central" fill="${text}" style="font:700 12px Pretendard, sans-serif">${n}</text>
      ${badge}
    </svg>`;
  if (focused) el.querySelector("span")!.textContent = p.label;
  // 지도 클릭(시트 접기)으로 번지지 않게 막는다
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });
  el.addEventListener("mousedown", (e) => e.stopPropagation());
  el.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
  return el;
}
