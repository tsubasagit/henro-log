import type { Visit } from '../db/db';

/** 訪問を日付昇順に並べる */
export function sortByDate(visits: Visit[]): Visit[] {
  return [...visits].sort((a, b) => a.visitedOn.localeCompare(b.visitedOn));
}

/** 2つの日付（YYYY-MM-DD）の差を日数で返す */
export function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** 2地点（緯度経度, WGS84）間の直線距離を km で返す（ハバーサイン） */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371; // 地球半径 km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 距離(km)を読みやすいラベルにする（1km未満はm表記） */
export function distanceLabel(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

/** 前回からの間隔を人が読みやすいラベルにする */
export function intervalLabel(days: number): string {
  if (days <= 0) return '同日';
  if (days < 31) return `${days}日ぶり`;
  if (days < 365) return `約${Math.round(days / 30)}ヶ月ぶり`;
  const years = days / 365;
  return years < 10 ? `約${years.toFixed(1)}年ぶり` : `約${Math.round(years)}年ぶり`;
}
