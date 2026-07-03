import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Visit } from '../db/db';
import { TEMPLES } from '../data/temples';
import { useIsScrolling } from '../lib/useIsScrolling';
import henroMapBg from '../assets/img/henro-map-bg.jpg';
import henroWalk1 from '../assets/img/henro-walk-1.png';
import henroWalk2 from '../assets/img/henro-walk-2.png';
import templeIllust1 from '../assets/img/temple-illust-1.png';
import templeIllust2 from '../assets/img/temple-illust-2.png';
import templeIllust3 from '../assets/img/temple-illust-3.png';
import templeIllust4 from '../assets/img/temple-illust-4.png';
import { playStamp } from '../lib/sfx';

// 札所ごとに出す挿絵（番号で一定＝毎回同じ絵になる）
const TEMPLE_ILLUST = [templeIllust1, templeIllust2, templeIllust3, templeIllust4];
const illustOf = (id: number) => TEMPLE_ILLUST[(id - 1) % TEMPLE_ILLUST.length];

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

// 巡拝路の蛇行：札所番号ごとに左右へ揺れる x 位置（節点の帯 0〜100%）
const TRAIL_AMP = 22;
const TRAIL_FREQ = 0.7;
const trailX = (id: number) => 50 + TRAIL_AMP * Math.sin((id - 1) * TRAIL_FREQ);

// 花吹雪の一片（節目のお祝い演出）
const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  left: (i * 5.5 + (i % 4) * 3) % 100,
  delay: (i % 6) * 0.09,
  dur: 1.2 + (i % 5) * 0.14,
  size: 16 + (i % 4) * 5,
  emoji: ['🌸', '✨', '🎉', '🏵️'][i % 4],
}));

