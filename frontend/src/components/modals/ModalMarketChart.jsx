import React, { useMemo } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ModalMarketChart = ({ isOpen, onClose }) => {
  // --- HOOKS NO TOPO (Regra de Ouro do React) ---
  const COLORS = useMemo(() => ['#EAB308', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'], []);

  const marketData = useMemo(() => {
    // Lista de tickers ampliada para o ranking
    const tickers = ['BTC', 'ETH', 'SOL', 'PETR4', 'VALE3', 'AAPL', 'TSLA', 'AMZO34', 'ITUB4', 'BBDC4', 'NVDA', 'MGLU3', 'WEGE3', 'GOOGL', 'IVVB11'];
    
    const all = tickers.map(t => {
      const change = (Math.random() * 20 - 10).toFixed(2);
      return {
        ticker: t,
        price: (Math.random() * 500 + 50).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        change: Number(change),
        isUp: Number(change) >= 0
      };
    }).sort((a, b) => b.change - a.change);

    // Seleciona os destaques para o gráfico (Top 3 e Bottom 3)
    const top3 = all.slice(0, 3);
    const bottom3 = all.slice(-3);
    
    return { all, chartSelection: [...top3, ...bottom3] };
  }, []); // Gera apenas uma vez ao montar

  const chartData = useMemo(() => {
    const hours = ['09:00', '11:00', '13:00', '15:00', '17:00', '18:00'];
    return hours.map((hour, idx) => {
      const dataPoint = { name: hour };
      marketData.chartSelection.forEach(item => {
        const base = 100;
        const progress = (idx + 1) / hours.length;
        // Simulação de movimento de mercado
        dataPoint[item.ticker] = Number((base + (item.change * progress) + (Math.random() * 2)).toFixed(2));
      });
      return dataPoint;
    });
  }, [marketData]);

  // --- EARLY RETURN APÓS OS HOOKS ---
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="bg-bg-card w-full max-w-2xl max-h-[90vh] rounded-t-[2.5rem] md:rounded-[3.5rem] border-t md:border border-border-ui shadow-2xl relative overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-300">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-bg-card/90 backdrop-blur-xl p-6 md:p-8 border-b border-border-ui/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand/10 rounded-2xl text-brand animate-pulse">
              <Zap size={20} fill="currentColor" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-text-primary italic uppercase tracking-tighter">
                Live <span className="text-brand">Market</span>
              </h2>
              <p className="text-[8px] font-bold text-text-secondary uppercase tracking-[0.2em] opacity-50">Global Indexes & Assets</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-red-500/10 hover:text-red-500 rounded-2xl text-text-secondary transition-all active:scale-90">
            <X size={22} strokeWidth={3} />
          </button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto no-scrollbar space-y-8">
          
          {/* ÁREA DO GRÁFICO */}
          <div className="space-y-4">
            <div className="h-[280px] md:h-[320px] w-full bg-bg-main/20 rounded-[2rem] md:rounded-[3rem] border border-border-ui/50 p-4 md:p-6 relative group">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    {marketData.chartSelection.map((item, index) => (
                      <linearGradient key={`grad-${index}`} id={`color-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="currentColor" opacity={0.03} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'currentColor', fontSize: 9, fontWeight: 900, opacity: 0.3}} 
                  />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip 
                    cursor={{ stroke: 'var(--brand)', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-card)', 
                      border: '1px solid var(--border-ui)', 
                      borderRadius: '16px', 
                      fontSize: '10px',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3)'
                    }}
                    itemStyle={{ fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}
                  />
                  {marketData.chartSelection.map((item, index) => (
                    <Area 
                      key={item.ticker}
                      type="monotone" 
                      dataKey={item.ticker} 
                      stroke={COLORS[index % COLORS.length]} 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill={`url(#color-${index})`}
                      isAnimationActive={true}
                      animationDuration={1000}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Legenda de Cores */}
            <div className="flex flex-wrap gap-2 justify-center">
              {marketData.chartSelection.map((item, index) => (
                <div key={item.ticker} className="flex items-center gap-2 bg-bg-main/40 px-3 py-1.5 rounded-xl border border-border-ui/20 hover:border-brand/30 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.5)]" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[9px] font-black text-text-primary uppercase italic tracking-tighter">{item.ticker}</span>
                </div>
              ))}
            </div>
          </div>

          {/* TABELA DE RANKING */}
          <div className="space-y-4 pb-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] italic">Daily Performance Ranking</h3>
              <span className="text-[8px] bg-brand/10 text-brand px-2 py-0.5 rounded-full font-black uppercase">Live Update</span>
            </div>
            
            <div className="bg-bg-main/10 rounded-[2.5rem] border border-border-ui/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border-ui/30 bg-bg-main/30">
                      <th className="px-8 py-5 text-[8px] font-black text-text-secondary uppercase tracking-widest opacity-50">Asset</th>
                      <th className="px-8 py-5 text-[8px] font-black text-text-secondary uppercase tracking-widest opacity-50 text-right">Market Price</th>
                      <th className="px-8 py-5 text-[8px] font-black text-text-secondary uppercase tracking-widest opacity-50 text-right">Variation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-ui/10">
                    {marketData.all.map((item, idx) => (
                      <tr key={idx} className="hover:bg-brand/5 transition-colors group">
                        <td className="px-8 py-4">
                          <span className="font-black text-[11px] text-text-primary uppercase italic group-hover:text-brand transition-colors">
                            {item.ticker}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <span className="text-[10px] font-black text-text-secondary">R$ {item.price}</span>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[10px] italic shadow-sm
                            ${item.isUp ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {item.isUp ? <ArrowUpRight size={12} strokeWidth={3}/> : <ArrowDownRight size={12} strokeWidth={3}/>}
                            {Math.abs(item.change)}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalMarketChart;