import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { playFanfare } from '../lib/sfx';
import honHall from '../assets/img/temple-illust-4.png';

// 金屏風のパネル（6曲一隻）。互い違いの金グラデで折り目を表現する
const PANELS = Array.from({ length: 6 }, (_, i) => i);

// 花火（金地に映える深い色）
const BURSTS = [
  { x: 20, y: 26, delay: 0.5, hue: 8, sat: 78, lit: 42 }, // 朱
  { x: 76, y: 22, delay: 0.85, hue: 215, sat: 60, lit: 38 }, // 藍
  { x: 48, y: 16, delay: 1.2, hue: 152, sat: 55, lit: 32 }, // 松葉
  { x: 28, y: 50, delay: 1.55, hue: 288, sat: 45, lit: 40 }, // 江戸紫
  { x: 70, y: 48, delay: 1.9, hue: 8, sat: 78, lit: 42 },
  { x: 50, y: 36, delay: 2.25, hue: 215, sat: 60, lit: 38 },
];
const PARTICLES = 16;
const RADIUS = 78;

// 舞い散る金箔
const FLAKES = Array.from({ length: 14 }, (_, i) => ({
  left: (i * 7.3 + (i % 3) * 4) % 100,
  delay: (i % 7) * 0.35,
  dur: 3.2 + (i % 5) * 0.55,
  size: 5 + (i % 3) * 3,
  drift: i % 2 === 0 ? 14 : -18,
}));

function Burst({ x, y, delay, hue, sat, lit }: (typeof BURSTS)[number]) {
  return (
    <div className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
      {Array.from({ length: PARTICLES }, (_, i) => {
        const a = (i / PARTICLES) * Math.PI * 2;
        const style: CSSProperties = {
          background: `hsl(${hue + (i % 3) * 8}, ${sat}%, ${lit + (i % 2) * 8}%)`,
          animationDelay: `${delay}s`,
          ['--tx' as string]: `${Math.cos(a) * RADIUS}px`,
          ['--ty' as string]: `${Math.sin(a) * RADIUS}px`,
        };
        return <span key={i} className="fw-p" style={style} />;
      })}
    </div>
  );
}

/** 八十八ヶ所すべて達成したら、金屏風＋花火＋ファンファーレでお祝いする全画面ビュー */
export default function Celebration() {
  const visits = useLiveQuery(() => db.visits.toArray(), []);
  const visitedCount = visits ? new Set(visits.map((v) => v.templeId)).size : 0;
  const [show, setShow] = useState(false);
  const prev = useRef<number | null>(null);

  useEffect(() => {
    if (visits === undefined) return; // 読み込み前
    if (prev.current === null) {
      prev.current = visitedCount; // 初回は基準にするだけ（起動時に自動発火させない）
      return;
    }
    if (prev.current < 88 && visitedCount >= 88) {
      setShow(true);
      playFanfare();
    }
    prev.current = visitedCount;
  }, [visitedCount, visits]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6" role="dialog" aria-label="満願成就">
      <style>{`
        @keyframes fwExplode {
          0% { transform: translate(0,0) scale(1); opacity: 0; }
          8% { opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0.2); opacity: 0; }
        }
        .fw-p { position: absolute; width: 7px; height: 7px; border-radius: 9999px;
          animation: fwExplode 1.6s ease-out infinite both; }
        @keyframes byobuUnfold { from { transform: scaleX(0.02); opacity: 0.4; } to { transform: scaleX(1); opacity: 1; } }
        .byobu-panel { transform-origin: left center; animation: byobuUnfold 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes goldShimmer { 0%,100% { opacity: 0.0; } 50% { opacity: 0.35; } }
        @keyframes flakeFall {
          0% { transform: translateY(-8vh) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.9; }
          100% { transform: translateY(108vh) translateX(var(--dx)) rotate(560deg); opacity: 0; }
        }
        @keyframes celeIn { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes celeFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes sealPress { 0% { transform: scale(1.9) rotate(-14deg); opacity: 0; } 55% { transform: scale(0.94) rotate(-8deg); opacity: 1; } 100% { transform: scale(1) rotate(-8deg); opacity: 1; } }
      `}</style>

      {/* 金屏風（六曲・順に開く） */}
      <div className="absolute inset-0 flex" aria-hidden="true">
        {PANELS.map((i) => (
          <div
            key={i}
            className="byobu-panel flex-1 h-full"
            style={{
              animationDelay: `${i * 0.07}s`,
              background:
                i % 2 === 0
                  ? 'linear-gradient(100deg, #f4df90 0%, #e6c868 45%, #d3ab47 100%)'
                  : 'linear-gradient(80deg, #caa23e 0%, #e0bf5e 55%, #f0d783 100%)',
              boxShadow:
                i % 2 === 0
                  ? 'inset -10px 0 18px rgba(120, 85, 20, 0.38)'
                  : 'inset 10px 0 18px rgba(120, 85, 20, 0.30)',
            }}
          />
        ))}
      </div>
      {/* 金のきらめきと縁のヴィネット */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: 'linear-gradient(115deg, transparent 30%, rgba(255,250,220,0.9) 50%, transparent 70%)',
          animation: 'goldShimmer 3.2s ease-in-out infinite',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(80,55,10,0.35) 100%)' }}
      />

      {/* 舞い散る金箔 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {FLAKES.map((f, i) => (
          <span
            key={i}
            className="absolute top-0 rounded-[1px]"
            style={{
              left: `${f.left}%`,
              width: f.size,
              height: f.size,
              background: 'linear-gradient(135deg, #fff3c0, #d9b44a)',
              animation: `flakeFall ${f.dur}s linear ${f.delay}s infinite both`,
              ['--dx' as string]: `${f.drift}px`,
            }}
          />
        ))}
      </div>

      {/* 花火 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {BURSTS.map((b, i) => (
          <Burst key={i} {...b} />
        ))}
      </div>

      {/* お祝いカード（和紙＋金縁） */}
      <div
        className="relative w-full max-w-sm rounded-2xl px-6 pt-6 pb-5 text-center shadow-2xl"
        style={{
          animation: 'celeIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.35s both',
          background: 'var(--henro-washi, #f6f1e4)',
          border: '3px double #b08a2e',
        }}
      >
        {/* 朱印（巡拝） */}
        <span
          className="font-brush ink-b absolute top-3 right-3 w-12 h-12 rounded-full grid place-items-center border-[2.5px] border-[#c0392b] text-[#c0392b] text-sm leading-none"
          style={{ background: 'rgba(192,57,43,0.10)', animation: 'sealPress 0.5s ease 1.1s both' }}
          aria-hidden="true"
        >
          巡
          <br />
          拝
        </span>

        <img
          src={honHall}
          alt=""
          aria-hidden="true"
          className="mx-auto h-32 w-auto object-contain"
          style={{ animation: 'celeFloat 2.4s ease-in-out infinite' }}
        />
        <h2 className="font-brush ink-a mt-3 text-4xl text-[#c0392b]">満願成就</h2>
        <p className="mt-2 text-slate-700">
          四国八十八ヶ所すべて参拝しました。
          <br />
          結願、おめでとうございます。
        </p>
        <p className="mt-1 text-xs text-slate-500">同行二人 — よくぞ歩き通されました</p>
        <button
          type="button"
          onClick={() => setShow(false)}
          className="press mt-5 w-full bg-[#1f5b8c] hover:bg-[#16446b] text-white py-3 rounded-xl font-semibold"
        >
          とじる
        </button>
      </div>
    </div>
  );
}
