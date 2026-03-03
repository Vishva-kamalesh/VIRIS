import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Enable PWA in dev mode so you can test it without building
      devOptions: {
        enabled: true,
        type: 'module',
      },
      includeAssets: ['icon-192.svg', 'icon-512.svg'],
      manifest: {
        name: 'VIRIS – E-Challan Management System',
        short_name: 'VIRIS',
        description:
          'Vision-Based Rider Safety Monitoring & E-Challan Management System. AI-powered helmet violation detection and digital fine management.',
        theme_color: '#1E3A8A',
        background_color: '#0F172A',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2}'],
        // Don't cache opaque responses (avoids SW install failure)
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/localhost:9000\/violations/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-violations',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /^https?:\/\/localhost:9000\/violations\/monthly/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-monthly',
              expiration: { maxEntries: 10, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
})
