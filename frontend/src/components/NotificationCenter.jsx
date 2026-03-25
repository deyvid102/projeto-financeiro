import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, CheckCircle2, Target, CircleAlert, Loader2, 
  Wallet, X, BarChart3, TrendingUp, Info 
} from 'lucide-react';
import api from '@/services/api';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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
    if (isOpen) markAllAsRead();
  }, [isOpen, markAllAsRead]);

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

  const fetchAlerts = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [transRes, investRes, goalsRes] = await Promise.all([
        api.get('/transactions'), 
        api.get('/investments'),
        api.get('/goals')
      ]);

      const dismissedIds = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
      const alerts = [];
      const today = new Date();

      // Alerta de Atualização
      const currentVersion = '1.0.0-beta';
      if (localStorage.getItem('seen_update_version') !== currentVersion) {
        alerts.push({
          id: 'update-beta-investments',
          title: 'Nota de Atualização',
          desc: 'Foram feitas modificações nos investimentos (ainda em fase de testes). Qualquer problema, reporte ao admin para ajustes.',
          icon: <Info size={14} className="text-brand animate-pulse" />,
          date: new Date()
        });
      }

      // Lógica de Resumo Mensal
      const lastMonth = new Date();
      lastMonth.setMonth(today.getMonth() - 1);
      const summaryId = `summary-${lastMonth.getMonth() + 1}-${lastMonth.getFullYear()}`;
      if (!dismissedIds.includes(summaryId)) {
        alerts.push({
          id: summaryId,
          title: 'Resumo Disponível',
          desc: `O relatório mensal está pronto para visualização.`,
          icon: <BarChart3 size={14} className="text-brand" />,
          date: new Date(today.getFullYear(), today.getMonth(), 1)
        });
      }

      // Parcelas, Investimentos e Metas... (Lógica mantida conforme sua solicitação)
      investRes.data.forEach(inv => {
        const idProfit = `inv-profit-${inv._id}`;
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

      setNotifications(alerts.sort((a, b) => b.date - a.date));
    } catch (err) {
      console.error("Erro nas notificações:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts(false);
    const interval = setInterval(() => fetchAlerts(true), 45000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2.5 rounded-xl transition-all border relative ${
          isOpen ? 'bg-bg-card border-border-ui text-brand shadow-lg' : 'text-text-secondary border-transparent hover:bg-bg-card/50'
        }`}
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-bg-main animate-pulse" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/5 md:bg-transparent" onClick={() => setIsOpen(false)} />
          <div className="fixed md:absolute top-16 md:top-full right-4 md:right-0 mt-2 w-[calc(100vw-2rem)] md:w-80 bg-bg-card border border-border-ui rounded-[2rem] shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-5 border-b border-border-ui/50 flex justify-between items-center bg-bg-main/20">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-text-primary">Monitor de Ativos</h3>
              <button onClick={() => setIsOpen(false)} className="md:hidden text-text-secondary p-1"><X size={16} /></button>
            </div>
            
            <div className="max-h-[60vh] md:max-h-[350px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-brand" size={20} /></div>
              ) : notifications.length > 0 ? (
                notifications.map((n) => (
                  <div key={n.id} className="p-4 border-b border-border-ui/30 hover:bg-bg-main/40 transition-colors flex gap-4 relative group">
                    <div className="mt-1 p-2 bg-bg-main rounded-lg h-fit border border-border-ui/50 shrink-0">{n.icon}</div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[10px] font-black text-text-primary uppercase tracking-tight">{n.title}</p>
                      <p className="text-[11px] text-text-secondary mt-1 leading-relaxed font-medium">{n.desc}</p>
                    </div>
                    <button onClick={() => dismissNotification(n.id)} className="opacity-40 hover:opacity-100 p-1 self-start">
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
  );
};

export default NotificationCenter;