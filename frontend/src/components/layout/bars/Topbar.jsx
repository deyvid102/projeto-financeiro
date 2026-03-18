import React, { useState, useEffect } from 'react';
import { 
  Sun, Moon, User, LogOut, ChevronDown, Bell, 
  CheckCircle2, Target, TrendingUp, CircleAlert, Loader2, Wallet 
} from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/Api';

const Topbar = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  useEffect(() => {
    const fetchSystemAlerts = async () => {
      setLoadingNotifs(true);
      try {
        const [transRes, investRes, goalsRes] = await Promise.all([
          api.get('/transactions'), 
          api.get('/investments'),
          api.get('/goals')
        ]);

        const alerts = [];
        const today = new Date();

        // 1. RECORRÊNCIAS (Parcelas finalizadas)
        const recurrings = transRes.data.filter(t => t.totalInstallments > 0);
        recurrings.forEach(rec => {
          if (rec.currentInstallment === rec.totalInstallments) {
            alerts.push({
              id: `rec-${rec._id}`,
              type: 'recurring',
              title: 'Parcelas Finalizadas',
              desc: `A recorrência "${rec.title || rec.description}" foi concluída.`,
              icon: <CheckCircle2 size={14} className="text-emerald-500" />,
              date: new Date(rec.date)
            });
          }
        });

        // 2. INVESTIMENTOS (Vencimento e Saques Pendentes)
        investRes.data.forEach(inv => {
          const end = new Date(inv.endDate);
          
          // Se a data de término passou E ainda não foi marcado como liquidado
          if (end <= today && !inv.isLiquidated) {
            alerts.push({
              id: `inv-liquid-${inv._id}`,
              type: 'invest',
              title: 'Saque Disponível',
              desc: `O investimento "${inv.name}" venceu. Realize o resgate de R$ ${inv.currentValue?.toLocaleString('pt-BR')}`,
              icon: <Wallet size={14} className="text-amber-500" />,
              date: end
            });
          } 
          // Alerta de que finaliza hoje (se status ainda não for finalizado)
          else if (end.toDateString() === today.toDateString() && inv.status !== 'finalizado') {
            alerts.push({
              id: `inv-end-${inv._id}`,
              type: 'invest',
              title: 'Vencimento Hoje',
              desc: `Seu título "${inv.name}" encerra o ciclo hoje.`,
              icon: <TrendingUp size={14} className="text-cyan-400" />,
              date: end
            });
          }
        });

        // 3. CAIXINHAS (Meta atingida)
        goalsRes.data.forEach(goal => {
          if (goal.currentAmount >= goal.targetAmount) {
            alerts.push({
              id: `goal-${goal._id}`,
              type: 'goal',
              title: 'Cofre Lotado!',
              desc: `Sua meta "${goal.name}" foi 100% atingida.`,
              icon: <Target size={14} className="text-brand" />,
              date: new Date()
            });
          }
        });

        setNotifications(alerts.sort((a, b) => b.date - a.date));
      } catch (err) {
        console.error("Erro ao carregar notificações:", err);
      } finally {
        setLoadingNotifs(false);
      }
    };

    fetchSystemAlerts();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="h-20 flex items-center justify-between px-8 bg-transparent relative z-40">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
          Bem-vindo de volta, <span className="text-brand italic">Deyvid</span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button 
            onClick={() => { setIsNotifOpen(!isNotifOpen); setIsMenuOpen(false); }}
            className={`p-2.5 rounded-xl transition-all border relative ${
              isNotifOpen ? 'bg-bg-card border-border-ui text-brand shadow-lg' : 'text-text-secondary border-transparent hover:bg-bg-card/50 hover:text-brand'
            }`}
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-bg-main animate-pulse" />
            )}
          </button>

          {isNotifOpen && (
            <>
              <div className="fixed inset-0 z-[-1]" onClick={() => setIsNotifOpen(false)} />
              <div className="absolute right-0 mt-3 w-80 bg-bg-card border border-border-ui rounded-[2rem] shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-5 border-b border-border-ui/50 flex justify-between items-center bg-bg-main/20">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-text-primary">Monitor de Ativos</h3>
                  <span className="px-2 py-0.5 bg-brand/10 text-brand text-[8px] font-black rounded-lg uppercase">
                    {notifications.length} Pendentes
                  </span>
                </div>
                
                <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                  {loadingNotifs ? (
                    <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-brand" size={20} /></div>
                  ) : notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div key={n.id} className="p-4 border-b border-border-ui/30 hover:bg-bg-main/40 transition-colors flex gap-4">
                        <div className="mt-1 p-2 bg-bg-main rounded-lg h-fit border border-border-ui/50">{n.icon}</div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-text-primary uppercase tracking-tight">{n.title}</p>
                          <p className="text-[11px] text-text-secondary mt-1 leading-relaxed font-medium">{n.desc}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center opacity-40">
                      <CircleAlert size={24} className="mx-auto mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest">Radar Limpo</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <button onClick={toggleTheme} className="p-2.5 rounded-xl text-text-secondary hover:bg-bg-card hover:text-brand transition-all border border-transparent hover:border-border-ui/50">
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative ml-2">
          <button onClick={() => { setIsMenuOpen(!isMenuOpen); setIsNotifOpen(false); }} className={`flex items-center gap-3 p-1.5 pr-4 rounded-2xl transition-all border ${isMenuOpen ? 'bg-bg-card border-border-ui shadow-sm' : 'hover:bg-bg-card/50 border-transparent'}`}>
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white shadow-lg shadow-brand/20 font-black italic">W</div>
            <ChevronDown size={14} className={`text-text-secondary transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-[-1]" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 mt-3 w-56 bg-bg-card border border-border-ui rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-5 border-b border-border-ui/50 bg-bg-main/10">
                  <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-1">Developer ADS</p>
                  <p className="text-xs font-bold text-text-primary truncate">Deyvid Wellington</p>
                </div>
                <div className="p-2">
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all cursor-pointer">
                    <LogOut size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;