import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Visit } from '../db/db';
import { TEMPLES } from '../data/temples';
import { BOARD_NODES, ROUTE_POINTS, BOARD_W, BOARD_H } from '../data/boardPath';

const TEMPLE = new Map(TEMPLES.map((t) => [t.id, t]));

/** 端末ローカルの今日を YYYY-MM-DD で返す */
function today(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** YYYY-MM-DD → M/D */
function formatMD(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${+m}/${+d}`;
}

export default function BoardView() {
  const navigate = useNavigate();
  const visits = useLiveQuery(() => db.visits.toArray(), []);
  const [sheet, setSheet] = useState<number | null>(null); // 確認シートを開いている札所番号
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  const visitsByTemple = new Map<number, Visit[]>();
  for (const v of visits ?? []) {
    const arr = visitsByTemple.get(v.templeId);
    if (arr) arr.push(v);
    else visitsByTemple.set(v.templeId, [v]);
  }
  const countOf = (id: number) => visitsByTemple.get(id)?.length ?? 0;
  const visitedCount = BOARD_NODES.filter((n) => countOf(n.templeId) > 0).length;

  /** 今日の日付で参拝を1件記録する */
  async function recordVisit(templeId: number) {
    const now = Date.now();
    await db.visits.add({
      templeId,
      visitedOn: today(),
      companionIds: [],
      photoIds: [],
      nokyo: false,
      createdAt: now,
      updatedAt: now,
    });
    showToast(`第${templeId}番 ${TEMPLE.get(templeId)?.name ?? ''} に参拝を記録（${formatMD(today())}）`);
  }

  /** その札所の最新の記録を1件取り消す（写真があれば併せて削除） */
  async function undoLatest(templeId: number) {
    const arr = visitsByTemple.get(templeId);
    if (!arr || arr.length === 0) return;
    const latest = arr.reduce((a, b) => (a.createdAt >= b.createdAt ? a : b));
    if (latest.photoIds?.length) await db.photos.bulkDelete(latest.photoIds);
    if (latest.id != null) await db.visits.delete(latest.id);
    if (arr.length === 1) setSheet(null); // 参拝が0件に戻ったらシートを閉じる
    showToast(`第${templeId}番 の記録を取り消しました`);
  }

  function handleTap(templeId: number) {
    // いきなり記録せず、必ず確認シートを開いてから押す
    setSheet(templeId);
  }

  const sheetTemple = sheet !== null ? TEMPLE.get(sheet) : null;
  const sheetVisits = sheet !== null ? (visitsByTemple.get(sheet) ?? []) : [];
  const lastVisitedOn =
    sheetVisits.length > 0
      ? sheetVisits.map((v) => v.visitedOn).sort()[sheetVisits.length - 1]
      : null;

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
        @keyframes henroSheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes henroFade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <header className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#1f5b8c]">札所</h1>
          <p className="text-sm text-slate-500 mt-0.5">行った札所をタップ→確認して押印（今日の参拝を記録）</p>
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
            const count = countOf(n.templeId);
            const visited = count > 0;
            return (
              <g
                key={n.templeId}
                onClick={() => handleTap(n.templeId)}
                style={{ cursor: 'pointer' }}
                role="button"
                aria-label={`第${n.templeId}番 ${TEMPLE.get(n.templeId)?.name ?? ''}${visited ? '（参拝済・タップで詳細）' : '（タップで参拝を記録）'}`}
              >
                <circle cx={n.x} cy={n.y} r="18" fill="transparent" />
                <circle cx={n.x} cy={n.y} r="15" fill="#ffffff" stroke="#1f5b8c" strokeWidth="1.5" />
                <text
                  x={n.x}
                  y={n.y + 4}
                  textAnchor="middle"
                  fontSize={n.templeId >= 10 ? 12 : 14}
                  fontWeight="600"
                  fill="#1f5b8c"
                  fontFamily="'Yuji Board', serif"
                >
                  {n.templeId}
                </text>

                {visited && (
                  <g className="henro-stamp" key={`stamp-${count}`}>
                    <circle cx={n.x} cy={n.y} r="16.5" fill="rgba(192,57,43,0.12)" stroke="#c0392b" strokeWidth="2.5" />
                    <text x={n.x} y={n.y + 6} textAnchor="middle" fontSize="17" fontWeight="700" fill="#c0392b" fontFamily="'Yuji Board', serif">
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
        <span className="ml-auto text-slate-400">タップで参拝を記録</span>
      </div>

      {/* トースト */}
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 max-w-[22rem] w-[calc(100%-2rem)] bg-[#1f3a52] text-white text-sm px-4 py-2.5 rounded-lg shadow-lg text-center"
          style={{ animation: 'henroFade 0.2s ease both' }}
          role="status"
        >
          {toast}
        </div>
      )}

      {/* 参拝済みマスの確認シート */}
      {sheetTemple && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center"
          style={{ animation: 'henroFade 0.15s ease both' }}
          onClick={() => setSheet(null)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-md bg-white rounded-t-2xl px-5 pt-4 pb-6 shadow-xl"
            style={{ animation: 'henroSheetUp 0.24s cubic-bezier(0.22,1,0.36,1) both' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300" />
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-bold text-slate-800">
                第{sheetTemple.id}番 {sheetTemple.name}
              </h2>
              {sheetVisits.length > 0 && (
                <span className="text-xs text-[#c0392b] font-semibold">{sheetVisits.length}回参拝</span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {sheetTemple.prefecture}
              {sheetTemple.city}・{sheetTemple.honzon}
            </p>
            {lastVisitedOn && (
              <p className="text-xs text-slate-400 mt-1">最終参拝日: {lastVisitedOn}</p>
            )}

            {sheetVisits.length === 0 ? (
              <>
                <p className="text-sm text-slate-600 mt-3">この札所に参拝を記録しますか？</p>
                <div className="mt-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      const id = sheetTemple.id;
                      setSheet(null);
                      void recordVisit(id);
                    }}
                    className="w-full bg-[#1f5b8c] hover:bg-[#16446b] text-white py-2.5 rounded-lg font-semibold"
                  >
                    参拝を記録する（{formatMD(today())}）
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheet(null)}
                    className="w-full border border-slate-200 text-slate-700 py-2.5 rounded-lg font-semibold active:bg-slate-50"
                  >
                    キャンセル
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => void recordVisit(sheetTemple.id)}
                  className="w-full bg-[#1f5b8c] hover:bg-[#16446b] text-white py-2.5 rounded-lg font-semibold"
                >
                  今日また参拝を記録（{formatMD(today())}）
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/temple/${sheetTemple.id}`)}
                  className="w-full border border-slate-200 text-slate-700 py-2.5 rounded-lg font-semibold active:bg-slate-50"
                >
                  詳細・写真を見る →
                </button>
                <button
                  type="button"
                  onClick={() => void undoLatest(sheetTemple.id)}
                  className="w-full text-red-500 py-2 rounded-lg font-medium active:bg-red-50"
                >
                  最新の記録を取り消す
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
