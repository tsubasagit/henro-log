import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * 新しいバージョンを検知したら画面下部に「更新」通知を出す。
 * タップで新しい Service Worker を有効化し、ページを自動リロードして最新版に切り替える。
 */
export default function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md flex items-center gap-3 rounded-xl bg-[#1f5b8c] text-white shadow-lg px-4 py-3">
        <span className="text-lg" aria-hidden="true">
          ✨
        </span>
        <span className="flex-1 text-sm leading-snug">新しいバージョンがあります</span>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="press text-xs text-white/80 px-2 py-1"
        >
          あとで
        </button>
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className="press bg-white text-[#1f5b8c] font-semibold text-sm rounded-lg px-4 py-1.5"
        >
          更新
        </button>
      </div>
    </div>
  );
}
