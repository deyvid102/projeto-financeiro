import React, { useState, useEffect } from 'react';
import { X, Check, Crown, Zap, Star, ShieldCheck } from 'lucide-react';
import api from '@/services/api';
import { getStoredPlan } from '@/utils/planUtils';

const ModalPlans = ({ isOpen, onClose }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingPlan, setUpdatingPlan] = useState(null);
  const currentPlanKey = getStoredPlan()?.toUpperCase() || 'STARTER';

  // Benefícios detalhados por plano para comparação visual
  const benefitsData = {
    STARTER: [
      { text: "Até 50 transações por mês", included: true },
      { text: "Até 3 caixinhas de metas", included: true },
      { text: "Gestão básica de cartões", included: true },
      { text: "Gráficos de gastos simples", included: true },
      { text: "Investimentos (Ações/FIIs)", included: false },
      { text: "FinanceMAX AI", included: false },
    ],
    PRO: [
      { text: "Transações ilimitadas", included: true },
      { text: "Caixinhas de metas ilimitadas", included: true },
      { text: "Módulo de Investimentos completo", included: true },
      { text: "Cotações em tempo real", included: true },
      { text: "Exportação de relatórios (PDF/Excel)", included: true },
      { text: "FinanceMAX AI", included: false },
    ],
    MAX: [
      { text: "Tudo do plano PRO", included: true },
      { text: "FinanceMAX AI (Consultoria com IA)", included: true },
      { text: "Análise preditiva de gastos", included: true },
      { text: "Sugestões de investimento automáticas", included: true },
      { text: "Suporte prioritário 24/7", included: true },
      { text: "Acesso antecipado a novas funções", included: true },
    ]
  };

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/plans');
      setPlans(res.data);
    } catch (err) {
      console.error("Erro ao carregar planos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (planKey) => {
    if (planKey === currentPlanKey) return;
    
    try {
      setUpdatingPlan(planKey);
      // Endpoint para realizar o upgrade/downgrade de plano
      await api.post('/subscriptions/subscribe', { planKey });
      
      // Atualiza o cache local de forma robusta
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...user, plan: planKey }));
      localStorage.setItem('user_plan', planKey); // Garante que utilitários que leem esta chave vejam a mudança
      
      onClose();
      window.location.reload(); // Recarrega para aplicar as novas permissões em todos os componentes
    } catch (err) {
      console.error("Erro ao alterar plano:", err);
      alert(err.response?.data?.message || "Erro ao processar alteração de plano.");
    } finally {
      setUpdatingPlan(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-bg-card border border-border-ui rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="p-6 border-b border-border-ui flex items-center justify-between bg-bg-main/20">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter text-text-primary">Planos de Assinatura</h2>
            <p className="text-xs text-text-secondary font-medium">Escolha o nível ideal para sua liberdade financeira</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-text-secondary">
            <X size={20} />
          </button>
        </div>

        {/* Lista de Planos */}
        <div className="p-6 overflow-y-auto custom-scrollbar bg-bg-main/10">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isCurrent = plan.key === currentPlanKey;
                const isMax = plan.key === 'MAX';
                const isPro = plan.key === 'PRO';

                return (
                  <div 
                    key={plan.key}
                    className={`relative flex flex-col p-6 rounded-2xl border-2 transition-all duration-300 ${
                      isCurrent 
                        ? 'border-brand bg-brand/5 shadow-lg shadow-brand/10' 
                        : isMax 
                          ? 'border-border-ui bg-bg-card hover:border-brand/40 shadow-xl' 
                          : 'border-border-ui hover:border-text-secondary/30 bg-bg-card/50'
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-white text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-widest z-10">
                        Plano Atual
                      </div>
                    )}

                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">{plan.name}</span>
                        {isCurrent && <Star size={14} className="text-brand fill-brand" />}
                        {!isCurrent && isPro && <Zap size={14} className="text-blue-400" />}
                        {!isCurrent && isMax && <Crown size={14} className="text-brand" />}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-text-primary">
                          {plan.price === 0 ? 'Grátis' : `R$ ${plan.price}`}
                        </span>
                        {plan.price > 0 && <span className="text-[10px] text-text-secondary font-bold">/mês</span>}
                      </div>
                    </div>

                    <div className="flex-1 space-y-4 mb-8">
                      {(benefitsData[plan.key] || plan.features || []).map((feature, idx) => (
                        <div key={idx} className="flex gap-3 items-start text-[11px]">
                          <div className={`mt-0.5 shrink-0 p-0.5 rounded-full ${feature.included ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-text-secondary opacity-30'}`}>
                            <Check size={10} strokeWidth={4} />
                          </div>
                          <span className={`${feature.included ? 'text-text-primary' : 'text-text-secondary opacity-40'} font-medium`}>
                            {feature.text}
                            {/* Badge de comparação: mostra o que o usuário ganha se fizer o upgrade */}
                            {plan.key !== currentPlanKey && feature.included && !benefitsData[currentPlanKey]?.some(b => b.text === feature.text && b.included) && (
                              <span className="ml-2 text-[8px] bg-brand/20 text-brand px-1.5 py-0.5 rounded-full font-black animate-pulse italic">NOVO</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      disabled={isCurrent || updatingPlan === plan.key}
                      onClick={() => handleUpdatePlan(plan.key)}
                      className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        isCurrent
                          ? 'bg-transparent border-2 border-brand/20 text-brand/50 cursor-default'
                          : isMax
                            ? 'bg-brand text-white hover:scale-[1.02] shadow-lg shadow-brand/20 active:scale-95'
                            : 'bg-white/5 text-text-primary hover:bg-white/10 active:scale-95'
                      }`}
                    >
                      {updatingPlan === plan.key ? 'Processando...' : isCurrent ? 'Plano Ativo' : plan.price === 0 ? 'Mudar para Grátis' : 'Selecionar Plano'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="p-6 bg-bg-main/30 border-t border-border-ui text-center">
          <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest flex items-center justify-center gap-2">
            <ShieldCheck size={14} className="text-green-500" />
            Pagamento Seguro & Upgrade Instantâneo
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModalPlans;