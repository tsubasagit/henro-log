import { useState } from 'react';
import { useAuth, authErrorMessage } from '../auth/AuthContext';

type Mode = 'signin' | 'signup';

export default function Login() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogle() {
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle();
      // 成功すると onAuthStateChanged がゲートを解除する
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  const fieldCls =
    'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1f5b8c]/40';

  return (
    <div className="min-h-screen max-w-md mx-auto bg-white text-slate-800 flex flex-col justify-center px-6 py-10">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3" aria-hidden="true">
          ⛩
        </div>
        <h1 className="font-brush text-4xl text-[#1f5b8c] leading-none mb-2">遍路ログ</h1>
        <p className="text-sm text-slate-500">四国八十八ヶ所の巡拝記録</p>
      </div>

      {/* Google ログイン */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="w-full flex items-center justify-center gap-3 border border-slate-300 rounded-lg py-3 font-semibold text-slate-700 active:bg-slate-50 disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
          />
          <path
            fill="#FBBC05"
            d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
          />
        </svg>
        Googleでログイン
      </button>

      <div className="flex items-center gap-3 my-5">
        <span className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400">または</span>
        <span className="flex-1 h-px bg-slate-200" />
      </div>

      {/* メール + パスワード */}
      <form onSubmit={handleEmail} className="space-y-3">
        {mode === 'signup' && (
          <input
            className={fieldCls}
            placeholder="お名前（表示名）"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          className={fieldCls}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="メールアドレス"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={fieldCls}
          type="password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          placeholder="パスワード（6文字以上）"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-[#1f5b8c] hover:bg-[#16446b] text-white py-3 rounded-lg font-semibold disabled:opacity-60"
        >
          {busy ? '処理中…' : mode === 'signup' ? '新規登録' : 'ログイン'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin');
          setError('');
        }}
        className="mt-5 text-sm text-[#538bb0] hover:underline text-center"
      >
        {mode === 'signin'
          ? 'アカウントをお持ちでない方はこちら（新規登録）'
          : 'すでにアカウントをお持ちの方はこちら（ログイン）'}
      </button>

      <p className="text-xs text-slate-400 text-center mt-8 leading-relaxed">
        ログインすると、参拝の記録を安全に保存・同期できます。
      </p>
    </div>
  );
}
