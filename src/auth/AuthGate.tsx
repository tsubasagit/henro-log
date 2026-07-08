import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import Login from '../pages/Login';

/** 認証状態でアプリを分岐するゲート。未ログインならログイン画面を表示する。 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-white flex flex-col items-center justify-center gap-4 text-slate-500">
        <div className="text-4xl animate-pulse" aria-hidden="true">
          ⛩
        </div>
        <p className="font-brush text-lg text-[#1f5b8c]">読み込み中…</p>
      </div>
    );
  }

  if (!user) return <Login />;

  return <>{children}</>;
}
