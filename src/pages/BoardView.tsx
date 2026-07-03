import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Visit } from '../db/db';
import { TEMPLES } from '../data/temples';

const TEMPLE = new Map(TEMPLES.map((t) => [t.id, t]));

// 四国八十八ヶ所の道場（区切り）
const REGIONS = [
  { label: '阿波・発心の道場（1〜23番）', from: 1, to: 23 },
  { label: '土佐・修行の道場（24〜39番）', from: 24, to: 39 },
  { label: '伊予・菩提の道場（40〜65番）', from: 40, to: 65 },
  { label: '讃岐・涅槃の道場（66〜88番）', from: 66, to: 88 },
];

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
  const lastOf = (id: number): string | null => {
    const a = visitsByTemple.get(id);
    if (!a || a.length === 0) return null;
    return a.map((v) => v.visitedOn).sort()[a.length - 1];
  };
  const visitedCount = TEMPLES.filter((t) => countOf(t.id) > 0).length;

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
        .henro-stamp-html {
          transform-origin: center;
          animation: henroStampPop 0.42s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes henroSheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes henroFade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      <header className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#1f5b8c]">札所</h1>
            <p className="text-sm text-slate-500 mt-0.5">行った札所をタップ→確認して押印</p>
          </div>
          <div className="text-right leading-none">
            <span className="text-2xl font-bold text-[#c0392b]">{visitedCount}</span>
            <span className="text-sm text-slate-400"> / 88</span>
          </div>
        </div>
        <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#1f5b8c] transition-all" style={{ width: `${(visitedCount / 88) * 100}%` }} />
        </div>
      </header>

      {REGIONS.map((region) => (
        <section key={region.label}>
          <h2 className="px-4 pt-4 pb-1 text-sm font-semibold text-slate-500">{region.label}</h2>
          <ul>
            {TEMPLES.filter((t) => t.id >= region.from && t.id <= region.to).map((t) => {
              const count = countOf(t.id);
              const visited = count > 0;
              const last = lastOf(t.id);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => handleTap(t.id)}
                    className="flex w-full text-left active:bg-slate-50"
                    aria-label={`第${t.id}番 ${t.name}${visited ? `・${count}回参拝済` : '・未参拝'}（タップで${visited ? '確認' : '参拝を記録'}）`}
                  >
                    {/* 巡拝路の点線＋スタンプ節点 */}
                    <span className="relative w-14 shrink-0 flex items-center justify-center">
                      <span
                        aria-hidden="true"
                        className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 border-l border-dashed border-[#1f5b8c]/30"
                      />
                      {visited ? (
                        <span className="relative z-10">
                          <span
                            key={`stamp-${count}`}
                            className="henro-stamp-html block w-11 h-11 rounded-full grid place-items-center border-2 border-[#c0392b] text-[#c0392b] text-xl font-bold"
                            style={{ background: 'rgba(192,57,43,0.12)', fontFamily: "'Yuji Board', serif" }}
                          >
                            済
                          </span>
                          {count > 1 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#c0392b] text-white text-[10px] grid place-items-center font-bold">
                              {count}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span
                          className="relative z-10 w-11 h-11 rounded-full grid place-items-center bg-white border-[1.5px] border-[#1f5b8c] text-[#1f5b8c] text-lg"
                          style={{ fontFamily: "'Yuji Board', serif" }}
                        >
                          {t.id}
                        </span>
                      )}
                    </span>

                    {/* 寺名・所在・回数 */}
                    <span className="flex-1 min-w-0 flex items-center gap-3 border-b border-slate-100 py-3 pr-4">
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium text-slate-800 truncate">
                          第{t.id}番 {t.name}
                        </span>
                        <span className="block text-xs text-slate-500 truncate">
                          {t.city}・{t.honzon}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-xs">
                        {visited ? (
                          <>
                            <span className="block text-slate-700">{last}</span>
                            <span className="block text-slate-400">{count}回</span>
                          </>
                        ) : (
                          <span className="text-slate-300">未参拝</span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

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

      {/* 確認シート */}
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
