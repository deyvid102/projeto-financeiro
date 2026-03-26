import React, { useMemo, useState } from 'react';
import { 
  X, TrendingUp, Target, ArrowUpRight, ArrowDownRight, Activity, 
  Calendar, Wallet, BarChart3, Loader2, CheckCircle2 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/services/api';
import { useAlert } from '../../context/AlertContext';

const ModalInvestmentDetail = ({ isOpen, investment, onClose, onRefresh }) => {
  const { showAlert } = useAlert();
  const [isLiquidating, setIsLiquidating] = useState(false);

  // --- MOVIDO PARA CIMA DO "IF" ---
  const chartData = useMemo(() => {
    // Se não houver investimento, retorna um array vazio para o hook não quebrar
    if (!investment) return [];
    
    const start = new Date(investment.startDate || Date.now());
    const end = new Date();
    const points = [];
    const steps = 8; 

    const initialValue = Number(investment.amountInvested) || 0;
    const currentValue = Number(investment.currentTotalValue) || 0;
    
    for (let i = 0; i <= steps; i++) {
      const date = new Date(start.getTime() + (end.getTime() - start.getTime()) * (i / steps));
      const progress = i / steps;
      const trend = initialValue + (currentValue - initialValue) * progress;
      const volatility = i === 0 || i === steps ? 0 : (Math.random() - 0.5) * (initialValue * 0.04);
      
      points.push({
        date: date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
        valor: parseFloat((trend + volatility).toFixed(2))
      });
    }
    return points;
  }, [investment]);

  // AGORA SIM O EARLY RETURN
  if (!isOpen || !investment) return null;

  // --- FUNÇÃO DE LIQUIDAÇÃO ---
  const handleLiquidate = async () => {
    if (!window.confirm(`Deseja realmente liquidar (vender) ${investment.ticker || investment.name}?`)) return;
    
    setIsLiquidating(true);
    try {
      await api.put(`/investments/${investment._id}/liquidate`, {
        addAsIncome: true, // Adiciona o valor de volta ao saldo
        sellPrice: investment.currentPrice // Usa o preço atual de mercado
      });
      
      showAlert('Ativo liquidado e saldo atualizado!', 'success');
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Erro ao liquidar ativo', 'error');
    } finally {
      setIsLiquidating(false);
    }
  };

  const profit = (Number(investment.currentTotalValue) || 0) - (Number(investment.amountInvested) || 0);
  const isPositive = profit >= 0;
  const perc = investment.profitPercentage || 0;

  // Formatação de quantidade (Cripto vs Outros)
  const formattedQty = investment.type === 'criptomoedas' 
    ? Number(investment.quantity).toFixed(8).replace(/\.?0+$/, "")
    : Number(investment.quantity).toLocaleString('pt-BR');

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-2 md:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="bg-bg-card border border-border-ui w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl flex flex-col no-scrollbar animate-in zoom-in-95 duration-300">
        
        {/* HEADER */}
        <div className="p-6 md:p-10 border-b border-border-ui/50 flex justify-between items-center bg-bg-main/20 sticky top-0 z-10 backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2 bg-brand/10 text-brand rounded-xl">
                <BarChart3 size={20} />
              </span>
              <h2 className="text-xl md:text-3xl font-black text-text-primary uppercase italic tracking-tighter">
                {investment.ticker || 'ATIVO'} <span className="text-brand/50">//</span> {investment.name}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-black px-3 py-1 bg-border-ui/50 text-text-secondary rounded-full uppercase tracking-widest italic">
                {investment.type}
              </span>
              <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
                <Calendar size={12} className="text-brand" /> 
                Início: {new Date(investment.startDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all text-text-secondary active:scale-90">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="p-6 md:p-10 space-y-8">
          
          {/* MÉTRICAS PRINCIPAIS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DetailBox label="Investido" value={`R$ ${Number(investment.amountInvested).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<Wallet size={14}/>} />
            <DetailBox label="Valor Atual" value={`R$ ${Number(investment.currentTotalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={<Activity size={14}/>} color="text-brand" />
            <DetailBox 
              label="Resultado" 
              value={`R$ ${Math.abs(profit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
              subValue={`${perc}%`}
              isPositive={isPositive}
              icon={isPositive ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} 
            />
            <DetailBox label="Posição" value={formattedQty} subValue="unidades" icon={<Target size={14}/>} />
          </div>

          {/* GRÁFICO */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary italic">Performance Histórica Estimada</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-brand" /> <span className="text-[8px] font-black uppercase text-text-secondary">Valorização</span></div>
              </div>
            </div>
            
            <div className="h-[300px] md:h-[400px] w-full bg-bg-main/30 border border-border-ui/50 rounded-[2rem] md:rounded-[3rem] p-4 md:p-8 relative group">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? "#EAB308" : "#ef4444"} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={isPositive ? "#EAB308" : "#ef4444"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="currentColor" opacity={0.03} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'currentColor', fontSize: 9, fontWeight: 900, opacity: 0.4}}
                    dy={15}
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip 
                    cursor={{ stroke: 'var(--brand)', strokeWidth: 2, strokeDasharray: '4 4' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-bg-card border-2 border-brand/50 p-3 rounded-2xl shadow-2xl backdrop-blur-md">
                            <p className="text-[10px] font-black text-brand uppercase mb-1">{payload[0].payload.date}</p>
                            <p className="text-sm font-black text-text-primary italic">
                              R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="valor" 
                    stroke={isPositive ? "#EAB308" : "#ef4444"} 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorProfit)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BOTÃO DE LIQUIDAÇÃO (NOVO) */}
          <div className="pt-4">
            <button
              onClick={handleLiquidate}
              disabled={isLiquidating}
              className="w-full group relative overflow-hidden bg-bg-main border border-border-ui hover:border-brand/50 py-6 rounded-[2rem] transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-brand/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              {isLiquidating ? (
                <Loader2 className="animate-spin text-brand" size={20} />
              ) : (
                <>
                  <CheckCircle2 size={20} className="text-brand group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <p className="text-[11px] font-black text-text-primary uppercase italic tracking-widest">Liquidar Ativo</p>
                    <p className="text-[8px] font-bold text-text-secondary uppercase opacity-60">Vender e retornar saldo para a carteira</p>
                  </div>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailBox = ({ label, value, subValue, icon, isPositive = true, color = "text-text-primary" }) => (
  <div className="bg-bg-main/20 border border-border-ui/40 p-5 md:p-6 rounded-[1.8rem] hover:border-brand/30 transition-colors group">
    <div className="flex items-center gap-2 text-[8px] font-black text-text-secondary uppercase tracking-[0.2em] mb-2 opacity-50 group-hover:opacity-100 transition-opacity">
      <span className="text-brand">{icon}</span> {label}
    </div>
    <div className="flex flex-col">
      <p className={`text-md md:text-xl font-black italic tracking-tighter truncate ${color}`}>
        {value}
      </p>
      {subValue && (
        <span className={`text-[10px] font-black mt-1 uppercase italic ${isPositive ? 'text-brand' : 'text-red-500'}`}>
          {isPositive && subValue !== 'unidades' ? '+' : ''}{subValue}
        </span>
      )}
    </div>
  </div>
);

export default ModalInvestmentDetail;