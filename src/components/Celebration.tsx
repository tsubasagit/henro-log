import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { playFanfare } from '../lib/sfx';
import honHall from '../assets/img/temple-illust-4.png';

// 花火の打ち上げ位置・色・タイミング
const BURSTS = [
  { x: 22, y: 30, delay: 0, hue: 12 },
  { x: 74, y: 24, delay: 0.35, hue: 45 },
  { x: 48, y: 18, delay: 0.7, hue: 210 },
  { x: 30, y: 52, delay: 1.05, hue: 330 },
  { x: 68, y: 50, delay: 1.4, hue: 130 },
  { x: 50, y: 38, delay: 1.75, hue: 275 },
];
const PARTICLES = 16;
const RADIUS = 78;

function Burst({ x, y, delay, hue }: { x: number; y: number; delay: number; hue: number }) {
  return (
    <div className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
      {Array.from({ length: PARTICLES }, (_, i) => {
        const a = (i / PARTICLES) * Math.PI * 2;
        const style: CSSProperties = {
          background: `hsl(${hue + (i % 3) * 12}, 92%, 62%)`,
          animationDelay: `${delay}s`,
          ['--tx' as string]: `${Math.cos(a) * RADIUS}px`,
          ['--ty' as string]: `${Math.sin(a) * RADIUS}px`,
        };
        return <span key={i} className="fw-p" style={style} />;
      })}
    </div>
  );
}

/** 八十八ヶ所すべて達成したら、花火＋ファンファーレでお祝いする全画面ビュー */
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
          animation: fwExplode 1.5s ease-out infinite both; }
        @keyframes celeIn { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes celeFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes celeFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      `}</style>

      {/* 背景 */}
      <div className="absolute inset-0 bg-[#0b1f33]/85" style={{ animation: 'celeFade 0.3s ease both' }} />

      {/* 花火 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {BURSTS.map((b, i) => (
          <Burst key={i} {...b} />
        ))}
      </div>

      {/* お祝いカード */}
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl px-6 pt-6 pb-5 text-center shadow-2xl"
        style={{ animation: 'celeIn 0.5s cubic-bezier(0.22,1,0.36,1) both' }}
      >
        <img
          src={honHall}
          alt=""
          aria-hidden="true"
          className="mx-auto h-32 w-auto object-contain"
          style={{ animation: 'celeFloat 2.4s ease-in-out infinite' }}
        />
        <p className="text-3xl mt-1" aria-hidden="true">🎆 🎇 🎆</p>
        <h2 className="mt-2 text-2xl font-bold text-[#c0392b]" style={{ fontFamily: '"Yuji Board", serif' }}>
          満願成就
        </h2>
        <p className="mt-2 text-slate-700">
          四国八十八ヶ所すべて参拝しました。
          <br />
          結願、おめでとうございます。
        </p>
        <p className="mt-1 text-xs text-slate-400">同行二人 — よくぞ歩き通されました</p>
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
