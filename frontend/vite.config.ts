import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from "path"
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'vite.svg'],
      manifest: {
        name: 'AIBD - Transport Aéroport',
        short_name: 'AIBD',
        description: "Application de réservation de transport vers l'aéroport de Dakar",
        theme_color: '#5c52a0',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'fr',
        icons: [
          {
            src: '/vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: [
          '**/OneSignalSDKWorker.js',
          '**/OneSignalSDK*.js',
          '**/firebase-messaging-sw.js',
          '**/OneSignalSDK-v16-ServiceWorker/**'
        ],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true
      },
      dev: {
        enabled: false
      }
    })
  ],
  server: {
    host: '0.0.0.0', // Permet l'accès depuis le réseau local
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})

