import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(({ command }) => {
  return {
    // Relative base path ('./') or exact repo name '/PB-CivilLab/'
    // Using './' ensures assets load correctly regardless of URL casing (PB-CivilLab vs pb-civillab)
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // "prompt" tells the service worker NOT to take over automatically with skipWaiting,
        // allowing the UI to prompt the user before reloading.
        registerType: 'prompt',
        includeAssets: ['favicon.ico', 'logo.svg', 'logo-icon.svg', 'manifest.json'],
        manifest: {
          id: './',
          name: 'PB CivilLab — Civil Engineering Suite',
          short_name: 'PB CivilLab',
          description: 'Professional Civil Engineering Software Suite by Prokash Biswas.',
          theme_color: '#0f172a',
          background_color: '#0b0f17',
          display: 'standalone',
          start_url: './',
          scope: './',
          icons: [
            {
              src: './logo-icon.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          // Cache code chunks, styles, html, and media
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          // Clean up older caches from previous builds to prevent stale files accumulation
          cleanupOutdatedCaches: true,
          // When user clicks update, allow the new service worker to claim clients immediately
          clientsClaim: true,
          // Crucial: keep skipWaiting false so it waits in waiting state until prompted
          skipWaiting: false,
          runtimeCaching: [
            {
              // Pass API calls directly to the network without caching
              urlPattern: /^\/api\/.*/i,
              handler: 'NetworkOnly',
            },
            {
              // Google Fonts caching
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname ?? '.', '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name].[ext]',
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
