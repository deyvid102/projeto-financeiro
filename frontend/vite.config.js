import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url' // Importe isso
import path from 'path'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
  '@': path.resolve(__dirname, './src'), // Garanta que o "./" está ali para indicar "pasta atual"
},
  },
  // ... resto do seu config (server, proxy, etc)
})