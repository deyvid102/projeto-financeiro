import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './components/ThemeContext';
import BiometricLock from './components/BiometricLock'; // Importe o novo componente

import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      {/* O BiometricLock envolve o App. 
          Se 'useBiometry' estiver false no localStorage, ele apenas renderiza o <App />.
          Se estiver true, ele trava a tela até a digital/FaceID ser validada.
      */}
      <BiometricLock>
        <App />
      </BiometricLock>
    </ThemeProvider>
  </StrictMode>,
)