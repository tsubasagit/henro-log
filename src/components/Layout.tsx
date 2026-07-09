import { useEffect, useRef } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useIsScrolling } from '../lib/useIsScrolling';
import { useMusicOn } from '../lib/music';
import Celebration from './Celebration';
import bgmSrc from '../assets/audio/henro-bgm.mp3';

const tabs = [
  { to: '/', label: '札所', icon: '⛩' },
  { to: '/timeline', label: '記録', icon: '🕒' },
  { to: '/album', label: '写真', icon: '🖼' },
  { to: '/nearby', label: '地図', icon: '📍' },
  { to: '/settings', label: '設定', icon: '⚙' },
];

export default function Layout() {
  const scrolling = useIsScrolling(); // スクロール中はフッターを透明にして背景を見せる
  const musicOn = useMusicOn();
  const audioRef = useRef<HTMLAudioElement>(null);

  // 設定の ON/OFF に合わせて BGM を再生／停止
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = 0.45;
    if (musicOn) {
      void a.play().catch(() => {
        // 自動再生がブロックされた場合は、次のタップで再開する
      });
    } else {
      a.pause();
    }
  }, [musicOn]);

  // 自動再生ブロック対策：最初のタップで、ONなら再生を開始する
  useEffect(() => {
    if (!musicOn) return;
    const resume = () => {
      const a = audioRef.current;
      if (a && a.paused) void a.play().catch(() => {});
    };
    window.addEventListener('pointerdown', resume, { once: true });
    return () => window.removeEventListener('pointerdown', resume);
  }, [musicOn]);

  return (
    <div className="relative min-h-screen max-w-md mx-auto bg-white text-slate-800 pb-16 shadow-sm">
      <audio ref={audioRef} src={bgmSrc} loop preload="auto" />

      {/* 押印の墨だまり・かすれ用 SVG フィルタ（.ink-a/b/c から参照。全画面で使う） */}
      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        <defs>
          <filter id="henro-ink-a" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" />
          </filter>
          <filter id="henro-ink-b" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="11" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="3" />
          </filter>
          <filter id="henro-ink-c" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="3" seed="23" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2" result="disp" />
            <feTurbulence type="fractalNoise" baseFrequency="0.28" numOctaves="3" seed="7" result="rough" />
            <feColorMatrix
              in="rough"
              type="matrix"
              values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 10 -3.2"
              result="mask"
            />
            <feComposite in="disp" in2="mask" operator="in" />
          </filter>
        </defs>
      </svg>

      <Celebration />
      <Outlet />

      <nav
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md grid grid-cols-5 z-10 transition-colors duration-300 pb-[env(safe-area-inset-bottom)] ${
          scrolling
            ? 'bg-transparent border-t border-transparent'
            : 'bg-white/95 backdrop-blur border-t border-slate-200'
        }`}
      >
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            viewTransition
            className={({ isActive }) =>
              `press flex flex-col items-center pt-1.5 pb-2 text-xs ${
                isActive ? 'text-[#1f5b8c]' : 'text-slate-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`grid place-items-center h-7 px-4 rounded-full text-base leading-none transition-colors ${
                    isActive ? 'bg-[#1f5b8c]/10' : 'bg-transparent'
                  }`}
                >
                  {t.icon}
                </span>
                <span className={`mt-0.5 font-brush text-[13px] ${isActive ? 'font-semibold' : ''}`}>
                  {t.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
