import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
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
