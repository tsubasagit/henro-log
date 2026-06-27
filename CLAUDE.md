# CLAUDE.md — henro-log

## Overview
四国八十八ヶ所を「少しずつ」巡る歩みを、訪問1件ずつのイベントとして記録し、同行者や前回からの間隔まで横断的に振り返れる巡拝記録 PWA。

## Tech Stack
- Vite + React + TypeScript
- Tailwind CSS（スタイリング）
- Dexie.js（IndexedDB / ローカルファースト）
- vite-plugin-pwa（インストール可能・オフライン対応）
- React Router（画面遷移）
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
- ローカルファースト（MVPはサーバ・認証なし、端末内完結）
- データモデルは SERVICE_SPEC.md を正とする。変更時は両方を更新する
