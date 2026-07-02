import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { TEMPLES } from '../data/temples';
import { BOARD_NODES, ROUTE_POINTS, BOARD_W, BOARD_H } from '../data/boardPath';

const TEMPLE_NAME = new Map(TEMPLES.map((t) => [t.id, t.name]));

export default function BoardView() {
  const navigate = useNavigate();
  const visits = useLiveQuery(() => db.visits.toArray(), []);

  const countByTemple = new Map<number, number>();
  for (const v of visits ?? []) {
    countByTemple.set(v.templeId, (countByTemple.get(v.templeId) ?? 0) + 1);
  }
  const visitedCount = BOARD_NODES.filter((n) => (countByTemple.get(n.templeId) ?? 0) > 0).length;

  return (
    <div>
      <style>{`
        @keyframes henroStampPop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.18); }
          100% { transform: scale(1); opacity: 1; }
        }
        .henro-stamp {
          transform-box: fill-box;
          transform-origin: center;
          animation: henroStampPop 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>

      <header className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#1f5b8c]">すごろく</h1>
          <p className="text-sm text-slate-500 mt-0.5">参拝した札所にスタンプが押される</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-[#c0392b] leading-none">{visitedCount}</span>
          <span className="text-sm text-slate-400"> / 88</span>
        </div>
      </header>

      <div className="px-2 pt-2">
        <svg viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} width="100%" role="img" aria-label="四国八十八ヶ所 すごろく スタンプ盤">
          <rect x="0" y="0" width={BOARD_W} height={BOARD_H} fill="#eef0d9" />

          {/* 背景の雰囲気（後からイラストに差し替え可能な独立レイヤー） */}
          <path d="M40 120 L70 74 L100 120 Z" fill="#c6d8a8" opacity="0.55" />
          <path d="M280 300 L312 250 L344 300 Z" fill="#c6d8a8" opacity="0.55" />
          <path d="M150 560 L182 512 L214 560 Z" fill="#c6d8a8" opacity="0.55" />

          {/* 巡拝路 */}
          <polyline
            points={ROUTE_POINTS}
            fill="none"
            stroke="#1f5b8c"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1 8"
            opacity="0.45"
          />

          {/* 札所マス */}
          {BOARD_NODES.map((n) => {
            const count = countByTemple.get(n.templeId) ?? 0;
            const visited = count > 0;
            return (
              <g
                key={n.templeId}
                onClick={() => navigate(`/temple/${n.templeId}`)}
                style={{ cursor: 'pointer' }}
                role="button"
                aria-label={`第${n.templeId}番 ${TEMPLE_NAME.get(n.templeId) ?? ''}${visited ? ' 参拝済' : ''}`}
              >
                <circle cx={n.x} cy={n.y} r="18" fill="transparent" />
                <circle cx={n.x} cy={n.y} r="15" fill="#ffffff" stroke="#1f5b8c" strokeWidth="1.5" />
                <text
                  x={n.x}
                  y={n.y + 4}
                  textAnchor="middle"
                  fontSize={n.templeId >= 10 ? 11 : 13}
                  fontWeight="600"
                  fill="#1f5b8c"
                >
                  {n.templeId}
                </text>

                {visited && (
                  <g className="henro-stamp">
                    <circle cx={n.x} cy={n.y} r="16.5" fill="rgba(192,57,43,0.12)" stroke="#c0392b" strokeWidth="2.5" />
                    <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#c0392b" fontFamily="serif">
                      済
                    </text>
                    {count > 1 && (
                      <>
                        <circle cx={n.x + 12} cy={n.y - 12} r="7" fill="#c0392b" />
                        <text x={n.x + 12} y={n.y - 8.5} textAnchor="middle" fontSize="9" fontWeight="700" fill="#ffffff">
                          {count}
                        </text>
                      </>
                    )}
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="px-4 pt-1 pb-2 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3.5 h-3.5 rounded-full bg-[rgba(192,57,43,0.12)] border-2 border-[#c0392b]" />
          参拝済
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3.5 h-3.5 rounded-full bg-white border-[1.5px] border-[#1f5b8c]" />
          未参拝
        </span>
        <span className="ml-auto text-slate-400">マスをタップで札所へ</span>
      </div>
    </div>
  );
}
