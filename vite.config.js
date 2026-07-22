import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Enable the service worker during `npm run dev` too, so you can
      // test "Install app" without doing a production build first.
      devOptions: {
        enabled: true,
      },
      includeAssets: ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Snake Game Premium',
        short_name: 'Snake Premium',
        description: 'A premium offline Snake game with accounts and high scores.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#1a1a2e',
        theme_color: '#0f3460',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
});
