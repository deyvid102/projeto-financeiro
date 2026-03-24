import React, { useMemo } from 'react';
import { X, TrendingUp, Target, ArrowUpRight, ArrowDownRight, Activity, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ModalInvestmentDetail = ({ isOpen, investment, onClose }) => {
  if (!isOpen || !investment) return null;

  const chartData = useMemo(() => {
    const start = new Date(investment.startDate || Date.now());
    const end = new Date();
    const points = [];
    const steps = 6; 

    const initialValue = Number(investment.amountInvested) || 0;
    const currentValue = Number(investment.currentTotalValue) || 0;
    
    for (let i = 0; i <= steps; i++) {
      const date = new Date(start.getTime() + (end.getTime() - start.getTime()) * (i / steps));
      const progress = i / steps;
      const baseVariation = (currentValue - initialValue) * progress;
      const noise = i === 0 || i === steps ? 0 : (Math.random() - 0.5) * (initialValue * 0.03);
      
      points.push({
        date: date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
        valor: parseFloat((initialValue + baseVariation + noise).toFixed(2))
      });
    }
    return points;
  }, [investment]);

  const profit = (Number(investment.currentTotalValue) || 0) - (Number(investment.amountInvested) || 0);
  const isPositive = profit >= 0;
  const perc = investment.profitPercentage || 0;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-2 md:p-4 bg-black/70 backdrop-blur-sm transition-none">
      {/* Container Principal: Adicionado max-h-screen e overflow-y-auto para mobile */}
      <div className="bg-bg-card border border-border-ui w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-[2rem] md:rounded-[3rem] shadow-2xl transition-none no-scrollbar">
        
        {/* HEADER: Padding reduzido no mobile */}
        <div className="p-5 md:p-8 border-b border-border-ui flex justify-between items-center bg-bg-main/10 sticky top-0 z-10 backdrop-blur-md">
          <div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
              <h2 className="text-lg md:text-2xl font-black text-text-primary uppercase italic tracking-tighter">
                Evolução <span className="text-brand">{investment.ticker || investment.name}</span>
              </h2>
              <span className="bg-brand/10 text-brand text-[8px] md:text-[10px] font-black px-2 py-0.5 md:py-1 rounded-lg uppercase italic">
                {investment.type}
              </span>
            </div>
            <p className="text-[8px] md:text-[10px] text-text-secondary font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
              <Calendar size={10} className="md:w-3 md:h-3" /> {new Date(investment.startDate).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <button onClick={onClose} className="p-2 md:p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl md:rounded-2xl transition-colors text-text-secondary">
            <X size={20} className="md:w-6 md:h-6" />
          </button>
        </div>

        <div className="p-5 md:p-8">
          {/* GRID DE MÉTRICAS: 2 colunas no mobile, 4 no desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            <DetailBox label="Investido" value={`R$ ${Number(investment.amountInvested).toLocaleString('pt-BR')}`} icon={<Target size={12}/>} />
            <DetailBox label="Atual" value={`R$ ${Number(investment.currentTotalValue).toLocaleString('pt-BR')}`} icon={<Activity size={12}/>} />
            <DetailBox 
              label="Lucro" 
              value={`R$ ${profit.toLocaleString('pt-BR')}`} 
              subValue={`${perc}%`}
              isPositive={isPositive}
              icon={isPositive ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>} 
            />
            <DetailBox label="Qtd." value={investment.quantity || '1'} icon={<TrendingUp size={12}/>} />
          </div>

          {/* ÁREA DO GRÁFICO: Altura adaptável */}
          <div className="h-[250px] md:h-[350px] w-full bg-bg-main/5 border border-border-ui/50 rounded-[1.5rem] md:rounded-[2.5rem] p-3 md:p-6 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.05} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'currentColor', fontSize: 9, fontWeight: 800, opacity: 0.5}}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  isAnimationActive={false}
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    border: '1px solid var(--border-ui)', 
                    borderRadius: '12px',
                    fontSize: '10px'
                  }}
                  itemStyle={{ fontWeight: '900', color: 'var(--text-primary)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="valor" 
                  stroke={isPositive ? "#22c55e" : "#ef4444"} 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailBox = ({ label, value, subValue, icon, isPositive = true }) => (
  <div className="bg-bg-main/10 border border-border-ui/30 p-3 md:p-5 rounded-xl md:rounded-2xl">
    <div className="flex items-center gap-1.5 text-[7px] md:text-[8px] font-black text-text-secondary uppercase tracking-widest mb-1 opacity-50">
      {icon} {label}
    </div>
    <div className="flex flex-col md:flex-row md:items-baseline md:gap-2">
      <p className="text-sm md:text-lg font-black text-text-primary italic tracking-tight truncate">
        {value}
      </p>
      {subValue && (
        <span className={`text-[9px] md:text-[10px] font-black ${isPositive ? 'text-brand' : 'text-red-500'}`}>
          {isPositive ? '+' : ''}{subValue}
        </span>
      )}
    </div>
  </div>
);

export default ModalInvestmentDetail;