import { useEffect, useRef, useState } from 'react';

export interface ViewerItem {
  url: string;
  title: string; // 例: 第1番 霊山寺
  subtitle: string; // 例: 2026-06-27
}

/** 記念フレーム付きの全画面フォトビューア（スワイプ/矢印/Escで操作） */
export default function PhotoViewer({
  items,
  initialIndex,
  onClose,
}: {
  items: ViewerItem[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [i, setI] = useState(initialIndex);
  const touchX = useRef<number | null>(null);

  const prev = () => setI((v) => (v - 1 + items.length) % items.length);
  const next = () => setI((v) => (v + 1) % items.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const cur = items[i];
  if (!cur) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      <div className="flex justify-between items-center p-3 text-white" onClick={(e) => e.stopPropagation()}>
        <span className="text-sm text-white/70">
          {i + 1} / {items.length}
        </span>
        <button type="button" onClick={onClose} aria-label="閉じる" className="text-3xl leading-none px-2">
          ×
        </button>
      </div>

      <div
        className="flex-1 flex items-center justify-center px-4"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (dx > 40) prev();
          else if (dx < -40) next();
          touchX.current = null;
        }}
      >
        <figure className="bg-white rounded-lg p-2 shadow-xl max-w-full">
          <img src={cur.url} alt={cur.title} className="block max-w-full max-h-[60vh] object-contain rounded" />
          <figcaption className="px-1 pt-2 pb-1 flex items-center justify-between gap-3">
            <span className="min-w-0">
              <span
                className="block font-bold text-slate-800 truncate"
                style={{ fontFamily: '"Hiragino Mincho ProN", "Yu Mincho", serif' }}
              >
                {cur.title}
              </span>
              <span className="block text-xs text-slate-500">{cur.subtitle}</span>
            </span>
            <span
              className="shrink-0 w-9 h-9 rounded-full border border-red-400 text-red-500 grid place-items-center text-center"
              style={{ fontFamily: 'serif', fontSize: '11px', lineHeight: 1 }}
              aria-hidden="true"
            >
              巡<br />拝
            </span>
          </figcaption>
        </figure>
      </div>

      {items.length > 1 && (
        <div className="flex justify-between px-2 pb-8 text-white text-4xl" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={prev} aria-label="前の写真" className="px-4 py-2 leading-none">
            ‹
          </button>
          <button type="button" onClick={next} aria-label="次の写真" className="px-4 py-2 leading-none">
            ›
          </button>
        </div>
      )}
    </div>
  );
}
