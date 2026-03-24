import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sun, Moon, LogOut, ChevronDown, Bell,
  CheckCircle2, Target, CircleAlert, Loader2, Wallet, X, BarChart3,
  Settings, TrendingUp, Info
} from 'lucide-react';
import { useTheme } from '@/components/ThemeContext';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';

import ModalSettings from '@/components/modals/ModalSettings'; 

const Topbar = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  const [userData, setUserData] = useState(() => {
    const rawName = localStorage.getItem('user_name');
    const rawUser = localStorage.getItem('user');
    let finalName = 'Usuário';

    if (rawName) {
      finalName = rawName;
    } else if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        finalName = parsed.name || parsed.username || 'Usuário';
      } catch (e) { finalName = 'Usuário'; }
    }

    return {
      name: finalName,
      initial: finalName.charAt(0).toUpperCase()
    };
  });

  const markAllAsRead = useCallback(() => {
    if (notifications.length === 0) return;
    const dismissedIds = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
    const currentNotifIds = notifications.map(n => n.id);
    const newDismissed = [...new Set([...dismissedIds, ...currentNotifIds])];
    localStorage.setItem('dismissed_notifications', JSON.stringify(newDismissed));
    
    if (notifications.some(n => n.id === 'update-beta-investments')) {
      localStorage.setItem('seen_update_version', '1.0.0-beta');
    }
  }, [notifications]);

  useEffect(() => {
    if (isNotifOpen) markAllAsRead();
  }, [isNotifOpen, markAllAsRead]);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    if (id === 'update-beta-investments') {
      localStorage.setItem('seen_update_version', '1.0.0-beta');
    }

    const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
    if (!dismissed.includes(id)) {
      localStorage.setItem('dismissed_notifications', JSON.stringify([...dismissed, id]));
    }
  }, []);

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

      const currentUpdateVersion = '1.0.0-beta';
      const hasSeenUpdate = localStorage.getItem('seen_update_version') === currentUpdateVersion;
      
      if (!hasSeenUpdate) {
        alerts.push({
          id: 'update-beta-investments',
          title: 'Nota de Atualização',
          desc: 'Foram feitas modificações nos investimentos (ainda em fase de testes). Qualquer problema, reporte ao admin para ajustes.',
          icon: <Info size={14} className="text-brand animate-pulse" />,
          date: new Date()
        });
      }

      const lastMonthDate = new Date();
      lastMonthDate.setMonth(today.getMonth() - 1);
      const summaryId = `summary-${lastMonthDate.getMonth() + 1}-${lastMonthDate.getFullYear()}`;
      if (!dismissedIds.includes(summaryId)) {
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        alerts.push({
          id: summaryId,
          title: 'Resumo Disponível',
          desc: `O relatório de ${monthNames[lastMonthDate.getMonth()]} está pronto.`,
          icon: <BarChart3 size={14} className="text-brand" />,
          date: new Date(today.getFullYear(), today.getMonth(), 1)
        });
      }

      transRes.data.filter(t => t.totalInstallments > 0).forEach(rec => {
        const id = `rec-${rec._id}`;
        if (rec.currentInstallment === rec.totalInstallments && !dismissedIds.includes(id)) {
          alerts.push({ id, title: 'Parcelas Finalizadas', desc: `"${rec.title}" concluída.`, icon: <CheckCircle2 size={14} className="text-emerald-500" />, date: new Date(rec.date) });
        }
      });

      investRes.data.forEach(inv => {
        const idLiquid = `inv-liquid-${inv._id}`;
        const idProfit = `inv-profit-${inv._id}`;

        const end = new Date(inv.endDate);
        if (inv.endDate && end <= today && !inv.isLiquidated && !dismissedIds.includes(idLiquid)) {
          alerts.push({ id: idLiquid, title: 'Saque Disponível', desc: `Resgate ${inv.name}`, icon: <Wallet size={14} className="text-amber-500" />, date: end });
        }

        if (inv.type !== 'renda fixa' && inv.currentPrice > 0 && inv.amountInvested > 0) {
          const currentValue = inv.currentPrice * (inv.quantity || 0);
          const profitPercent = ((currentValue - inv.amountInvested) / inv.amountInvested) * 100;
          
          if (profitPercent >= 5 && !dismissedIds.includes(idProfit)) {
            alerts.push({ 
              id: idProfit, 
              title: 'Ativo em Alta', 
              desc: `${inv.ticker || inv.name} valorizou ${profitPercent.toFixed(1)}%!`, 
              icon: <TrendingUp size={14} className="text-emerald-500" />, 
              date: new Date() 
            });
          }
        }
      });

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

  useEffect(() => {
    fetchSystemAlerts(false);
    const interval = setInterval(() => { fetchSystemAlerts(true); }, 45000);
    return () => clearInterval(interval);
  }, [fetchSystemAlerts]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 bg-transparent relative z-50 text-left">
      <div className="flex items-center gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
          Bem-vindo de volta, <span className="text-brand italic">{userData.name.split(' ')[0]}</span>
        </p>
      </div>

      <div className="flex items-center gap-1.5 md:gap-3">
        <div className="relative">
          <button 
            onClick={() => { setIsNotifOpen(!isNotifOpen); setIsMenuOpen(false); }}
            className={`p-2.5 rounded-xl transition-all border relative ${
              isNotifOpen ? 'bg-bg-card border-border-ui text-brand shadow-lg' : 'text-text-secondary border-transparent hover:bg-bg-card/50'
            }`}
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-bg-main animate-pulse" />
            )}
          </button>

          {isNotifOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-black/5 md:bg-transparent" onClick={() => setIsNotifOpen(false)} />
              <div className="fixed md:absolute top-16 md:top-full right-4 md:right-0 mt-2 w-[calc(100vw-2rem)] md:w-80 bg-bg-card border border-border-ui rounded-[2rem] shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden text-left">
                <div className="p-5 border-b border-border-ui/50 flex justify-between items-center bg-bg-main/20">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-text-primary">Monitor de Ativos</h3>
                  <button onClick={() => setIsNotifOpen(false)} className="md:hidden text-text-secondary p-1"><X size={16} /></button>
                </div>
                
                <div className="max-h-[60vh] md:max-h-[350px] overflow-y-auto custom-scrollbar">
                  {loadingNotifs ? (
                    <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-brand" size={20} /></div>
                  ) : notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className="p-4 border-b border-border-ui/30 hover:bg-bg-main/40 transition-colors flex gap-4 relative group"
                      >
                        <div className="mt-1 p-2 bg-bg-main rounded-lg h-fit border border-border-ui/50 shrink-0">{n.icon}</div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-[10px] font-black text-text-primary uppercase tracking-tight">{n.title}</p>
                          {/* REMOVIDO line-clamp-2 PARA MOSTRAR TEXTO INTEIRO */}
                          <p className="text-[11px] text-text-secondary mt-1 leading-relaxed font-medium">
                            {n.desc}
                          </p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); dismissNotification(n.id); }}
                          className="opacity-40 hover:opacity-100 transition-opacity self-start p-1"
                        >
                          <X size={14} className="text-text-secondary hover:text-red-500" />
                        </button>
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

        <button onClick={toggleTheme} className="p-2.5 rounded-xl text-text-secondary hover:bg-bg-card hover:text-brand transition-all border border-transparent">
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="relative">
          <button
            onClick={() => { setIsMenuOpen(!isMenuOpen); setIsNotifOpen(false); }}
            className={`flex items-center gap-2 p-1.5 rounded-2xl transition-all border ${isMenuOpen ? 'bg-bg-card border-border-ui shadow-sm' : 'border-transparent'}`}
          >
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white shadow-lg shadow-brand/20 font-black italic">
              {userData.initial}
            </div>
            <ChevronDown size={14} className={`hidden md:block text-text-secondary transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-black/5 md:bg-transparent" onClick={() => setIsMenuOpen(false)} />
              <div className="fixed md:absolute top-16 md:top-full right-4 md:right-0 mt-2 w-64 bg-bg-card border border-border-ui rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden text-left">
                <div className="p-5 border-b border-border-ui/50 bg-bg-main/10">
                  <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-1">Usuário</p>
                  <p className="text-xs font-bold text-text-primary truncate">{userData.name}</p>
                </div>
                <div className="p-2 space-y-1">
                  <button 
                    onClick={() => { setIsSettingsOpen(true); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-bg-main/60 hover:text-brand transition-all group"
                  >
                    <Settings size={16} className="group-hover:rotate-45 transition-transform duration-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Configurações</span>
                  </button>

                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all">
                    <LogOut size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ModalSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </header>
  );
};

export default Topbar;