import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export default function Settings() {
  const profile = useLiveQuery(() => db.profile.get(1), []);
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
          <h2 className="text-sm font-semibold text-slate-600 mb-2">このアプリ</h2>
          <p className="text-sm text-slate-500">遍路ログ henro-log — 四国八十八ヶ所の巡拝記録（MVP）</p>
        </section>
      </div>
    </div>
  );
}
