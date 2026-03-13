import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserLogin from './components/pages/login/UserLogin';
import UserRegister from './components/pages/login/UserRegister';
import DashPanel from './components/pages/panel/DashPanel';
import TransactionsPanel from './components/pages/panel/TransactionsPanel';
import SettingsPanel from './components/pages/panel/SettingsPanel';
import MainLayout from './components/layout/MainLayout';
import { AlertProvider } from './context/AlertContext'; // Importando o provedor
import './index.css';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <AlertProvider> {/* Alertas disponíveis em todo o App */}
        <div className="min-h-screen bg-bg-main transition-colors duration-300 flex flex-col">
          <main className="flex-1">
            <Routes>
              <Route path="/login" element={<UserLogin />} />
              <Route path="/register" element={<UserRegister />} />

              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <DashPanel />
                    </MainLayout>
                  </PrivateRoute>
                } 
              />

              <Route 
                path="/transactions" 
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <TransactionsPanel />
                    </MainLayout>
                  </PrivateRoute>
                } 
              />

              <Route 
                path="/settings" 
                element={
                  <PrivateRoute>
                    <MainLayout>
                      <SettingsPanel />
                    </MainLayout>
                  </PrivateRoute>
                } 
              />

              <Route path="/" element={<Navigate to="/login" replace />} />

              <Route path="*" element={
                <div className="flex flex-col items-center justify-center py-20 text-center min-h-[60vh]">
                  <h1 className="text-brand text-6xl font-black tracking-tighter">404</h1>
                  <p className="text-text-secondary font-bold uppercase text-xs tracking-[0.3em] mt-2">Página não encontrada</p>
                  <button 
                    onClick={() => window.history.back()}
                    className="mt-8 text-brand font-bold text-sm hover:underline"
                  >
                    Voltar para o início
                  </button>
                </div>
              } />
            </Routes>
          </main>

          <footer className="py-6 text-center w-full border-t border-border-ui bg-bg-card transition-colors">
            <code className="text-[10px] text-text-secondary opacity-60 uppercase tracking-widest">
              FinanceApp | Sistema Financeiro Pessoal
            </code>
          </footer>
        </div>
      </AlertProvider>
    </Router>
  );
}

export default App;