import React, { useMemo } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ModalMarketChart = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const marketData = useMemo(() => {
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

    const top3 = all.slice(0, 3);
    const bottom3 = all.slice(-3);
    
    return { all, chartSelection: [...top3, ...bottom3] };
  }, []);

  const chartData = useMemo(() => {
    const hours = ['09:00', '11:00', '13:00', '15:00', '17:00', '18:00'];
    return hours.map((hour, idx) => {
      const dataPoint = { name: hour };
      marketData.chartSelection.forEach(item => {
        const base = 100;
        const progress = (idx + 1) / hours.length;
        dataPoint[item.ticker] = Number((base + (item.change * progress) + (Math.random() * 2)).toFixed(2));
      });
      return dataPoint;
    });
  }, [marketData]);

  return (
    <div className="fixed inset-0 z-[10001] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="bg-bg-card w-full max-w-2xl max-h-[90vh] rounded-t-[2.5rem] md:rounded-[3rem] border-t md:border border-border-ui shadow-2xl relative overflow-y-auto flex flex-col no-scrollbar">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-bg-card/95 backdrop-blur-md p-6 border-b border-border-ui/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand/10 rounded-xl text-brand">
              <Zap size={20} fill="currentColor" />
            </div>
            <h2 className="text-lg font-black text-text-primary italic uppercase tracking-tighter">
              Live <span className="text-brand">Market</span>
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl text-text-secondary transition-colors">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* CARD DO GRÁFICO - ADAPTATIVO */}
          <div className="h-[300px] w-full bg-bg-main/10 rounded-[2.5rem] border border-border-ui/50 p-6 relative overflow-hidden">
            <div className="absolute top-4 left-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand" />
              <span className="text-[8px] font-black text-text-secondary uppercase tracking-widest opacity-50">Tempo Real • Variação Diária</span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  {marketData.chartSelection.map((item, index) => (
                    <linearGradient key={`grad-${index}`} id={`color-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[index]} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={COLORS[index]} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.05} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: 'currentColor', fontSize: 9, fontWeight: 800, opacity: 0.4}} 
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  isAnimationActive={false}
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    border: '1px solid var(--border-ui)', 
                    borderRadius: '12px', 
                    fontSize: '10px',
                    color: 'var(--text-primary)'
                  }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                {marketData.chartSelection.map((item, index) => (
                  <Area 
                    key={item.ticker}
                    type="monotone" 
                    dataKey={item.ticker} 
                    stroke={COLORS[index]} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill={`url(#color-${index})`}
                    isAnimationActive={false} 
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda de Cores */}
          <div className="flex flex-wrap gap-3 justify-center">
            {marketData.chartSelection.map((item, index) => (
              <div key={item.ticker} className="flex items-center gap-1.5 bg-bg-main/20 px-3 py-1.5 rounded-full border border-border-ui/30">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-[8px] font-black text-text-primary uppercase italic">{item.ticker}</span>
              </div>
            ))}
          </div>

          {/* Tabela de Rankings */}
          <div className="space-y-3 pb-4">
            <h3 className="text-[9px] font-black text-text-secondary uppercase tracking-widest italic ml-2">Ranking Geral (Top Ativos)</h3>
            <div className="bg-bg-main/10 rounded-[2rem] border border-border-ui/30 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border-ui/30 bg-bg-main/20">
                    <th className="px-6 py-4 text-[7px] font-black text-text-secondary uppercase">Ativo</th>
                    <th className="px-6 py-4 text-[7px] font-black text-text-secondary uppercase text-right">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {marketData.all.map((item, idx) => (
                    <tr key={idx} className="border-b border-border-ui/10 hover:bg-bg-main/30 transition-colors">
                      <td className="px-6 py-3 font-black text-[10px] text-text-primary uppercase italic">{item.ticker}</td>
                      <td className={`px-6 py-3 text-right font-black text-[10px]`}>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${item.isUp ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {item.isUp ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}
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
  );
};

export default ModalMarketChart;