export default function BoardView() {
  const navigate = useNavigate();
  const scrolling = useIsScrolling(); // スクロール中はヘッダーを透明にして背景を見せる
  const visits = useLiveQuery(() => db.visits.toArray(), []);
  const [sheet, setSheet] = useState<number | null>(null); // 確認シートを開いている札所番号
  const [toast, setToast] = useState<string | null>(null);
  const [party, setParty] = useState(false); // 花吹雪の表示
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const partyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (partyTimer.current) clearTimeout(partyTimer.current);
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  function celebrate() {
    setParty(true);
    if (partyTimer.current) clearTimeout(partyTimer.current);
    partyTimer.current = setTimeout(() => setParty(false), 1800);
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
  const furthest = visitedCount > 0 ? Math.max(...TEMPLES.filter((t) => countOf(t.id) > 0).map((t) => t.id)) : 0;
  const nextId = TEMPLES.find((t) => countOf(t.id) === 0)?.id ?? null; // まだ参拝していない最小番号
  const remaining = 88 - visitedCount;
  const pct = Math.round((visitedCount / 88) * 100);
  const walkerPos = Math.max(5, Math.min(95, (visitedCount / 88) * 100)); // 住職の位置（端で見切れないよう5〜95%）
  const progressMsg =
    visitedCount === 0
      ? 'はじめの一歩を踏み出しましょう 🚶'
      : visitedCount === 88
        ? '満願成就！おめでとうございます 🎉'
        : `結願まであと ${remaining} ヶ寺 🌸`;

  /** 今日の日付で参拝を1件記録する */
  async function recordVisit(templeId: number) {
    playStamp(); // 押印の効果音
    const name = TEMPLE.get(templeId)?.name ?? '';
    // 記録前の状態で節目を判定する
    const wasUnvisited = countOf(templeId) === 0;
    const region = REGIONS.find((r) => templeId >= r.from && templeId <= r.to);
    const regionComplete =
      wasUnvisited &&
      region != null &&
      TEMPLES.filter((t) => t.id >= region.from && t.id <= region.to).every(
        (t) => t.id === templeId || countOf(t.id) > 0,
      );
    const allComplete = wasUnvisited && visitedCount + 1 === 88;
    const isFirst = wasUnvisited && visitedCount === 0;

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

    if (allComplete) {
      showToast('🎉 満願成就！八十八ヶ所すべて参拝しました');
      celebrate();
    } else if (regionComplete && region) {
      showToast(`🎉 ${region.label.split('（')[0]} 満願！`);
      celebrate();
    } else if (isFirst) {
      showToast(`はじめの一歩 🌸 第${templeId}番 ${name} に参拝を記録`);
      celebrate();
    } else {
      showToast(`第${templeId}番 ${name} に参拝を記録（${formatMD(today())}）`);
    }
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
        @keyframes henroFall {
          0% { transform: translateY(-12vh) rotate(0deg); opacity: 0; }
          12% { opacity: 1; }
          100% { transform: translateY(112vh) rotate(400deg); opacity: 0; }
        }
        @keyframes henroBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        @keyframes henroFrameA { 0%,49.9% { opacity: 1; } 50%,100% { opacity: 0; } }
        @keyframes henroFrameB { 0%,49.9% { opacity: 0; } 50%,100% { opacity: 1; } }
        .henro-walker { animation: henroBob 0.62s ease-in-out infinite; }
        .henro-fa { animation: henroFrameA 0.62s steps(1, end) infinite; }
        .henro-fb { animation: henroFrameB 0.62s steps(1, end) infinite; }
      `}</style>

      {/* 節目のお祝い：花吹雪 */}
      {party && (
        <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none" aria-hidden="true">
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              className="absolute top-0"
              style={{
                left: `${c.left}%`,
                fontSize: `${c.size}px`,
                animation: `henroFall ${c.dur}s ease-in ${c.delay}s both`,
              }}
            >
              {c.emoji}
            </span>
          ))}
        </div>
      )}

      {/* 背景に四国八十八か所の絵地図を薄く敷く（巡礼の舞台） */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-white">
        <img
          src={henroMapBg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: 0.12 }}
        />
      </div>

      <div className="relative z-10">
      <header
        className={`sticky top-0 px-4 py-3 z-20 transition-colors duration-300 ${
          scrolling ? 'bg-transparent border-b border-transparent' : 'bg-white border-b border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-brush text-2xl text-[#1f5b8c] leading-none">遍路ログ</h1>
            <p className="text-[13px] text-slate-500 mt-1">行った札所をタップ→確認して押印</p>
          </div>
          <div className="text-right leading-none">
            <span className="font-brush text-3xl text-[#c0392b]">{visitedCount}</span>
            <span className="font-brush text-sm text-slate-400"> / 88</span>
          </div>
        </div>
        {/* 住職が歩いて進む進捗バー */}
        <div className="mt-2 relative h-12">
          <div className="absolute left-1 right-1 bottom-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-[#1f5b8c] transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div
            className="henro-walker absolute bottom-1 w-10 h-11 transition-[left] duration-700"
            style={{ left: `${walkerPos}%`, marginLeft: '-20px' }}
            aria-hidden="true"
          >
            <img src={henroWalk1} alt="" className="henro-fa absolute bottom-0 left-0 w-10" />
            <img src={henroWalk2} alt="" className="henro-fb absolute bottom-0 left-0 w-10" />
          </div>
        </div>
        <p className="mt-1 flex items-center justify-between text-xs text-slate-500">
          <span>{progressMsg}</span>
          <span className="font-semibold text-[#1f5b8c]">{pct}%</span>
        </p>
      </header>

      {REGIONS.map((region) => {
        const inRegion = TEMPLES.filter((t) => t.id >= region.from && t.id <= region.to);
        const regionTotal = inRegion.length;
        const regionDone = inRegion.filter((t) => countOf(t.id) > 0).length;
        const regionClear = regionDone === regionTotal;
        return (
          <section key={region.label}>
            <h2 className="px-4 pt-5 pb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-600">
              <span className="inline-block w-1 h-4 rounded-full bg-[#c0392b]/70" aria-hidden="true" />
              <span className="tracking-wide">{region.label}</span>
              {regionClear ? (
                <span className="text-[11px] font-bold text-[#c0392b] border border-[#c0392b] rounded px-1.5 py-0.5">
                  満願
                </span>
              ) : (
                <span className="text-xs font-normal text-slate-400">
                  {regionDone}/{regionTotal}
                </span>
              )}
            </h2>
            <ul>
              {inRegion.map((t) => {
                const count = countOf(t.id);
                const visited = count > 0;
                const last = lastOf(t.id);
                const walked = t.id <= furthest; // 歩いた道（現在地まで）
                const isNext = t.id === nextId; // 次に行く札所
                const rot = ((t.id * 37) % 7) - 3; // -3〜3度、手押しっぽい微回転
                // 蛇行する巡拝路：この節点と上下の中点を結ぶ滑らかな曲線（道場の端で閉じる）
                const thisX = trailX(t.id);
                const topX = t.id === region.from ? thisX : (trailX(t.id - 1) + thisX) / 2;
                const bottomX = t.id === region.to ? thisX : (thisX + trailX(t.id + 1)) / 2;
                const trailD = `M ${topX} 0 Q ${thisX} 25 ${thisX} 50 Q ${thisX} 75 ${bottomX} 100`;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => handleTap(t.id)}
                      className={`press flex w-full text-left min-h-[68px] ${
                        isNext ? 'bg-[#c0392b]/[0.045]' : 'active:bg-slate-50'
                      }`}
                      aria-label={`第${t.id}番 ${t.name}${visited ? `・${count}回参拝済` : isNext ? '・次の札所' : '・未参拝'}（タップで${visited ? '確認' : '参拝を記録'}）`}
                    >
                      {/* 蛇行する巡拝路（歩いた分は朱色）＋スタンプ節点 */}
                      <span className="relative w-24 shrink-0 self-stretch">
                        <svg
                          className="absolute inset-0 h-full w-full"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <path
                            d={trailD}
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                            stroke={walked ? 'rgba(192,57,43,0.45)' : 'rgba(31,91,140,0.28)'}
                            strokeWidth={walked ? 2.5 : 1.5}
                            strokeDasharray={walked ? undefined : '3 5'}
                          />
                        </svg>
                        <span
                          className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                          style={{ left: `${thisX}%` }}
                        >
                          {visited ? (
                            <span className="relative block">
                              <span className="block" style={{ transform: `rotate(${rot}deg)` }}>
                                <span
                                  key={`stamp-${count}`}
                                  className="henro-stamp-html block w-11 h-11 rounded-full grid place-items-center border-2 border-[#c0392b] text-[#c0392b] text-xl font-bold"
                                  style={{ background: 'rgba(192,57,43,0.12)', fontFamily: "'Yuji Board', serif" }}
                                >
                                  済
                                </span>
                              </span>
                              {count > 1 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#c0392b] text-white text-[10px] grid place-items-center font-bold">
                                  {count}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span
                              className={`relative block w-11 h-11 rounded-full grid place-items-center bg-white border-[1.5px] text-lg ${
                                isNext ? 'border-[#c0392b] text-[#c0392b]' : 'border-[#1f5b8c] text-[#1f5b8c]'
                              }`}
                              style={{ fontFamily: "'Yuji Board', serif" }}
                            >
                              {t.id}
                              {isNext && (
                                <span
                                  aria-hidden="true"
                                  className="absolute inset-0 rounded-full border-2 border-[#c0392b] animate-ping"
                                />
                              )}
                            </span>
                          )}
                        </span>
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
                          ) : isNext ? (
                            <span className="text-[#c0392b] font-semibold">つぎ →</span>
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
        );
      })}
      </div>

      {/* トースト */}
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 max-w-[22rem] w-[calc(100%-2rem)] bg-[#1f3a52]/95 backdrop-blur text-white text-sm pl-3 pr-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2.5"
          style={{ animation: 'henroFade 0.2s ease both' }}
          role="status"
        >
          <span
            className="font-brush shrink-0 w-7 h-7 rounded-full grid place-items-center bg-[#c0392b] text-white text-base"
            aria-hidden="true"
          >
            済
          </span>
          <span className="flex-1 text-left leading-snug">{toast}</span>
        </div>
      )}

      {/* 確認シート */}
      {sheetTemple && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center"
          style={{ animation: 'henroFade 0.15s ease both' }}
          onClick={() => setSheet(null)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div
            className="relative w-full max-w-md bg-white rounded-t-3xl px-5 pt-4 shadow-xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            style={{ animation: 'henroSheetUp 0.24s cubic-bezier(0.22,1,0.36,1) both' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300" />
            <img
              src={illustOf(sheetTemple.id)}
              alt=""
              aria-hidden="true"
              className="mx-auto mb-3 h-28 w-auto object-contain drop-shadow-sm"
            />
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
                    className="press w-full bg-[#1f5b8c] hover:bg-[#16446b] text-white py-3 rounded-xl font-semibold"
                  >
                    参拝を記録する（{formatMD(today())}）
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheet(null)}
                    className="press w-full border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold active:bg-slate-50"
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
                  className="press w-full bg-[#1f5b8c] hover:bg-[#16446b] text-white py-3 rounded-xl font-semibold"
                >
                  今日また参拝を記録（{formatMD(today())}）
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/temple/${sheetTemple.id}`)}
                  className="press w-full border border-slate-200 text-slate-700 py-3 rounded-xl font-semibold active:bg-slate-50"
                >
                  詳細・写真を見る →
                </button>
                <button
                  type="button"
                  onClick={() => void undoLatest(sheetTemple.id)}
                  className="press w-full text-red-500 py-2 rounded-xl font-medium active:bg-red-50"
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
