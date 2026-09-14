import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': 'http://192.168.1.37:5051',
      '/auth': 'http://192.168.1.37:5051',
    },
  },
})
