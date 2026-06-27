import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Temple } from '../db/db';
import { TEMPLES } from '../data/temples';
import { MAP_POINTS, ISLAND_PATH, ROUTE_PATH } from '../data/mapPoints';
import { haversineKm, distanceLabel } from '../lib/geo';

// --- テスト用設定 -------------------------------------------------
// テスト中は実GPSの代わりに固定地点（高松駅）を現在地として使う。
// 本番では USE_TEST_LOCATION を false にすると、実際の現在地から自動表示する。
const USE_TEST_LOCATION = true;
const TEST_LOCATION = { lat: 34.3514, lng: 134.0466, label: '高松駅' };
// -----------------------------------------------------------------

type GeoState = 'idle' | 'loading' | 'done' | 'error';
interface Nearby {
  temple: Temple;
  km: number;
}

function rankNearby(lat: number, lng: number): Nearby[] {
  return TEMPLES.filter((t) => t.lat != null && t.lng != null)
    .map((t) => ({ temple: t, km: haversineKm(lat, lng, t.lat as number, t.lng as number) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 5);
}

export default function MapView() {
  const navigate = useNavigate();
  const visits = useLiveQuery(() => db.visits.toArray(), []);
  const [selected, setSelected] = useState<number | null>(null);
  const [geoState, setGeoState] = useState<GeoState>('idle');
  const [geoError, setGeoError] = useState('');
  const [nearby, setNearby] = useState<Nearby[]>([]);

  const countByTemple = new Map<number, number>();
  for (const v of visits ?? []) {
    countByTemple.set(v.templeId, (countByTemple.get(v.templeId) ?? 0) + 1);
  }

  const sel = selected !== null ? TEMPLES.find((t) => t.id === selected) ?? null : null;
  const selCount = selected !== null ? countByTemple.get(selected) ?? 0 : 0;

  const locationLabel = USE_TEST_LOCATION ? TEST_LOCATION.label : '現在地';

  function findNearby() {
    // テストモード: 固定地点（高松駅）で即表示
    if (USE_TEST_LOCATION) {
      setNearby(rankNearby(TEST_LOCATION.lat, TEST_LOCATION.lng));
      setGeoState('done');
      return;
    }
    // 本番: 実際の現在地から
    if (!('geolocation' in navigator)) {
      setGeoState('error');
      setGeoError('この端末では位置情報を利用できません。');
      return;
    }
    setGeoState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setNearby(rankNearby(latitude, longitude));
        setGeoState('done');
      },
      (err) => {
        setGeoState('error');
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? '位置情報の利用が許可されていません。端末の設定をご確認ください。'
            : '現在地を取得できませんでした。電波の良い場所で再度お試しください。',
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  // 画面を開いたら自動で近くの札所を表示する
  useEffect(() => {
    findNearby();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <header className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 z-10">
        <h1 className="text-lg font-bold text-[#1f5b8c]">地図</h1>
        <p className="text-sm text-slate-500 mt-0.5">主要札所をタップして開く</p>
      </header>

      <div className="px-2 pt-2">
        <svg viewBox="0 0 680 500" width="100%" role="img" aria-label="四国八十八ヶ所 巡拝マップ">
          <rect x="0" y="0" width="680" height="500" fill="#dcecf1" />

          <ellipse cx="300" cy="118" rx="16" ry="7" fill="#cfe3c4" />
          <ellipse cx="350" cy="100" rx="10" ry="5" fill="#cfe3c4" />
          <ellipse cx="420" cy="120" rx="13" ry="6" fill="#cfe3c4" />

          <path d={ISLAND_PATH} fill="#f1e7d0" stroke="#c9b994" strokeWidth="2" />

          <path d="M188 302 L226 240 L264 302 Z" fill="#9cb285" />
          <path d="M226 240 L240 262 L232 262 Z" fill="#eef3ea" />
          <path d="M322 300 L360 252 L398 300 Z" fill="#a7bb90" />
          <path d="M430 300 L462 260 L494 300 Z" fill="#9cb285" />
          <path d="M268 312 L296 274 L324 312 Z" fill="#b3c69d" />

          <path
            d={ROUTE_PATH}
            fill="none"
            stroke="#1f5b8c"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="1 9"
            opacity="0.55"
          />

          <text x="372" y="208" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="15" fontWeight="500" fill="#5f7a52" stroke="#f1e7d0" strokeWidth="3" paintOrder="stroke">香川</text>
          <text x="512" y="252" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="15" fontWeight="500" fill="#5f7a52" stroke="#f1e7d0" strokeWidth="3" paintOrder="stroke">徳島</text>
          <text x="206" y="350" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="15" fontWeight="500" fill="#5f7a52" stroke="#f1e7d0" strokeWidth="3" paintOrder="stroke">愛媛</text>
          <text x="372" y="350" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="15" fontWeight="500" fill="#5f7a52" stroke="#f1e7d0" strokeWidth="3" paintOrder="stroke">高知</text>

          {MAP_POINTS.map((p) => {
            const visited = (countByTemple.get(p.templeId) ?? 0) > 0;
            const isSel = selected === p.templeId;
            return (
              <g key={p.templeId} onClick={() => setSelected(p.templeId)} style={{ cursor: 'pointer' }}>
                <circle cx={p.x} cy={p.y} r="16" fill="transparent" />
                {isSel && <circle cx={p.x} cy={p.y} r="12" fill="none" stroke="#538bb0" strokeWidth="2.5" />}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSel ? 8 : 6}
                  fill={visited ? '#1f5b8c' : '#ffffff'}
                  stroke="#1f5b8c"
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="px-4 pt-2">
        {sel ? (
          <button
            type="button"
            onClick={() => navigate(`/temple/${sel.id}`)}
            className="w-full text-left border border-slate-200 rounded-lg p-3 active:bg-slate-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">
                第{sel.id}番 {sel.name}
              </span>
              <span className="text-xs text-[#538bb0]">{selCount > 0 ? `${selCount}回参拝` : '未参拝'}</span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {sel.prefecture}
              {sel.city}・{sel.honzon}
            </p>
            <p className="text-xs text-[#1f5b8c] mt-2">詳細を見る →</p>
          </button>
        ) : (
          <p className="text-sm text-slate-400 text-center py-3">ピンをタップすると札所が表示されます</p>
        )}
      </div>

      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={findNearby}
          disabled={geoState === 'loading'}
          className="w-full bg-[#1f5b8c] hover:bg-[#16446b] disabled:opacity-60 text-white py-2.5 rounded-lg font-semibold"
        >
          {geoState === 'loading' ? '現在地を取得中…' : `📍 ${locationLabel}から近い札所を探す`}
        </button>

        {USE_TEST_LOCATION && (
          <p className="text-xs text-amber-600 mt-2">テスト中: 現在地の代わりに「{TEST_LOCATION.label}」を使用しています</p>
        )}

        {geoState === 'error' && <p className="text-sm text-red-500 mt-2">{geoError}</p>}

        {geoState === 'done' && (
          <div className="mt-3">
            <h2 className="text-sm font-semibold text-slate-500 mb-1">{locationLabel}から近い札所</h2>
            <ul className="border border-slate-200 rounded-lg divide-y divide-slate-100">
              {nearby.map(({ temple, km }) => {
                const count = countByTemple.get(temple.id) ?? 0;
                return (
                  <li key={temple.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/temple/${temple.id}`)}
                      className="w-full text-left px-3 py-2.5 active:bg-slate-50 flex items-center gap-3"
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium text-slate-800 truncate">
                          第{temple.id}番 {temple.name}
                        </span>
                        <span className="block text-xs text-slate-500 truncate">
                          {temple.city}・{count > 0 ? `${count}回参拝` : '未参拝'}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-[#1f5b8c]">{distanceLabel(km)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-slate-400 mt-2">※直線距離（実際の道のりとは異なります）</p>
          </div>
        )}
      </div>
    </div>
  );
}
