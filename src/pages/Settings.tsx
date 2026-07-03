import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { TEMPLES } from '../data/temples';
import { useMusicOn, setMusicOn } from '../lib/music';

function today(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function Settings() {
  const profile = useLiveQuery(() => db.profile.get(1), []);
  const musicOn = useMusicOn();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (loaded) return;
    if (profile === undefined) return;
    setName(profile.name);
    setEmail(profile.email);
    setLoaded(true);
  }, [profile, loaded]);

  async function save() {
    await db.profile.put({ id: 1, name: name.trim(), email: email.trim() });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  /** デモ用：まだ参拝していない札所すべてに今日の日付で一括押印する */
  async function stampAll() {
    const have = new Set((await db.visits.toArray()).map((v) => v.templeId));
    const missing = TEMPLES.filter((t) => !have.has(t.id));
    if (missing.length === 0) return;
    const now = Date.now();
    await db.visits.bulkAdd(
      missing.map((t, i) => ({
        templeId: t.id,
        visitedOn: today(),
        companionIds: [],
        photoIds: [],
        nokyo: false,
        createdAt: now + i,
        updatedAt: now + i,
      })),
    );
  }

  /** デモ用：全参拝記録を消去（写真も削除） */
  async function resetAll() {
    if (!window.confirm('すべての参拝記録を消去しますか？（この端末のみ）')) return;
    await db.photos.clear();
    await db.visits.clear();
  }

  const labelCls = 'block text-sm font-semibold text-slate-600 mb-1';
  const fieldCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800';

  return (
    <div>
      <header className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 z-10">
        <h1 className="font-brush text-2xl text-[#1f5b8c] leading-none">設定</h1>
      </header>

      <div className="p-4 space-y-6">
        <section>
          <h2 className="text-sm font-semibold text-slate-600 mb-2">プロフィール</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls} htmlFor="profile-name">
                名前
              </label>
              <input
                id="profile-name"
                className={fieldCls}
                placeholder="お名前"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="profile-email">
                メールアドレス
              </label>
              <input
                id="profile-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                className={fieldCls}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={save}
              className="w-full bg-[#1f5b8c] hover:bg-[#16446b] text-white py-2.5 rounded-lg font-semibold"
            >
              保存する
            </button>
            {saved && <p className="text-sm text-green-600 text-center">保存しました</p>}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            ※ 現在は入力内容をこの端末に保存します。ユーザー認証は今後実装予定です。
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-600 mb-2">サウンド</h2>
          <button
            type="button"
            role="switch"
            aria-checked={musicOn}
            onClick={() => setMusicOn(!musicOn)}
            className="w-full flex items-center justify-between border border-slate-200 rounded-lg px-4 py-3 active:bg-slate-50"
          >
            <span className="text-left">
              <span className="block font-medium text-slate-800">音楽（BGM）</span>
              <span className="block text-xs text-slate-500">ファミコン風の巡礼テーマを流す</span>
            </span>
            <span
              className={`relative inline-block w-12 h-7 rounded-full transition-colors ${
                musicOn ? 'bg-[#1f5b8c]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                  musicOn ? 'translate-x-5' : ''
                }`}
              />
            </span>
          </button>
          <p className="text-xs text-slate-400 mt-2">
            ※ 端末に保存します。オフのときは音は鳴りません。
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-600 mb-2">デモ・お試し</h2>
          <div className="space-y-2">
            <button
              type="button"
              onClick={stampAll}
              className="w-full bg-[#c0392b] hover:bg-[#a5301f] text-white py-2.5 rounded-lg font-semibold"
            >
              全札所に一気に押印する 🖌
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="w-full border border-slate-200 text-slate-600 py-2.5 rounded-lg font-medium active:bg-slate-50"
            >
              参拝記録をすべて消去（リセット）
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            ※ お披露目・お試し用。押すと八十八ヶ所すべてに今日の日付で押印し、満願のお祝いが流れます。
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-600 mb-2">このアプリ</h2>
          <p className="text-sm text-slate-500">遍路ログ henro-log — 四国八十八ヶ所の巡拝記録（MVP）</p>
        </section>
      </div>
    </div>
  );
}
