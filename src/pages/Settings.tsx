import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useMusicOn, setMusicOn } from '../lib/music';

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

  const labelCls = 'block text-sm font-semibold text-slate-600 mb-1';
  const fieldCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800';

  return (
    <div>
      <header className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 z-10">
        <h1 className="text-lg font-bold text-[#1f5b8c]">設定</h1>
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
          <h2 className="text-sm font-semibold text-slate-600 mb-2">このアプリ</h2>
          <p className="text-sm text-slate-500">遍路ログ henro-log — 四国八十八ヶ所の巡拝記録（MVP）</p>
        </section>
      </div>
    </div>
  );
}
