import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, CheckCircle2, Target, CircleAlert, Loader2, 
  Wallet, X, TrendingUp, Sparkles, BrainCircuit 
} from 'lucide-react';
import api from '@/services/api';

// Adicionada a prop onCountChange para enviar o número para a Topbar
const NotificationCenter = ({ onCountChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- DISPARO DE NOTIFICAÇÃO NATIVA ---
  const triggerNativeNotification = useCallback(async (title, body) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      const registration = await navigator.serviceWorker?.getRegistration();
      if (registration) {
        registration.showNotification(title, {
          body: body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'finance-max-alert',
          renotify: true
        });
      } else {
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
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      if (onCountChange) onCountChange(updated.length); // Notifica a Topbar na remoção
      return updated;
    });
    const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
    if (!dismissed.includes(id)) {
      localStorage.setItem('dismissed_notifications', JSON.stringify([...dismissed, id]));
    }
  }, [onCountChange]);

  const fetchAlerts = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [investRes, aiRes, cartRes] = await Promise.all([
        api.get('/investments'),
        api.get('/ai/report'),
        api.get('/cart')
      ]);

      const dismissedIds = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
      const alerts = [];

      // 1. INSIGHT DA IA
      const aiData = aiRes.data?.insight;
      const aiId = `ai-insight-${new Date().toDateString()}`;
      if (aiData?.conselhoCurto && !dismissedIds.includes(aiId)) {
        alerts.push({
          id: aiId,
          title: 'Diretriz do Auditor IA',
          desc: aiData.conselhoCurto,
          icon: <BrainCircuit size={14} className="text-brand animate-pulse" />,
          isAi: true,
          date: new Date()
        });
      }

      // 2. METAS CONCLUÍDAS
      cartRes.data.forEach(item => {
        const idDone = `meta-done-${item._id}`;
        if (item.itemStatus === 'completed' && !dismissedIds.includes(idDone)) {
          alerts.push({
            id: idDone,
            title: 'Meta Alcançada! 🏆',
            desc: `O objetivo "${item.itemName}" foi finalizado com sucesso.`,
            icon: <CheckCircle2 size={14} className="text-emerald-500" />,
            date: new Date()
          });
        }
      });

      // 3. INVESTIMENTOS MATURADOS
      investRes.data.forEach(inv => {
        const idExpired = `inv-expired-${inv._id}`;
        const isExpired = inv.dueDate && new Date(inv.dueDate) <= new Date();
        if (isExpired && !dismissedIds.includes(idExpired)) {
          alerts.push({
            id: idExpired,
            title: 'Ativo Maturado 💰',
            desc: `O prazo de ${inv.ticker || inv.name} chegou ao fim. Verifique o resgate.`,
            icon: <Wallet size={14} className="text-amber-500" />,
            date: new Date()
          });
        }
      });

      // 4. RENTABILIDADE ALTA
      investRes.data.forEach(inv => {
        const idProfit = `inv-profit-${inv._id}`;
        const profitPercent = Number(inv.profitPercentage || 0);
        if (profitPercent >= 5 && !dismissedIds.includes(idProfit)) {
          alerts.push({ 
            id: idProfit, 
            title: 'Ativo em Alta! 🚀', 
            desc: `${inv.ticker || inv.name} valorizou ${profitPercent.toFixed(2)}%!`, 
            icon: <TrendingUp size={14} className="text-emerald-500" />, 
            date: new Date() 
          });
        }
      });

      // 5. NOTA DE ATUALIZAÇÃO
      const currentVersion = '1.2.0-stable';
      if (localStorage.getItem('seen_update_version') !== currentVersion) {
        const updateId = `update-${currentVersion}`;
        if (!dismissedIds.includes(updateId)) {
          alerts.push({
            id: updateId,
            title: 'Nova Versão Disponível',
            desc: 'Mentor IA atualizado com análise 50/50 e Auditoria Estruturada.',
            icon: <Sparkles size={14} className="text-brand" />,
            date: new Date()
          });
        }
      }

      const finalAlerts = alerts.sort((a, b) => b.date - a.date);
      setNotifications(finalAlerts);
      
      // Atualiza o estado numérico no componente pai (Topbar)
      if (onCountChange) onCountChange(finalAlerts.length);

    } catch (err) {
      console.error("Erro nas notificações:", err);
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    fetchAlerts(false);
    const interval = setInterval(() => fetchAlerts(true), 120000); 
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return (
    <div className="relative">
      {/* Botão de disparo controlado por fora ou mantido nativo */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2.5 rounded-xl transition-all border relative ${
          isOpen 
          ? 'bg-white dark:bg-[#0D0D12] border-gray-200 dark:border-white/10 text-brand shadow-lg' 
          : 'text-gray-500 border-transparent hover:bg-gray-100 dark:hover:bg-white/5'
        }`}
      >
        <Bell size={20} />
        {/* A bolinha vermelha estática foi removida daqui, pois o número será renderizado pela Topbar */}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="fixed md:absolute top-16 md:top-full right-4 md:right-0 mt-2 w-[calc(100vw-2rem)] md:w-80 bg-white dark:bg-[#0D0D12] border border-gray-200 dark:border-white/10 rounded-[24px] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white italic">Central de Inteligência</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-brand"><X size={16} /></button>
            </div>
            
            <div className="max-h-[380px] overflow-y-auto scrollbar-none">
              {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-brand" size={20} /></div>
              ) : notifications.length > 0 ? (
                notifications.map((n) => (
                  <div key={n.id} className={`p-4 border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors flex gap-4 relative ${n.isAi ? 'bg-brand/[0.02]' : ''}`}>
                    <div className="mt-1 p-2 bg-gray-100 dark:bg-white/5 rounded-xl h-fit border border-gray-200 dark:border-white/10 shrink-0">
                      {n.icon}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className={`text-[10px] font-black uppercase italic tracking-tight ${n.isAi ? 'text-brand' : 'text-gray-900 dark:text-white'}`}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-medium leading-relaxed italic line-clamp-3">
                        {n.desc}
                      </p>
                    </div>
                    <button onClick={() => dismissNotification(n.id)} className="opacity-20 hover:opacity-100 p-1 self-start transition-opacity">
                      <X size={14} className="hover:text-red-500" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center opacity-40">
                  <CircleAlert size={24} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Fluxo estabilizado</p>
                </div>
              )}
            </div>
            
            {Notification.permission !== 'granted' && (
               <button onClick={requestPermission} className="w-full p-4 bg-brand text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand/90 transition-all flex items-center justify-center gap-2">
                 <Bell size={14} /> Ativar Notificações Nativas
               </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;