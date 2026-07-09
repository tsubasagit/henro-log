import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { TEMPLES } from '../data/temples';
import {
  getCurrentPosition,
  nearestTemples,
  distanceLabel,
  googleMapsDirectionsUrl,
  googleMapsPlaceUrl,
  type LatLng,
  type NearbyTemple,
  type GeoError,
} from '../lib/geo';

type Status = 'idle' | 'locating' | 'ready' | 'error';

export default function NearbyView() {
  const visits = useLiveQuery(() => db.visits.toArray(), []);
  const [status, setStatus] = useState<Status>('idle');
  const [nearby, setNearby] = useState<NearbyTemple[]>([]);
  const [error, setError] = useState<string>('');
  const [me, setMe] = useState<LatLng | null>(null);

  // 参拝回数を templeId ごとに集計
  const counts = new Map<number, number>();
  for (const v of visits ?? []) counts.set(v.templeId, (counts.get(v.templeId) ?? 0) + 1);

  async function locate() {
    setStatus('locating');
    setError('');
    try {
      const pos = await getCurrentPosition();
      setMe(pos);
      setNearby(nearestTemples(pos, TEMPLES, 5));
      setStatus('ready');
    } catch (e) {
      setError((e as GeoError)?.message ?? '現在地を取得できませんでした。');
      setStatus('error');
    }
  }

  const nearest = nearby[0];
  const rest = nearby.slice(1);

  return (
    <div>
      <header className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 z-10">
        <h1 className="font-brush text-2xl text-[#1f5b8c] leading-none">現在地から近い札所</h1>
      </header>

      <div className="p-4 space-y-5">
        {/* 初期・エラー時のプロンプト */}
        {(status === 'idle' || status === 'error') && (
          <section className="text-center py-8">
            <div className="text-5xl mb-3" aria-hidden="true">
              📍
            </div>
            <p className="text-slate-600 mb-1">今いる場所から一番近い札所を探します。</p>
            <p className="text-xs text-slate-400 mb-5">位置情報はこの端末の中だけで使い、送信しません。</p>
            {status === 'error' && (
              <p className="text-sm text-red-600 mb-4 px-2">{error}</p>
            )}
            <button
              type="button"
              onClick={locate}
              className="press bg-[#1f5b8c] hover:bg-[#16446b] text-white px-8 py-3 rounded-lg font-semibold"
            >
              {status === 'error' ? 'もう一度さがす' : '現在地からさがす'}
            </button>
          </section>
        )}

        {/* 取得中 */}
        {status === 'locating' && (
          <section className="text-center py-12 text-slate-500">
            <div className="text-4xl animate-pulse mb-3" aria-hidden="true">
              📍
            </div>
            <p>現在地を取得しています…</p>
          </section>
        )}

        {/* 結果 */}
        {status === 'ready' && nearest && (
          <>
            {/* 一番近い札所 */}
            <section>
              <h2 className="text-sm font-semibold text-slate-600 mb-2">一番近い札所</h2>
              <div className="border-2 border-[#1f5b8c] rounded-2xl p-4 bg-[#1f5b8c]/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-brush text-[#1f5b8c] text-lg leading-none">
                        第{nearest.temple.id}番
                      </span>
                      <span className="font-brush text-xl text-slate-800 truncate">
                        {nearest.temple.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {nearest.temple.city}・{nearest.temple.honzon}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-2xl font-bold text-[#1f5b8c] leading-none">
                      {distanceLabel(nearest.distanceKm)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">直線距離</div>
                  </div>
                </div>

                <div className="mt-2">
                  {(counts.get(nearest.temple.id) ?? 0) > 0 ? (
                    <span className="inline-block text-xs text-green-700 bg-green-50 rounded-full px-2 py-0.5">
                      参拝済み（{counts.get(nearest.temple.id)}回）
                    </span>
                  ) : (
                    <span className="inline-block text-xs text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                      未参拝
                    </span>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a
                    href={googleMapsDirectionsUrl({
                      lat: nearest.temple.lat!,
                      lng: nearest.temple.lng!,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press flex items-center justify-center gap-1.5 bg-[#1f5b8c] hover:bg-[#16446b] text-white py-2.5 rounded-lg font-semibold text-sm"
                  >
                    <span aria-hidden="true">🧭</span>
                    Googleマップで経路案内
                  </a>
                  <Link
                    to={`/temple/${nearest.temple.id}`}
                    className="press flex items-center justify-center gap-1.5 border border-slate-300 text-slate-700 py-2.5 rounded-lg font-semibold text-sm active:bg-slate-50"
                  >
                    札所の詳細へ
                  </Link>
                </div>
                <a
                  href={googleMapsPlaceUrl(
                    { lat: nearest.temple.lat!, lng: nearest.temple.lng! },
                    `${nearest.temple.name}（第${nearest.temple.id}番）`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-xs text-[#538bb0] hover:underline mt-2"
                >
                  Googleマップで場所を見る
                </a>
              </div>
            </section>

            {/* ほかに近い札所 */}
            {rest.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-600 mb-2">ほかに近い札所</h2>
                <ul className="space-y-2">
                  {rest.map((n) => (
                    <li
                      key={n.temple.id}
                      className="flex items-center gap-3 border border-slate-200 rounded-xl px-3 py-2.5"
                    >
                      <Link to={`/temple/${n.temple.id}`} className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-brush text-[#1f5b8c] text-sm leading-none">
                            第{n.temple.id}番
                          </span>
                          <span className="font-medium text-slate-800 truncate">
                            {n.temple.name}
                          </span>
                          {(counts.get(n.temple.id) ?? 0) > 0 && (
                            <span aria-label="参拝済み" className="text-green-600 text-xs">
                              ●
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {n.temple.city}・直線{distanceLabel(n.distanceKm)}
                        </div>
                      </Link>
                      <a
                        href={googleMapsDirectionsUrl({ lat: n.temple.lat!, lng: n.temple.lng! })}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${n.temple.name}へGoogleマップで経路案内`}
                        className="press shrink-0 grid place-items-center w-10 h-10 rounded-full bg-[#1f5b8c]/10 text-[#1f5b8c] text-lg"
                      >
                        🧭
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="pt-1">
              <button
                type="button"
                onClick={locate}
                className="press w-full border border-slate-200 text-slate-600 py-2.5 rounded-lg font-medium active:bg-slate-50"
              >
                現在地を更新する
              </button>
              {me && (
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  現在地: {me.lat.toFixed(4)}, {me.lng.toFixed(4)}（直線距離。実際の道のりとは異なります）
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
