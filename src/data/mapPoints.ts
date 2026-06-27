/**
 * デフォルメ四国マップ上の札所ピン座標（SVG viewBox 0 0 680 500 基準）。
 * illustrative な位置で、実緯度経度とは別物。主要札所のみ配置している。
 * 将来 temples の lat/lng が揃えば、全88札所を投影配置に置き換え可能。
 */
export interface MapPoint {
  templeId: number;
  x: number;
  y: number;
}

export const MAP_POINTS: MapPoint[] = [
  { templeId: 1, x: 498, y: 186 },
  { templeId: 12, x: 458, y: 238 },
  { templeId: 21, x: 500, y: 298 },
  { templeId: 23, x: 516, y: 346 },
  { templeId: 24, x: 548, y: 412 },
  { templeId: 31, x: 372, y: 410 },
  { templeId: 37, x: 250, y: 402 },
  { templeId: 38, x: 170, y: 442 },
  { templeId: 44, x: 252, y: 322 },
  { templeId: 51, x: 162, y: 300 },
  { templeId: 60, x: 300, y: 276 },
  { templeId: 66, x: 332, y: 232 },
  { templeId: 75, x: 340, y: 184 },
  { templeId: 84, x: 404, y: 202 },
  { templeId: 88, x: 432, y: 166 },
];

/** デフォルメ四国の島の輪郭（SVG path） */
export const ISLAND_PATH =
  'M175 205 C235 158 430 142 520 178 C562 196 582 232 560 275 C548 302 532 304 524 332 L556 418 L512 392 C472 360 432 415 364 426 C305 434 252 438 208 414 L168 452 L180 398 C142 368 128 318 152 272 C160 238 162 224 175 205 Z';

/** 巡拝路（時計回り）の点線 path */
export const ROUTE_PATH =
  'M498 188 C545 230 540 300 545 410 C470 430 300 442 175 442 C150 400 150 350 165 302 C175 232 260 182 338 184 C372 178 400 172 432 168 C460 174 480 180 498 188';
