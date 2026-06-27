import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // 実機テスト用に自己署名HTTPSで配信（iPhoneの共有シート=Web Share APIに必要）。
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
        start_url: '/',
        icons: [],
      },
    }),
  ],
});
