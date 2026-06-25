//rotompc-client\vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path' // 1. Import path

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // 2. Map the @ symbol to your src folder
      '@': path.resolve(__dirname, './src'),
    },
  },
})
