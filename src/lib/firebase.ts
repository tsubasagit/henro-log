import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase Web アプリの設定値は「公開されて問題ない」値（保護は Auth／セキュリティルールで行う）。
// ローカル開発では .env.local を、CI（GitHub Pages）では以下のフォールバックを使う。
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyBxzrDLLe58h8PXJsnk1T9E28nsLxUNCYU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'henro-log-ath.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'henro-log-ath',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'henro-log-ath.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '681800658616',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ?? '1:681800658616:web:efaeb89aec8a80381d0e4d',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
auth.languageCode = 'ja'; // 認証UI（Googleの同意画面など）を日本語に

export const googleProvider = new GoogleAuthProvider();
