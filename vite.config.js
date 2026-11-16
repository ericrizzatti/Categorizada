import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      ignored: ['**/.perfil-app/**', '**/*.log'],
    },
    warmup: {
      clientFiles: ['./src/main.jsx', './src/app.jsx', './src/paginas/*.jsx'],
    },
  },
})