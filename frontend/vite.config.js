import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Usando path.resolve com o caminho absoluto da pasta src
      '@': path.resolve(__dirname, 'src'), 
    },
  },
  // Se você for rodar apenas o Front localmente conectado ao Render, 
  // pode remover ou comentar o bloco 'server: { proxy: ... }' para evitar conflitos.
})