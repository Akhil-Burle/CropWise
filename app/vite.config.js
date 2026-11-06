import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// Build-time data source: mock (default, offline demo) or http (real backend). See src/services/index.ts.
const dataSource = process.env.VITE_DATA_SOURCE === 'http' ? 'http' : 'mock';

export default defineConfig({
  plugins: [
    react(),
    // Installable web app + offline app shell. The Android app loads files locally and skips this.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png', 'samples/*.svg'],
      manifest: {
        name: 'CropWise – crop advice',
        short_name: 'CropWise',
        description: 'Check your crop, read your soil card and get safe chemical and organic advice.',
        lang: 'en-IN',
        start_url: '/app',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F6F2E9',
        theme_color: '#1F4D33',
        categories: ['productivity', 'education'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        // Fonts are split per script; only the ones a page actually uses are downloaded and kept.
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // API calls must never be served from the app-shell cache.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  resolve: {
    alias: {
      '@data-source': fileURLToPath(new URL(`./src/services/source.${dataSource}.ts`, import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2019',
    sourcemap: 'hidden',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          i18n: ['i18next', 'react-i18next'],
          validation: ['zod'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
