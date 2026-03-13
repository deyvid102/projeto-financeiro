import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Quando o front chamar /api, o Vite redireciona
      '/api': {
        target: 'http://localhost:5000', // Verifique se seu Node está na 5000
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '') // COMENTE esta linha se o seu backend já usa /api nas rotas
      }
    }
  }
})