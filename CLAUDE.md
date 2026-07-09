# CLAUDE.md — henro-log

## Overview
四国八十八ヶ所を「少しずつ」巡る歩みを、訪問1件ずつのイベントとして記録し、同行者や前回からの間隔まで横断的に振り返れる巡拝記録 PWA。

## Tech Stack
- Vite + React + TypeScript
- Tailwind CSS（スタイリング）
- Dexie.js（IndexedDB / ローカルファースト）
- vite-plugin-pwa（インストール可能・オフライン対応）
- React Router（画面遷移）
- Firebase Authentication（Google ＋ メール/パスワード。ログイン必須ゲート）
- 現在地→最寄り札所は `navigator.geolocation` ＋ ハバーサイン（`src/lib/geo.ts`）。地図は Google マップへのリンク方式（APIキー不要）＝`src/pages/NearbyView.tsx`（`/nearby` 地図タブ）
- 札所マスタは静的JSON（88件）を同梱

## Directory Structure
（プロジェクト初期化後に更新）

## Development
- `npm run dev` — 開発サーバー起動
- `npm run build` — ビルド
- `npm run preview` — ビルド成果物のプレビュー
- `npm run lint` — Lint実行

## Rules
- TypeScript を使用する
- コンポーネントは PascalCase
- 日本語UIテキスト
- 認証は Firebase Authentication（ログイン必須ゲート＝`src/auth/AuthGate.tsx`）。Firebase 設定値は `.env.local`（`VITE_FIREBASE_*`）＋ `src/lib/firebase.ts` の公開フォールバック。Firebase プロジェクト = `henro-log-ath`
- 参拝データはローカルファースト（IndexedDB / 端末内完結）。クラウド同期は将来対応
- データモデルは SERVICE_SPEC.md を正とする。変更時は両方を更新する
