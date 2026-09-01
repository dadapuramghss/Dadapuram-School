import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['student rise.png'],
      manifest: {
        name: 'Student Rise',
        short_name: 'Student Rise',
        description: 'Official Student Rise Portal for GHSS Dadapuram (Dhadhapuram / Dhadapuram) - DGHSS 360',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'student rise.png',
            sizes: '192x192 512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 5174,
    host: true,
  }
})
