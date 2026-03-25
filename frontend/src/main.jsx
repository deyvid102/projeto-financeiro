import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './components/ThemeContext';
import PinLock from './components/PinLock'; // Importando a nova trava por PIN

import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      {/* O PinLock agora envolve toda a aplicação. 
          - Se 'usePin' for false no localStorage, o App carrega direto.
          - Se 'usePin' for true, a tela de teclado numérico aparece antes do Dashboard.
      */}
      <PinLock>
        <App />
      </PinLock>
    </ThemeProvider>
  </StrictMode>,
)