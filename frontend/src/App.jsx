import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserLogin from './components/pages/login/UserLogin';
import UserRegister from './components/pages/login/UserRegister';
import DashPanel from './components/pages/panel/DashPanel';
import TransactionsPanel from './components/pages/panel/TransactionsPanel';
import ExpensesPanel from './components/pages/panel/ExpensesPanel';
import InvestmentPanel from './components/pages/panel/InvestmentPanel';
import DashGoal from './components/pages/panel/DashGoal'; 
import MainLayout from './components/layout/MainLayout';
import { AlertProvider } from './context/AlertContext';
import './index.css';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <AlertProvider>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/login" element={<UserLogin />} />
          <Route path="/register" element={<UserRegister />} />

          {/* Rota do Dashboard Principal */}
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

          {/* Rota de Transações Gerais */}
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

          {/* Painel de Despesas (Análise Detalhada) */}
          <Route 
            path="/expenses" 
            element={
              <PrivateRoute>
                <MainLayout>
                  <ExpensesPanel />
                </MainLayout>
              </PrivateRoute>
            } 
          />

          {/* Painel de Investimentos */}
          <Route 
            path="/investments" 
            element={
              <PrivateRoute>
                <MainLayout>
                  <InvestmentPanel />
                </MainLayout>
              </PrivateRoute>
            } 
          />

          {/* NOVA ROTA: Minhas Caixinhas (Metas) */}
          <Route 
            path="/goals" 
            element={
              <PrivateRoute>
                <MainLayout>
                  <DashGoal />
                </MainLayout>
              </PrivateRoute>
            } 
          />

          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Tela 404 centralizada */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center h-screen w-full bg-bg-main text-center p-8">
              <h1 className="text-brand text-8xl font-black tracking-tighter italic">404</h1>
              <p className="text-text-secondary font-bold uppercase text-xs tracking-[0.3em] mt-4">Página não encontrada</p>
              <button 
                onClick={() => window.history.back()}
                className="mt-8 bg-brand text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:opacity-90 shadow-lg shadow-brand/20 transition-all"
              >
                Voltar para o início
              </button>
            </div>
          } />
        </Routes>
      </AlertProvider>
    </Router>
  );
}

export default App;