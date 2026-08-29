import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/AuraStream-/', // <--- Baris penyelemat whitescreen ada di sini
  
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api/music/': {
        target: 'https://justlann.my.id',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // <--- Tips tambahan untuk proxy
      },
    },
  },
})
