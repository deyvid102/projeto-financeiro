import React, { useState, useEffect, useMemo } from 'react';
import { ArrowDownCircle, TrendingDown, Maximize2, Loader2, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../../services/api';

const ExpensesPanel = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await api.get('/transactions');
        // Filtramos apenas as saídas
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

  const stats = useMemo(() => {
    const total = transactions.reduce((acc, curr) => acc + curr.amount, 0);
    const average = transactions.length > 0 ? total / 6 : 0;
    const max = transactions.length > 0 ? Math.max(...transactions.map(t => t.amount)) : 0;
    return { total, average, max };
  }, [transactions]);

  const barData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const monthlyMap = {};
    months.forEach(m => monthlyMap[m] = 0);
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthName = months[date.getMonth()];
      if (monthlyMap[monthName] !== undefined) {
        monthlyMap[monthName] += t.amount;
      }
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
      {/* TÍTULO E SUBTÍTULO ESTILO FINANCE MAX */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-text-primary italic uppercase tracking-tighter">
          suas <span className="text-brand">despesas</span>
        </h1>
        <div className="h-1 w-12 bg-brand rounded-full mt-2"></div>
        <p className="text-[11px] text-text-secondary font-black uppercase tracking-[0.2em] mt-3 opacity-60">
          Monitoramento estratégico de fluxo de saída
        </p>
      </div>

      {/* CARDS DE STATS REESTILIZADOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Total de Saídas', value: stats.total, icon: ArrowDownCircle, color: 'bg-red-500', shadow: 'shadow-red-500/20' },
          { label: 'Gasto Médio', value: stats.average, icon: TrendingDown, color: 'bg-blue-500', shadow: 'shadow-blue-500/20' },
          { label: 'Pico de Gasto', value: stats.max, icon: Maximize2, color: 'bg-brand', shadow: 'shadow-brand/20' }
        ].map((card, i) => (
          <div key={i} className="bg-bg-card border border-border-ui p-7 rounded-[2.5rem] shadow-sm flex items-center justify-between hover:border-brand/30 transition-all group">
            <div>
              <span className="text-[10px] text-text-secondary font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                {card.label}
              </span>
              <h2 className="text-2xl font-black text-text-primary mt-1 tracking-tight">
                R$ {card.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <div className={`${card.color} p-3.5 rounded-2xl text-white shadow-lg ${card.shadow} group-hover:scale-110 transition-transform`}>
              <card.icon size={22} strokeWidth={2.5} />
            </div>
          </div>
        ))}
      </div>

      {/* GRÁFICO DE BARRAS MENSAL */}
      <div className="bg-bg-card border border-border-ui rounded-[3rem] p-8 shadow-sm mb-10 overflow-hidden">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.2em]">Relatório Mensal de Performance</h3>
          <button className="p-2.5 bg-bg-main hover:bg-brand/10 hover:text-brand rounded-xl transition-all text-text-secondary border border-border-ui cursor-pointer">
            <Filter size={18} strokeWidth={2.5} />
          </button>
        </div>
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} 
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} 
              />
              <Tooltip 
                cursor={{fill: 'rgba(6, 182, 212, 0.05)'}}
                contentStyle={{ 
                  borderRadius: '24px', 
                  border: '1px solid #e2e8f0', 
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                  padding: '12px 16px',
                  fontWeight: '900',
                  fontSize: '12px'
                }}
              />
              <Bar 
                dataKey="despesas" 
                fill="#06b6d4" 
                radius={[12, 12, 12, 12]} 
                barSize={45} 
                className="hover:fill-brand transition-colors"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DESPESAS POR CATEGORIA */}
      <div className="bg-bg-card border border-border-ui rounded-[3rem] p-10 shadow-sm">
        <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.2em] mb-10 text-center">Distribuição por Categoria</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
          {categoryData.map((item) => (
            <div key={item.name} className="space-y-4 group">
              <div className="flex justify-between items-end px-1">
                <span className="text-[11px] font-black text-text-primary uppercase tracking-widest">{item.name}</span>
                <span className="text-[11px] font-black text-text-secondary">
                  R$ {item.value.toLocaleString('pt-BR')} 
                  <span className="text-brand ml-2 px-2 py-0.5 bg-brand/10 rounded-lg">{item.percent.toFixed(1)}%</span>
                </span>
              </div>
              <div className="w-full h-4 bg-bg-main rounded-full p-1 border border-border-ui shadow-inner overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand to-cyan-400 rounded-full transition-all duration-1000 ease-out shadow-sm"
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