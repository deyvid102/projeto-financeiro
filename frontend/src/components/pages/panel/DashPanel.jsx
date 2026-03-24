import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, ArrowUpCircle, ArrowDownCircle, 
  Calendar, TrendingUp, PieChart as PieIcon, BarChart3 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, ReferenceLine 
} from 'recharts';
import api from '@/services/api';
import LoadingState from '@/components/LoadingState'; 

// Tooltip Personalizada
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-card/90 backdrop-blur-xl border border-border-ui p-3 md:p-4 rounded-[1.2rem] md:rounded-[1.5rem] shadow-2xl z-50">
        <p className="text-[9px] md:text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-2 md:mb-3 border-b border-border-ui/50 pb-2 italic">
          {label}
        </p>
        <div className="space-y-1.5 md:space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-[10px] md:text-[11px] font-bold text-text-primary uppercase italic">{entry.name}</span>
              </div>
              <span className="text-[10px] md:text-[12px] font-black italic" style={{ color: entry.color || entry.fill }}>
                {Math.abs(entry.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const DashPanel = () => {
  const [transactions, setTransactions] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [summary, setSummary] = useState({ balance: 0, income: 0, expense: 0, totalProfit: 0 });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('anual');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transRes, invRes] = await Promise.all([
          api.get('/transactions'),
          api.get('/investments')
        ]);
        const transData = transRes.data || [];
        const invData = invRes.data || [];
        
        setTransactions([...transData].sort((a, b) => new Date(b.date) - new Date(a.date)));
        setInvestments(invData);
        
        // Fluxo de caixa
        const income = transData.filter(t => t.type === 'entrada').reduce((acc, curr) => acc + Number(curr.amount), 0);
        const expense = transData.filter(t => t.type === 'saida').reduce((acc, curr) => acc + Number(curr.amount), 0);
        
        // Lucro baseado APENAS em investimentos "em andamento" usando o valor da API
        const ativos = invData.filter(inv => inv.status === 'em andamento');
        const totalInvestido = ativos.reduce((acc, inv) => acc + (Number(inv.amountInvested) || 0), 0);
        const totalAtual = ativos.reduce((acc, inv) => acc + (Number(inv.currentTotalValue) || 0), 0);
        const profit = totalAtual - totalInvestido;

        setSummary({ income, expense, balance: income - expense, totalProfit: profit });
      } catch (err) {
        console.error("Erro ao carregar:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const timeChartsData = useMemo(() => {
    const now = new Date();
    const dataMap = {};
    const periods = timeFilter === 'semanal' ? 7 : timeFilter === 'mensal' ? 30 : 12;
    
    for (let i = periods - 1; i >= 0; i--) {
      const d = new Date();
      if (timeFilter === 'anual') d.setMonth(now.getMonth() - i); 
      else d.setDate(now.getDate() - i);
      const label = timeFilter === 'anual' 
        ? d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') 
        : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      dataMap[label] = { name: label, entradas: 0, saidas: 0, bipolarSaida: 0, rawDate: new Date(d) };
    }

    transactions.forEach(t => {
      const d = new Date(t.date);
      let label = (timeFilter === 'anual') 
        ? d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
        : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (dataMap[label]) {
        if (t.type === 'entrada') dataMap[label].entradas += Number(t.amount);
        else {
          dataMap[label].saidas += Number(t.amount);
          dataMap[label].bipolarSaida -= Number(t.amount);
        }
      }
    });
    return Object.values(dataMap).sort((a, b) => a.rawDate - b.rawDate);
  }, [transactions, timeFilter]);

  const categoryData = useMemo(() => {
    const categories = {};
    transactions.filter(t => t.type === 'saida').forEach(t => {
      const cat = t.category || 'Outros';
      categories[cat] = (categories[cat] || 0) + Number(t.amount);
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Alocação de ativos SOMENTE para status "em andamento"
  const activeInvestmentsData = useMemo(() => {
    return investments
      .filter(inv => inv.status === 'em andamento')
      .map(inv => ({ 
        name: inv.ticker || inv.name, 
        value: Number(inv.currentTotalValue) || Number(inv.amountInvested) || 0 
      }))
      .sort((a, b) => b.value - a.value);
  }, [investments]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  if (loading) return <LoadingState />;

  return (
    <div className="w-full pb-10 space-y-4 md:space-y-8">
      
      {/* 1. TOPBAR DE RESUMO */}
      <div className="bg-bg-card border border-border-ui p-4 md:p-8 rounded-2xl md:rounded-[3rem] shadow-sm overflow-hidden relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 items-center relative z-10">
          <div className="flex flex-col md:border-r border-border-ui/50 pr-2">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={12} className="text-brand opacity-70 md:w-3.5 md:h-3.5" />
              <span className="text-[7px] md:text-[10px] text-text-secondary font-black uppercase tracking-widest opacity-60">Saldo Atual</span>
            </div>
            <h2 className={`text-base md:text-3xl font-black italic tracking-tighter truncate ${summary.balance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
              {summary.balance.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
            </h2>
          </div>

          <div className="flex flex-col md:border-r border-border-ui/50 px-2">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpCircle size={12} className="text-emerald-500 opacity-70 md:w-3.5 md:h-3.5" />
              <span className="text-[7px] md:text-[10px] text-text-secondary font-black uppercase tracking-widest opacity-60">Receitas</span>
            </div>
            <h2 className="text-base md:text-2xl font-black text-emerald-500 italic tracking-tighter truncate">
              {summary.income.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
            </h2>
          </div>

          <div className="flex flex-col md:border-r border-border-ui/50 px-2">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownCircle size={12} className="text-red-500 opacity-70 md:w-3.5 md:h-3.5" />
              <span className="text-[7px] md:text-[10px] text-text-secondary font-black uppercase tracking-widest opacity-60">Despesas</span>
            </div>
            <h2 className="text-base md:text-2xl font-black text-red-500 italic tracking-tighter truncate">
              {summary.expense.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
            </h2>
          </div>

          <div className="flex flex-col pl-2">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={12} className="text-brand opacity-70 md:w-3.5 md:h-3.5" />
              <span className="text-[7px] md:text-[10px] text-text-secondary font-black uppercase tracking-widest opacity-60">Lucro Invest.</span>
            </div>
            <h2 className="text-base md:text-2xl font-black text-brand italic tracking-tighter truncate">
              {summary.totalProfit > 0 ? '+' : ''}{summary.totalProfit.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
            </h2>
          </div>
        </div>
      </div>

      {/* 2. GRID DE GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-8">
        
        {/* GRÁFICO 1: FLUXO DE CAIXA */}
        <div className="bg-bg-card border border-border-ui rounded-[2rem] md:rounded-[3rem] p-5 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h3 className="text-[10px] md:text-sm font-black text-text-primary uppercase tracking-widest italic flex items-center gap-2">
              <TrendingUp size={16} className="text-brand" /> Fluxo de Caixa
            </h3>
            <div className="flex w-full sm:w-auto bg-bg-main p-1 rounded-xl border border-border-ui/50 overflow-x-auto">
              {['semanal', 'mensal', 'anual'].map((f) => (
                <button key={f} onClick={() => setTimeFilter(f)} className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase ${timeFilter === f ? 'bg-brand text-white shadow-lg' : 'text-text-secondary hover:text-brand'}`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="h-[220px] md:h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeChartsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="cEntrada" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                  <linearGradient id="cSaida" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#94a3b8', fontWeight: 'bold'}} interval={timeFilter === 'mensal' ? 5 : 0} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#94a3b8'}} />
                <Tooltip content={<CustomTooltip />} />
                <Area isAnimationActive={false} type="monotone" name="Entradas" dataKey="entradas" stroke="#3b82f6" strokeWidth={3} fill="url(#cEntrada)" />
                <Area isAnimationActive={false} type="monotone" name="Saídas" dataKey="saidas" stroke="#ef4444" strokeWidth={3} fill="url(#cSaida)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 2: COMPARATIVO */}
        <div className="bg-bg-card border border-border-ui rounded-[2rem] md:rounded-[3rem] p-5 md:p-8 shadow-sm">
          <h3 className="text-[10px] md:text-sm font-black text-text-primary uppercase tracking-widest italic mb-8 flex items-center gap-2">
            <BarChart3 size={16} className="text-brand" /> Volume Comparativo
          </h3>
          <div className="h-[220px] md:h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeChartsData} stackOffset="sign" margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#94a3b8', fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#94a3b8'}} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                <Bar isAnimationActive={false} name="Entradas" dataKey="entradas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={timeFilter === 'mensal' ? 8 : 12} />
                <Bar isAnimationActive={false} name="Saídas" dataKey="bipolarSaida" fill="#ef4444" radius={[0, 0, 4, 4]} barSize={timeFilter === 'mensal' ? 8 : 12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 3: CATEGORIAS */}
        <div className="bg-bg-card border border-border-ui rounded-[2rem] md:rounded-[3rem] p-5 md:p-8 shadow-sm">
          <h3 className="text-[10px] md:text-sm font-black text-text-primary uppercase tracking-widest italic mb-6 flex items-center gap-2">
            <PieIcon size={16} className="text-brand" /> Gastos por Categoria
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="h-[180px] md:h-[220px] w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie isAnimationActive={false} data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} cornerRadius={10} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 grid grid-cols-2 gap-2">
              {categoryData.slice(0, 4).map((e, i) => (
                <div key={e.name} className="flex items-center gap-2 p-2.5 bg-bg-main/30 rounded-xl border border-border-ui/30">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[7px] font-black text-text-secondary uppercase truncate">{e.name}</span>
                    <span className="text-[9px] font-black text-text-primary italic">{((e.value / (categoryData.reduce((a,b)=>a+b.value,0)||1))*100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GRÁFICO 4: ALOCAÇÃO */}
        <div className="bg-bg-card border border-border-ui rounded-[2rem] md:rounded-[3rem] p-5 md:p-8 shadow-sm">
          <h3 className="text-[10px] md:text-sm font-black text-text-primary uppercase tracking-widest italic mb-6 flex items-center gap-2">
            <PieIcon size={16} className="text-emerald-500" /> Alocação de Ativos
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="h-[180px] md:h-[220px] w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie isAnimationActive={false} data={activeInvestmentsData} innerRadius={0} outerRadius={80} paddingAngle={2} dataKey="value">
                    {activeInvestmentsData.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 grid grid-cols-2 gap-2">
              {activeInvestmentsData.slice(0, 4).map((e, i) => (
                <div key={e.name} className="flex items-center gap-2 p-2.5 bg-bg-main/30 rounded-xl border border-border-ui/30">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[(i + 2) % COLORS.length] }} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[7px] font-black text-text-secondary uppercase truncate">{e.name}</span>
                    <span className="text-[9px] font-black text-text-primary italic">{((e.value / (activeInvestmentsData.reduce((a,b)=>a+b.value,0)||1))*100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. HISTÓRICO */}
      <div className="bg-bg-card border border-border-ui rounded-[2rem] md:rounded-[3rem] p-5 md:p-8 shadow-sm overflow-hidden">
        <h3 className="text-lg md:text-2xl font-black text-text-primary italic tracking-tighter mb-6">Histórico <span className="text-brand">Recente</span></h3>
        
        <div className="flex flex-col gap-3 md:hidden">
          {transactions.slice(0, 5).map((t) => (
            <div key={t._id} className="p-4 bg-bg-main/30 border border-border-ui/50 rounded-2xl flex items-center justify-between">
              <div className="flex flex-col gap-1 max-w-[60%]">
                <span className="text-[9px] font-black uppercase text-text-secondary/70 tracking-tighter truncate">{t.category}</span>
                <span className="text-sm font-bold text-text-primary truncate">{t.title}</span>
                <span className="text-[8px] font-medium text-text-secondary flex items-center gap-1">
                  <Calendar size={10} /> {new Date(t.date).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className={`text-right font-black italic text-sm ${t.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                {t.type === 'entrada' ? '+' : '-'} {Number(t.amount).toLocaleString('pt-br', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-text-secondary text-[9px] uppercase tracking-[0.3em] opacity-50 font-black">
                <th className="pb-2 px-4">Descrição</th>
                <th className="pb-2 px-4 text-center">Data</th>
                <th className="pb-2 px-4">Categoria</th>
                <th className="pb-2 px-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 5).map((t) => (
                <tr key={t._id} className="group bg-bg-main/20 cursor-default">
                  <td className="py-5 px-5 rounded-l-[1.5rem] font-bold text-sm text-text-primary italic border-y border-l border-transparent">{t.title}</td>
                  <td className="py-5 px-4 text-center border-y border-transparent">
                    <span className="inline-flex items-center gap-2 text-text-secondary font-black text-[10px] bg-bg-card px-3 py-1.5 rounded-xl border border-border-ui/20">
                      <Calendar size={12} className="text-brand" />{new Date(t.date).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="py-5 px-4 border-y border-transparent"><span className="font-black uppercase text-[9px] tracking-widest text-text-secondary/70">{t.category}</span></td>
                  <td className={`py-5 px-5 rounded-r-[1.5rem] text-right font-black italic border-y border-r border-transparent ${t.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                    {t.type === 'entrada' ? '+ ' : '- '}{Number(t.amount).toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashPanel;