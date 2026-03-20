import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sun, Moon, User, LogOut, ChevronDown, Bell, 
  CheckCircle2, Target, TrendingUp, CircleAlert, Loader2, Wallet, X 
} from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const Topbar = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  // 1. Função de busca isolada para ser reutilizada
  const fetchSystemAlerts = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoadingNotifs(true);
    try {
      const [transRes, investRes, goalsRes] = await Promise.all([
        api.get('/transactions'), 
        api.get('/investments'),
        api.get('/goals')
      ]);

      const dismissedIds = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
      const alerts = [];
      const today = new Date();

      // --- Lógica de Alertas (Simplificada para o exemplo) ---
      
      // Recorrências
      transRes.data.filter(t => t.totalInstallments > 0).forEach(rec => {
        const id = `rec-${rec._id}`;
        if (rec.currentInstallment === rec.totalInstallments && !dismissedIds.includes(id)) {
          alerts.push({ id, title: 'Parcelas Finalizadas', desc: `"${rec.title}" concluída.`, icon: <CheckCircle2 size={14} className="text-emerald-500" />, date: new Date(rec.date) });
        }
      });

      // Investimentos
      investRes.data.forEach(inv => {
        const end = new Date(inv.endDate);
        const idLiquid = `inv-liquid-${inv._id}`;
        const idWithdraw = `inv-withdrawn-${inv._id}`;

        if (end <= today && !inv.isLiquidated && !dismissedIds.includes(idLiquid)) {
          alerts.push({ id: idLiquid, title: 'Saque Disponível', desc: `Resgate ${inv.name}`, icon: <Wallet size={14} className="text-amber-500" />, date: end });
        } else if (inv.status === 'sacado' && !dismissedIds.includes(idWithdraw)) {
          alerts.push({ id: idWithdraw, title: 'Valor Resgatado', desc: `"${inv.name}" enviado ao saldo.`, icon: <CheckCircle2 size={14} className="text-blue-500" />, date: new Date() });
        }
      });

      // Caixinhas
      goalsRes.data.forEach(goal => {
        const id = `goal-${goal._id}`;
        if (goal.currentAmount >= goal.targetAmount && !dismissedIds.includes(id)) {
          alerts.push({ id, title: 'Cofre Lotado!', desc: `Meta "${goal.name}" atingida.`, icon: <Target size={14} className="text-brand" />, date: new Date() });
        }
      });

      setNotifications(alerts.sort((a, b) => b.date - a.date));
    } catch (err) {
      console.error("Erro ao sincronizar notificações:", err);
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  // 2. Efeito de Atualização Automática (Polling)
  useEffect(() => {
    // Busca inicial (com loader)
    fetchSystemAlerts(false);

    // Cria o intervalo para atualizar silenciosamente a cada 30 segundos
    const interval = setInterval(() => {
      fetchSystemAlerts(true); 
    }, 30000); // 30s é um tempo seguro para não sobrecarregar o servidor

    return () => clearInterval(interval); // Limpa o intervalo ao fechar o componente
  }, [fetchSystemAlerts]);

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
    if (!dismissed.includes(id)) {
      localStorage.setItem('dismissed_notifications', JSON.stringify([...dismissed, id]));
    }
  };

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
        {/* Painel de Notificações */}
        <div className="relative">
          <button 
            onClick={() => { setIsNotifOpen(!isNotifOpen); setIsMenuOpen(false); }}
            className={`p-2.5 rounded-xl transition-all border relative ${
              isNotifOpen ? 'bg-bg-card border-border-ui text-brand shadow-lg' : 'text-text-secondary border-transparent hover:bg-bg-card/50 hover:text-brand'
            }`}
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-bg-main animate-pulse" />
            )}
          </button>

          {isNotifOpen && (
            <>
              <div className="fixed inset-0 z-[-1]" onClick={() => setIsNotifOpen(false)} />
              <div className="absolute right-0 mt-3 w-80 bg-bg-card border border-border-ui rounded-[2rem] shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-5 border-b border-border-ui/50 flex justify-between items-center bg-bg-main/20">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-text-primary">Monitor de Ativos</h3>
                  {notifications.length > 0 && (
                    <span className="px-2 py-0.5 bg-brand text-white text-[8px] font-black rounded-lg uppercase animate-pulse">
                      Live
                    </span>
                  )}
                </div>
                
                <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                  {loadingNotifs ? (
                    <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-brand" size={20} /></div>
                  ) : notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => dismissNotification(n.id)}
                        className="p-4 border-b border-border-ui/30 hover:bg-bg-main/40 transition-colors flex gap-4 relative group cursor-pointer"
                      >
                        <div className="mt-1 p-2 bg-bg-main rounded-lg h-fit border border-border-ui/50">{n.icon}</div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-text-primary uppercase tracking-tight">{n.title}</p>
                          <p className="text-[11px] text-text-secondary mt-1 leading-relaxed font-medium">{n.desc}</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={14} className="text-text-secondary hover:text-red-500" />
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

        {/* Tema e Perfil */}
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