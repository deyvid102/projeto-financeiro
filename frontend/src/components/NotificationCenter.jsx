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

  // --- DISPARO DE NOTIFICAÇÃO NATIVA (VIA SERVICE WORKER) ---
  const triggerNativeNotification = useCallback(async (title, body) => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      // Tenta disparar via Service Worker (Melhor para PWA/Chrome)
      const registration = await navigator.serviceWorker?.getRegistration();
      
      if (registration) {
        registration.showNotification(title, {
          body: body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          vibrate: [200, 100, 200],
          tag: 'finance-max-alert', // Evita spam de notificações iguais
          renotify: true
        });
      } else {
        // Fallback caso não haja service worker ativo no momento
        new Notification(title, { body, icon: '/pwa-192x192.png' });
      }
    }
  }, []);

  const requestPermission = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      triggerNativeNotification("FinanceMAX", "As notificações estão ativadas!");
    }
  };

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
    if (!dismissed.includes(id)) {
      localStorage.setItem('dismissed_notifications', JSON.stringify([...dismissed, id]));
    }
  }, []);

  const fetchAlerts = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [investRes] = await Promise.all([api.get('/investments')]);
      const dismissedIds = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
      const alerts = [];

      // Exemplo: Alerta de Versão Beta
      const currentVersion = '1.0.0-beta';
      if (localStorage.getItem('seen_update_version') !== currentVersion) {
        const id = 'update-beta-investments';
        if (!dismissedIds.includes(id)) {
          alerts.push({
            id,
            title: 'Nota de Atualização',
            desc: 'Sistema de investimentos atualizado para Beta 1.0.',
            icon: <Info size={14} className="text-brand animate-pulse" />,
            date: new Date()
          });
          // Notificação no Dispositivo
          triggerNativeNotification('FinanceMAX Atualizado', 'Confira as novidades no painel de investimentos.');
          localStorage.setItem('seen_update_version', currentVersion);
        }
      }

      // Exemplo: Alerta de Rentabilidade Alta (Profit > 5%)
      investRes.data.forEach(inv => {
        const idProfit = `inv-profit-${inv._id}`;
        const profitPercent = Number(inv.profitPercentage || 0);

        if (profitPercent >= 5 && !dismissedIds.includes(idProfit)) {
          const title = 'Ativo em Alta! 🚀';
          const msg = `${inv.ticker || inv.name} subiu ${profitPercent.toFixed(2)}%!`;
          
          alerts.push({ 
            id: idProfit, 
            title: title, 
            desc: msg, 
            icon: <TrendingUp size={14} className="text-emerald-500" />, 
            date: new Date() 
          });
          
          triggerNativeNotification(title, msg);
        }
      });

      setNotifications(alerts.sort((a, b) => b.date - a.date));
    } catch (err) {
      console.error("Erro nas notificações:", err);
    } finally {
      setLoading(false);
    }
  }, [triggerNativeNotification]);

  useEffect(() => {
    fetchAlerts(false);
    const interval = setInterval(() => fetchAlerts(true), 60000); // 1 minuto
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
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="fixed md:absolute top-16 md:top-full right-4 md:right-0 mt-2 w-[calc(100vw-2rem)] md:w-80 bg-bg-card border border-border-ui rounded-[2rem] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-border-ui/50 flex justify-between items-center bg-bg-main/20">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-text-primary italic">Alertas do Sistema</h3>
              <button onClick={() => setIsOpen(false)} className="text-text-secondary hover:text-brand"><X size={16} /></button>
            </div>
            
            <div className="max-h-[350px] overflow-y-auto">
              {loading ? (
                <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-brand" size={20} /></div>
              ) : notifications.length > 0 ? (
                notifications.map((n) => (
                  <div key={n.id} className="p-4 border-b border-border-ui/30 hover:bg-bg-main/40 transition-colors flex gap-4 relative">
                    <div className="mt-1 p-2 bg-bg-main rounded-lg h-fit border border-border-ui/50 shrink-0">{n.icon}</div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[10px] font-black text-text-primary uppercase italic tracking-tight">{n.title}</p>
                      <p className="text-[11px] text-text-secondary mt-1 font-medium">{n.desc}</p>
                    </div>
                    <button onClick={() => dismissNotification(n.id)} className="opacity-40 hover:opacity-100 p-1 self-start transition-opacity">
                      <X size={14} className="text-text-secondary hover:text-red-500" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center opacity-40">
                  <CircleAlert size={24} className="mx-auto mb-2" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Nenhum alerta pendente</p>
                </div>
              )}
            </div>
            
            {/* CTA para permissão nativa se estiver bloqueado ou padrão */}
            {Notification.permission !== 'granted' && (
               <button 
                onClick={requestPermission}
                className="w-full p-4 bg-brand text-white text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all flex items-center justify-center gap-2"
               >
                 <Bell size={14} /> Ativar Notificações no Chrome
               </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;