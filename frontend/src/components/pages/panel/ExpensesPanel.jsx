import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowDownCircle, TrendingDown, Maximize2, Loader2, 
  Filter, Flame, Calendar, Info
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../../../services/Api';

const ExpensesPanel = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await api.get('/transactions');
        const expensesOnly = response.data.filter(t => t.type === 'saida' || t.type === 'expense');
        setTransactions(expensesOnly);
      } catch (err) {
        console.error("Erro ao carregar despesas:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  // LÓGICA DE BURN RATE E STATS
  const stats = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dayOfMonth = today.getDate() || 1; // Evita divisão por zero

    const total = transactions.reduce((acc, curr) => acc + curr.amount, 0);
    
    const currentMonthExpenses = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((acc, curr) => acc + curr.amount, 0);

    const burnRate = currentMonthExpenses / dayOfMonth; 
    const projectedTotal = burnRate * daysInMonth; 

    const max = transactions.length > 0 ? Math.max(...transactions.map(t => t.amount)) : 0;
    
    return { total, average: burnRate, max, projectedTotal, currentMonthExpenses };
  }, [transactions]);

  const heatmapData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      
      const dayTotal = transactions
        .filter(t => {
          const tDate = new Date(t.date);
          tDate.setHours(0,0,0,0);
          return tDate.getTime() === d.getTime();
        })
        .reduce((acc, curr) => acc + curr.amount, 0);

      days.push({
        label: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
        value: dayTotal,
        fullDate: d.toLocaleDateString('pt-BR')
      });
    }
    return days;
  }, [transactions]);

  const barData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const monthlyMap = {};
    months.forEach(m => monthlyMap[m] = 0);
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthName = months[date.getMonth()];
      if (monthlyMap[monthName] !== undefined) monthlyMap[monthName] += t.amount;
    });
    return Object.entries(monthlyMap).map(([name, despesas]) => ({ name, despesas }));
  }, [transactions]);

  const categoryData = useMemo(() => {
    const categories = {};
    transactions.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    return Object.entries(categories)
      .map(([name, value]) => ({
        name,
        value,
        percent: stats.total > 0 ? (value / stats.total) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, stats.total]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-brand">
      <Loader2 className="animate-spin mb-4" size={40} strokeWidth={3} />
      <p className="font-black uppercase tracking-[0.3em] text-[10px]">Sincronizando Finance MAX...</p>
    </div>
  );

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-6 duration-700 pb-10 px-4 md:px-0">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-text-primary italic uppercase tracking-tighter">
          suas <span className="text-brand">despesas</span>
        </h1>
        <div className="h-1 w-12 bg-brand rounded-full mt-2"></div>
        <p className="text-[11px] text-text-secondary font-black uppercase tracking-[0.2em] mt-3 opacity-60">
          Monitoramento estratégico de fluxo de saída
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* CARD BURN RATE */}
        <div className="lg:col-span-2 bg-bg-card border-2 border-brand/20 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-xl shadow-brand/5">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <Flame size={80} className="text-brand" fill="currentColor" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-brand text-white p-1.5 rounded-lg"><Flame size={16} strokeWidth={3} /></span>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Velocidade de Gasto (Burn Rate)</h3>
            </div>
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div>
                <p className="text-4xl font-black text-text-primary italic">
                  R$ {stats.average.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-sm not-italic opacity-40 ml-1">/dia</span>
                </p>
                <p className="text-[10px] font-bold text-text-secondary uppercase mt-2 tracking-widest">
                  Baseado no gasto atual de R$ {stats.currentMonthExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="h-px md:h-12 w-full md:w-px bg-border-ui"></div>
              <div>
                <p className="text-xs font-black text-brand uppercase tracking-tighter">Projeção p/ fim do mês</p>
                <p className="text-2xl font-black text-text-primary tracking-tight">
                  R$ {stats.projectedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* HEATMAP SEMANAL */}
        <div className="bg-bg-card border border-border-ui p-8 rounded-[2.5rem]">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-6 flex items-center gap-2">
            <Calendar size={14} /> Intensidade 7 Dias
          </h3>
          <div className="flex justify-between items-end h-24 gap-2">
            {heatmapData.map((day, i) => {
              const intensity = Math.min((day.value / (stats.average * 2)) * 100, 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    title={`${day.fullDate}: R$ ${day.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    className="w-full rounded-lg transition-all duration-500 cursor-help"
                    style={{ 
                      height: `${Math.max(intensity, 15)}%`, 
                      backgroundColor: day.value === 0 ? 'var(--bg-main)' : `rgba(0, 209, 255, ${Math.max(intensity/100, 0.2)})`,
                      border: day.value > stats.average ? '1px solid var(--brand)' : '1px solid transparent'
                    }}
                  />
                  <span className="text-[8px] font-black uppercase text-text-secondary">{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CARDS DE STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Total Histórico', value: stats.total, icon: ArrowDownCircle, color: 'bg-red-500' },
          { label: 'Gasto Médio Diário', value: stats.average, icon: TrendingDown, color: 'bg-blue-500' },
          { label: 'Pico de Gasto', value: stats.max, icon: Maximize2, color: 'bg-brand' }
        ].map((card, i) => (
          <div key={i} className="bg-bg-card border border-border-ui p-7 rounded-[2.5rem] shadow-sm flex items-center justify-between hover:border-brand/30 transition-all group">
            <div>
              <span className="text-[10px] text-text-secondary font-black uppercase tracking-widest opacity-60">
                {card.label}
              </span>
              <h2 className="text-2xl font-black text-text-primary mt-1 tracking-tight font-tabular">
                R$ {card.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className={`${card.color} p-3.5 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
              <card.icon size={22} strokeWidth={2.5} />
            </div>
          </div>
        ))}
      </div>

      {/* GRÁFICO MENSAL */}
      <div className="bg-bg-card border border-border-ui rounded-[3rem] p-8 shadow-sm mb-10 overflow-hidden">
        <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.2em] mb-10">Fluxo Mensal de Despesas</h3>
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" opacity={0.3} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} dy={15}/>
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
              <Tooltip 
                cursor={{fill: 'rgba(0, 209, 255, 0.05)'}}
                formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Despesas']}
                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px 16px', fontWeight: '900', fontSize: '12px' }}
              />
              <Bar dataKey="despesas" radius={[12, 12, 12, 12]} barSize={45}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.despesas > stats.average * 30 ? '#ef4444' : 'var(--color-brand)'} className="transition-all duration-500 hover:opacity-80" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CATEGORIAS */}
      <div className="bg-bg-card border border-border-ui rounded-[3rem] p-10 shadow-sm">
        <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.2em] mb-10 text-center italic">Ranking de Consumo por Categoria</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
          {categoryData.map((item) => (
            <div key={item.name} className="space-y-4 group">
              <div className="flex justify-between items-end px-1">
                <span className="text-[11px] font-black text-text-primary uppercase tracking-widest">{item.name}</span>
                <span className="text-[11px] font-black text-text-secondary font-tabular">
                  R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                  <span className="text-brand ml-2 px-2 py-0.5 bg-brand/10 rounded-lg">{item.percent.toFixed(2)}%</span>
                </span>
              </div>
              <div className="w-full h-4 bg-bg-main rounded-full p-1 border border-border-ui shadow-inner overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand to-cyan-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpensesPanel;