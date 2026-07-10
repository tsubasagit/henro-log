import type { Temple } from '../db/db';

export interface LatLng {
  lat: number;
  lng: number;
}

/** 2地点（緯度経度, WGS84）間の直線距離を km で返す（ハバーサイン） */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371; // 地球半径 km
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 距離(km)を読みやすいラベルにする（1km未満はm表記） */
export function distanceLabel(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

export interface NearbyTemple {
  temple: Temple;
  distanceKm: number;
}

/**
 * 現在地から近い順に札所を返す。座標が揃っている札所のみ対象。
 * @param limit 返す件数（既定 5）
 */
export function nearestTemples(from: LatLng, temples: Temple[], limit = 5): NearbyTemple[] {
  return temples
    .filter((t): t is Temple & LatLng => t.lat != null && t.lng != null)
    .map((t) => ({ temple: t, distanceKm: distanceKm(from, { lat: t.lat, lng: t.lng }) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

/** Google マップの経路案内URL（出発地は省略＝現在地。徒歩モード）。タップで本物のGoogleマップが開く。 */
export function googleMapsDirectionsUrl(dest: LatLng): string {
  const params = new URLSearchParams({
    api: '1',
    destination: `${dest.lat},${dest.lng}`,
    travelmode: 'walking',
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Google マップで場所を開くURL（地点表示）。 */
export function googleMapsPlaceUrl(dest: LatLng, label?: string): string {
  const query = label ? `${label} ${dest.lat},${dest.lng}` : `${dest.lat},${dest.lng}`;
  const params = new URLSearchParams({ api: '1', query });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export type GeoErrorKind = 'denied' | 'unavailable' | 'timeout' | 'insecure' | 'unsupported';

export interface GeoError {
  kind: GeoErrorKind;
  message: string;
}

/** GeolocationPositionError を日本語メッセージ付きの GeoError に変換する。 */
function toGeoError(err: GeolocationPositionError): GeoError {
  const map: Record<number, GeoError> = {
    1: { kind: 'denied', message: '位置情報の利用が許可されていません。ブラウザ/端末の設定から許可してください。' },
    2: { kind: 'unavailable', message: '現在地を取得できませんでした。電波状況の良い場所で再度お試しください。' },
    3: { kind: 'timeout', message: '現在地の取得がタイムアウトしました。もう一度お試しください。' },
  };
  return map[err.code] ?? { kind: 'unavailable', message: '現在地を取得できませんでした。' };
}

/** 指定オプションで1回だけ測位する Promise ラッパー。 */
function requestPosition(options: PositionOptions): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(toGeoError(err)),
      options,
    );
  });
}

/**
 * 現在地を取得する。失敗時は日本語メッセージ付きの GeoError を投げる。
 * まず高精度GPSで測位し、初回コールドスタートで手間取っても失敗しにくいよう
 * タイムアウトを長めに取る。それでも取れなければ Wi-Fi・基地局ベースの粗い測位に
 * フォールバックする（最寄り札所の判定には十分）。
 */
export async function getCurrentPosition(): Promise<LatLng> {
  if (!('geolocation' in navigator)) {
    throw { kind: 'unsupported', message: 'この端末では位置情報を利用できません。' } as GeoError;
  }
  // 位置情報は安全なコンテキスト（HTTPS）でのみ動作する
  if (!window.isSecureContext) {
    throw { kind: 'insecure', message: 'HTTPS でのアクセス時のみ現在地を取得できます。' } as GeoError;
  }
  try {
    // 高精度GPS。屋内・電波の弱い場所での初回測位に備えてタイムアウトは長め（20秒）
    return await requestPosition({ enableHighAccuracy: true, timeout: 20_000, maximumAge: 60_000 });
  } catch (e) {
    const err = e as GeoError;
    // 許可が無い/非対応/非HTTPS はリトライしても無駄なのでそのまま投げる
    if (err.kind === 'denied' || err.kind === 'unsupported' || err.kind === 'insecure') throw err;
    // タイムアウト・測位不可のときは、粗いが速い測位でフォールバック
    return await requestPosition({ enableHighAccuracy: false, timeout: 15_000, maximumAge: 300_000 });
  }
}
