import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';

// 本番（GitHub Pages）ではリポジトリ名のサブパス配下に配信する。
// 開発時は '/' のまま（basicSsl の自己署名HTTPS配信も維持）。
export default defineConfig(({ command }) => {
  const base = command === 'build' ? '/henro-log/' : '/';
  return {
    base,
    server: { allowedHosts: true },
    plugins: [
      basicSsl(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: '遍路ログ henro-log',
          short_name: '遍路ログ',
          description: '四国八十八ヶ所の巡拝記録',
          theme_color: '#1f5b8c',
          background_color: '#ffffff',
          display: 'standalone',
          lang: 'ja',
          start_url: base,
          scope: base,
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
      }),
    ],
  };
});
