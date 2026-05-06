import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'TCG Collector',
        short_name: 'TCG Collector',
        description: 'Inventoriez et organisez votre collection de cartes.',
        theme_color: '#0F0F12',
        background_color: '#0F0F12',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'fr',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cards\.scryfall\.io\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'scryfall-images',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          // Heavy, lazy-loaded only on the Scan page — keep isolated so it
          // never leaks into the main chunk via barrel imports.
          if (id.includes('tesseract.js')) {
            return 'ocr-vendor';
          }
          if (id.includes('react-router') || id.includes('/react-dom/') || /\/react\//.test(id)) {
            return 'react-vendor';
          }
          if (id.includes('@radix-ui') || id.includes('vaul') || id.includes('lucide-react')) {
            return 'ui-vendor';
          }
          if (id.includes('@tanstack') || id.includes('dexie')) {
            return 'data-vendor';
          }
          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'i18n-vendor';
          }
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('/zod/')) {
            return 'form-vendor';
          }
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 250,
  },
});
