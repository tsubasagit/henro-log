/**
 * デフォルメ四国マップ上の札所ピン座標（SVG viewBox 0 0 680 500 基準）。
 * 実緯度経度（temples の lat/lng）を島の内側の矩形へ線形投影して全88札所を生成する。
 * 経度→x（東ほど右）、緯度→y（北ほど上）。デフォルメ島なので厳密な地理座標ではなく
 * 「東西南北の並びが直感的に合う」ことを狙った illustrative な配置。
 * 盤の形を変えるなら GEO / BOX の定数だけ差し替えれば全点が追従する。
 */
import { TEMPLES } from './temples';

export interface MapPoint {
  templeId: number;
  x: number;
  y: number;
}

// 投影元（札所群の実座標の外接範囲に少し余白を持たせた矩形）
const GEO = { latMin: 32.65, latMax: 34.45, lngMin: 132.45, lngMax: 134.7 };
// 投影先（島の輪郭の内側に収まり、県ラベルとも大きくは干渉しない矩形）
const BOX = { xMin: 182, xMax: 540, yMin: 188, yMax: 424 };

/** 緯度経度をデフォルメ島のSVG座標へ線形投影する */
export function projectLatLng(lat: number, lng: number): { x: number; y: number } {
  const x = BOX.xMin + ((lng - GEO.lngMin) / (GEO.lngMax - GEO.lngMin)) * (BOX.xMax - BOX.xMin);
  const y = BOX.yMin + ((GEO.latMax - lat) / (GEO.latMax - GEO.latMin)) * (BOX.yMax - BOX.yMin);
  return { x: Math.round(x), y: Math.round(y) };
}

export const MAP_POINTS: MapPoint[] = TEMPLES.filter(
  (t): t is typeof t & { lat: number; lng: number } => t.lat != null && t.lng != null,
).map((t) => {
  const { x, y } = projectLatLng(t.lat, t.lng);
  return { templeId: t.id, x, y };
});

/** デフォルメ四国の島の輪郭（SVG path） */
export const ISLAND_PATH =
  'M175 205 C235 158 430 142 520 178 C562 196 582 232 560 275 C548 302 532 304 524 332 L556 418 L512 392 C472 360 432 415 364 426 C305 434 252 438 208 414 L168 452 L180 398 C142 368 128 318 152 272 C160 238 162 224 175 205 Z';

/** 巡拝路（時計回り）の点線 path */
export const ROUTE_PATH =
  'M498 188 C545 230 540 300 545 410 C470 430 300 442 175 442 C150 400 150 350 165 302 C175 232 260 182 338 184 C372 178 400 172 432 168 C460 174 480 180 498 188';
