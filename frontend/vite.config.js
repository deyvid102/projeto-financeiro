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
      // Isso garante que o "@" aponte exatamente para a pasta src 
      // independente de onde o Render rodar o comando de build
      '@': path.resolve(__dirname, 'src'), 
    },
  },
  // ... resto do seu config (server, proxy, etc)
})