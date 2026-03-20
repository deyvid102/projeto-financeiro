import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Wallet, ArrowUpCircle, ArrowDownCircle, Loader2, 
  Calendar, TrendingUp, PieChart as PieIcon, BarChart3, ChevronRight 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, ReferenceLine 
} from 'recharts';
import api from '../../../services/api';

// Tooltip Personalizada com Glassmorphism Adaptada
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-card/90 backdrop-blur-xl border border-border-ui p-3 md:p-4 rounded-[1.2rem] md:rounded-[1.5rem] shadow-2xl animate-in fade-in zoom-in duration-200 z-50">
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

  const getValorAtual = useCallback((inv) => {
    const amountInvested = Number(inv.amountInvested) || 0;
    if (inv.status === 'sacado') return inv.finalValue || amountInvested;
    const isCrypto = inv.type?.toLowerCase() === 'criptomoedas' || inv.type?.toLowerCase() === 'cripto';
    if (isCrypto) return amountInvested; 
    
    const profitPercent = (Number(inv.expectedProfitability) || 0) / 100;
    const start = new Date(inv.startDate);
    const end = new Date(inv.endDate);
    const today = new Date();
    if (isNaN(start) || isNaN(end)) return amountInvested;

    const totalMonths = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
    const monthsPassed = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
    const effectiveMonths = Math.min(Math.max(0, monthsPassed), totalMonths);
    const monthlyRate = Math.pow(1 + profitPercent, 1 / totalMonths) - 1;
    return Number((amountInvested * Math.pow(1 + monthlyRate, effectiveMonths)).toFixed(2));
  }, []);

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
        
        const income = transData.filter(t => t.type === 'entrada').reduce((acc, curr) => acc + Number(curr.amount), 0);
        const expense = transData.filter(t => t.type === 'saida').reduce((acc, curr) => acc + Number(curr.amount), 0);
        const profit = invData.reduce((acc, inv) => acc + (getValorAtual(inv) - (Number(inv.amountInvested) || 0)), 0);

        setSummary({ income, expense, balance: income - expense, totalProfit: profit });
      } catch (err) {
        console.error("Erro ao carregar:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getValorAtual]);

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

  const activeInvestmentsData = useMemo(() => {
    return investments
      .filter(inv => inv.status !== 'sacado')
      .map(inv => ({ name: inv.name, value: getValorAtual(inv) }))
      .sort((a, b) => b.value - a.value);
  }, [investments, getValorAtual]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-brand p-6">
      <Loader2 className="animate-spin mb-4" size={48} />
      <p className="text-xs font-black uppercase tracking-[0.3em] italic text-text-secondary text-center">Sincronizando Engine...</p>
    </div>
  );

  return (
    <div className="w-full animate-in fade-in duration-500 pb-10">
      
      {/* 1. CARDS DE RESUMO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-10">
        <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-900 p-5 md:p-8 rounded-[1.8rem] md:rounded-[2.5rem] text-white shadow-2xl transition-all">
          <div className="flex justify-between items-start mb-2 md:mb-4"><span className="text-[8px] md:text-[10px] opacity-70 font-black uppercase tracking-widest">Saldo Atual</span><Wallet size={16} /></div>
          <h2 className="text-xl md:text-3xl font-black italic tracking-tighter truncate">{summary.balance.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}</h2>
        </div>

        <div className="bg-bg-card border border-border-ui p-5 md:p-8 rounded-[1.8rem] md:rounded-[2.5rem] shadow-sm">
          <div className="flex justify-between items-start mb-2 md:mb-4"><span className="text-[8px] md:text-[10px] text-emerald-500 font-black uppercase tracking-widest">Entradas</span><ArrowUpCircle className="text-emerald-500" size={16} /></div>
          <h2 className="text-lg md:text-2xl font-black text-emerald-500 italic tracking-tighter truncate">{summary.income.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}</h2>
        </div>

        <div className="bg-bg-card border border-border-ui p-5 md:p-8 rounded-[1.8rem] md:rounded-[2.5rem] shadow-sm">
          <div className="flex justify-between items-start mb-2 md:mb-4"><span className="text-[8px] md:text-[10px] text-red-500 font-black uppercase tracking-widest">Saídas</span><ArrowDownCircle className="text-red-500" size={16} /></div>
          <h2 className="text-lg md:text-2xl font-black text-red-500 italic tracking-tighter truncate">{summary.expense.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}</h2>
        </div>

        <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-emerald-500 to-teal-700 p-5 md:p-8 rounded-[1.8rem] md:rounded-[2.5rem] text-white shadow-2xl">
          <div className="flex justify-between items-start mb-2 md:mb-4"><span className="text-[8px] md:text-[10px] opacity-70 font-black uppercase tracking-widest">Rendimento</span><TrendingUp size={16} /></div>
          <h2 className="text-xl md:text-3xl font-black italic tracking-tighter truncate">+{summary.totalProfit.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}</h2>
        </div>
      </div>

      {/* 2. GRID DE GRÁFICOS (4 GRÁFICOS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-8">
        
        {/* GRÁFICO 1: FLUXO DE CAIXA */}
        <div className="bg-bg-card border border-border-ui rounded-[2.2rem] md:rounded-[3rem] p-5 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h3 className="text-[11px] md:text-sm font-black text-text-primary uppercase tracking-widest italic flex items-center gap-2">
              <TrendingUp size={16} className="text-brand" /> Fluxo de Caixa
            </h3>
            <div className="flex w-full sm:w-auto bg-bg-main p-1 rounded-xl border border-border-ui/50 overflow-x-auto">
              {['semanal', 'mensal', 'anual'].map((f) => (
                <button key={f} onClick={() => setTimeFilter(f)} className={`flex-1 sm:flex-none px-3 md:px-4 py-1.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase transition-all ${timeFilter === f ? 'bg-brand text-white shadow-lg' : 'text-text-secondary hover:text-brand'}`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="h-[240px] md:h-[280px] w-full">
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
                <Area type="monotone" name="Entradas" dataKey="entradas" stroke="#3b82f6" strokeWidth={3} fill="url(#cEntrada)" />
                <Area type="monotone" name="Saídas" dataKey="saidas" stroke="#ef4444" strokeWidth={3} fill="url(#cSaida)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 2: BIPOLAR (VOLUME) */}
        <div className="bg-bg-card border border-border-ui rounded-[2.2rem] md:rounded-[3rem] p-5 md:p-8 shadow-sm">
          <h3 className="text-[11px] md:text-sm font-black text-text-primary uppercase tracking-widest italic mb-8 flex items-center gap-2">
            <BarChart3 size={16} className="text-brand" /> Volume Comparativo
          </h3>
          <div className="h-[240px] md:h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeChartsData} stackOffset="sign" margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#94a3b8', fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#94a3b8'}} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                <Bar name="Entradas" dataKey="entradas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={window.innerWidth < 768 ? 8 : 12} />
                <Bar name="Saídas" dataKey="bipolarSaida" fill="#ef4444" radius={[0, 0, 4, 4]} barSize={window.innerWidth < 768 ? 8 : 12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 3: GASTOS POR CATEGORIA */}
        <div className="bg-bg-card border border-border-ui rounded-[2.2rem] md:rounded-[3rem] p-5 md:p-8 shadow-sm">
          <h3 className="text-[11px] md:text-sm font-black text-text-primary uppercase tracking-widest italic mb-6 flex items-center gap-2">
            <PieIcon size={16} className="text-brand" /> Gastos por Categoria
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="h-[180px] md:h-[220px] w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value">
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} cornerRadius={10} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 grid grid-cols-2 gap-2">
              {categoryData.slice(0, 4).map((e, i) => (
                <div key={e.name} className="flex items-center gap-2 p-3 bg-bg-main/30 rounded-2xl border border-border-ui/30">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[8px] font-black text-text-secondary uppercase truncate">{e.name}</span>
                    <span className="text-[10px] font-black text-text-primary italic">{((e.value / (categoryData.reduce((a,b)=>a+b.value,0)||1))*100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GRÁFICO 4: ALOCAÇÃO DE ATIVOS */}
        <div className="bg-bg-card border border-border-ui rounded-[2.2rem] md:rounded-[3rem] p-5 md:p-8 shadow-sm">
          <h3 className="text-[11px] md:text-sm font-black text-text-primary uppercase tracking-widest italic mb-6 flex items-center gap-2">
            <PieIcon size={16} className="text-emerald-500" /> Alocação de Ativos
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="h-[180px] md:h-[220px] w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={activeInvestmentsData} innerRadius={0} outerRadius={85} paddingAngle={2} dataKey="value">
                    {activeInvestmentsData.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 grid grid-cols-2 gap-2">
              {activeInvestmentsData.slice(0, 4).map((e, i) => (
                <div key={e.name} className="flex items-center gap-2 p-3 bg-bg-main/30 rounded-2xl border border-border-ui/30">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[(i + 2) % COLORS.length] }} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[8px] font-black text-text-secondary uppercase truncate">{e.name}</span>
                    <span className="text-[10px] font-black text-text-primary italic">{((e.value / (activeInvestmentsData.reduce((a,b)=>a+b.value,0)||1))*100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. HISTÓRICO - Mobile Card List / Desktop Table */}
      <div className="bg-bg-card border border-border-ui rounded-[2.2rem] md:rounded-[3rem] p-5 md:p-8 shadow-sm overflow-hidden">
        <h3 className="text-xl md:text-2xl font-black text-text-primary italic tracking-tighter mb-6">Histórico <span className="text-brand">Recente</span></h3>
        
        <div className="flex flex-col gap-3 md:hidden">
          {transactions.slice(0, 5).map((t) => (
            <div key={t._id} className="p-4 bg-bg-main/30 border border-border-ui/50 rounded-2xl flex items-center justify-between">
              <div className="flex flex-col gap-1 max-w-[60%]">
                <span className="text-[10px] font-black uppercase text-text-secondary/70 tracking-tighter truncate">{t.category}</span>
                <span className="text-sm font-bold text-text-primary truncate">{t.title}</span>
                <span className="text-[9px] font-medium text-text-secondary flex items-center gap-1">
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
                <tr key={t._id} className="group bg-bg-main/20 hover:bg-bg-main/50 transition-all cursor-default">
                  <td className="py-5 px-5 rounded-l-[1.5rem] font-bold text-sm text-text-primary italic border-y border-l border-transparent group-hover:border-border-ui/50">{t.title}</td>
                  <td className="py-5 px-4 text-center border-y border-transparent group-hover:border-border-ui/50">
                    <span className="inline-flex items-center gap-2 text-text-secondary font-black text-[10px] bg-bg-card px-3 py-1.5 rounded-xl border border-border-ui/20">
                      <Calendar size={12} className="text-brand" />{new Date(t.date).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="py-5 px-4 border-y border-transparent group-hover:border-border-ui/50"><span className="font-black uppercase text-[9px] tracking-widest text-text-secondary/70">{t.category}</span></td>
                  <td className={`py-5 px-5 rounded-r-[1.5rem] text-right font-black italic border-y border-r border-transparent group-hover:border-border-ui/50 ${t.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
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