import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, PieChart as PieIcon, ChevronRight, Search, 
  X, ArrowUpCircle, ArrowDownCircle, Target, Calendar, TrendingUp, 
  TrendingDown, ChevronLeft, Filter, Check, Wallet, CreditCard
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, ReferenceLine, PieChart, Pie, Legend 
} from 'recharts';
import api from '@/services/api';
import LoadingState from '@/components/LoadingState'; // Importando o novo componente

// --- COMPONENTE: SIDEBAR DE FILTROS ---
const FilterSidebar = ({ isOpen, onClose, filters, setFilters }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-[320px] bg-bg-card border-l border-border-ui z-[130] p-6 md:p-8 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-text-primary italic uppercase tracking-tighter">Filtros <span className="text-brand">Max</span></h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar pr-2">
          <section>
            <p className="text-[9px] font-black text-brand uppercase tracking-[0.2em] mb-4">Tipo de Fluxo</p>
            <div className="grid grid-cols-1 gap-2">
              {['todos', 'entrada', 'saida'].map(t => (
                <button 
                  key={t}
                  onClick={() => setFilters({ ...filters, viewType: t })}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border uppercase text-[9px] font-black tracking-widest ${
                    filters.viewType === t ? 'bg-brand/10 border-brand text-brand' : 'bg-bg-main/50 border-border-ui/50 text-text-secondary'
                  }`}
                >
                  {t}
                  {filters.viewType === t && <Check size={14} />}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[9px] font-black text-brand uppercase tracking-[0.2em] mb-4">Período Analítico</p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: '7d', label: 'Últimos 7 dias' },
                { id: '30d', label: 'Últimos 30 dias' },
                { id: '12m', label: 'Último Ano (12M)' },
                { id: 'custom', label: 'Intervalo Personalizado' }
              ].map(r => (
                <button 
                  key={r.id}
                  onClick={() => setFilters({ ...filters, timeRange: r.id })}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border uppercase text-[9px] font-black tracking-widest text-left ${
                    filters.timeRange === r.id ? 'bg-text-primary/10 border-text-primary text-text-primary' : 'bg-bg-main/50 border-border-ui/50 text-text-secondary'
                  }`}
                >
                  {r.label}
                  {filters.timeRange === r.id && <Check size={14} />}
                </button>
              ))}
            </div>

            {filters.timeRange === 'custom' && (
              <div className="mt-4 space-y-2 bg-bg-main p-4 rounded-2xl border border-border-ui">
                <div className="space-y-1">
                  <label className="text-[7px] font-black text-text-secondary uppercase px-1">Início</label>
                  <input type="date" value={filters.customRange.start} onChange={(e) => setFilters({...filters, customRange: {...filters.customRange, start: e.target.value}})} className="w-full bg-bg-card border border-border-ui/50 rounded-lg p-2 text-[9px] font-black text-text-primary outline-none focus:border-brand" />
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] font-black text-text-secondary uppercase px-1">Fim</label>
                  <input type="date" value={filters.customRange.end} onChange={(e) => setFilters({...filters, customRange: {...filters.customRange, end: e.target.value}})} className="w-full bg-bg-card border border-border-ui/50 rounded-lg p-2 text-[9px] font-black text-text-primary outline-none focus:border-brand" />
                </div>
              </div>
            )}
          </section>
        </div>

        <button onClick={onClose} className="w-full bg-brand py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand/20 mt-6 active:scale-95 transition-transform">
          Aplicar Filtros
        </button>
      </div>
    </>
  );
};

// --- COMPONENTE: MODAL RESUMO DIÁRIO ---
const MonthSummaryModal = ({ isOpen, onClose, transactions }) => {
  const [viewDate, setViewDate] = useState(new Date());

  const summaryData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const now = new Date();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const daysArray = [];
    let monthlyIn = 0, monthlyOut = 0;

    for (let i = 1; i <= lastDay; i++) {
      const cur = new Date(year, month, i);
      const dayTransactions = transactions.filter(t => new Date(t.date).toDateString() === cur.toDateString());
      const inVal = dayTransactions.filter(t => t.type === 'entrada').reduce((acc, t) => acc + t.amount, 0);
      const outVal = dayTransactions.filter(t => t.type === 'saida').reduce((acc, t) => acc + t.amount, 0);
      monthlyIn += inVal; monthlyOut += outVal;
      daysArray.push({ day: i, label: `${i < 10 ? '0'+i : i}/${(month+1)<10 ? '0'+(month+1) : (month+1)}`, isFuture: cur > now, isToday: cur.toDateString() === now.toDateString(), in: inVal, out: outVal, balance: inVal - outVal, hasActivity: dayTransactions.length > 0 });
    }
    return { days: daysArray, totalIn: monthlyIn, totalOut: monthlyOut, net: monthlyIn - monthlyOut, period: viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) };
  }, [transactions, viewDate, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/95 backdrop-blur-xl">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-bg-card w-full max-w-2xl rounded-t-[2rem] md:rounded-[3rem] border border-border-ui shadow-2xl relative overflow-hidden flex flex-col h-[85vh] md:max-h-[90vh]">
        <div className="p-5 md:p-8 border-b border-border-ui/50">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 border border-border-ui/50 rounded-xl text-brand"><ChevronLeft size={18} /></button>
              <h2 className="text-sm md:text-2xl font-black text-text-primary italic uppercase tracking-tighter min-w-[120px] md:min-w-[150px] text-center">{summaryData.period}</h2>
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 border border-border-ui/50 rounded-xl text-brand"><ChevronRight size={18} /></button>
            </div>
            <button onClick={onClose} className="p-2 text-text-secondary"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-3 gap-1.5 md:gap-2">
            <div className="bg-bg-main p-2 md:p-3 rounded-xl md:rounded-2xl text-center md:text-left"><p className="text-[6px] md:text-[7px] font-black text-emerald-500 uppercase">Entradas</p><p className="text-[10px] md:text-sm font-black text-text-primary italic">R$ {summaryData.totalIn.toLocaleString('pt-BR')}</p></div>
            <div className="bg-bg-main p-2 md:p-3 rounded-xl md:rounded-2xl text-center md:text-left"><p className="text-[6px] md:text-[7px] font-black text-red-500 uppercase">Saídas</p><p className="text-[10px] md:text-sm font-black text-text-primary italic">R$ {summaryData.totalOut.toLocaleString('pt-BR')}</p></div>
            <div className="bg-brand p-2 md:p-3 rounded-xl md:rounded-2xl text-center md:text-left"><p className="text-[6px] md:text-[7px] font-black text-white/60 uppercase">Saldo</p><p className="text-[10px] md:text-sm font-black text-white italic">R$ {summaryData.net.toLocaleString('pt-BR')}</p></div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4 space-y-1">
          {summaryData.days.map((item) => (
            <div key={item.day} className={`grid grid-cols-4 px-3 py-2.5 rounded-lg border ${item.isToday ? 'bg-brand/10 border-brand' : item.isFuture ? 'opacity-30 border-dashed border-border-ui/30' : 'border-border-ui/10 bg-bg-card/40'}`}>
              <div className="flex flex-col md:flex-row gap-0.5 md:gap-1 items-start md:items-center">
                <span className="text-[9px] font-black text-text-primary">{item.label}</span>
                {item.isToday && <span className="text-[5px] bg-brand text-white px-1 rounded-sm">HOJE</span>}
              </div>
              <div className="text-right text-[9px] font-bold text-emerald-500">{item.in > 0 ? item.in.toLocaleString('pt-BR') : '---'}</div>
              <div className="text-right text-[9px] font-bold text-red-500">{item.out > 0 ? item.out.toLocaleString('pt-BR') : '---'}</div>
              <div className="flex justify-end">{item.hasActivity && (item.balance >= 0 ? <TrendingUp size={10} className="text-emerald-500/40" /> : <TrendingDown size={10} className="text-red-500/40" />)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL: EXPENSES PANEL ---
const ExpensesPanel = () => {
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [cards, setCards] = useState([]);
  
  const [filters, setFilters] = useState({
    viewType: 'todos',
    timeRange: '12m',
    customRange: { start: '', end: '' }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [transactionRes, cardRes] = await Promise.all([
          api.get('/transactions'),
          api.get('/cards'),
        ]);
        setAllTransactions(transactionRes.data || []);
        setCards(cardRes.data || []);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    const now = new Date();
    return allTransactions.filter(t => {
      const tDate = new Date(t.date);
      const matchType = filters.viewType === 'todos' ? true : t.type === filters.viewType;
      let matchTime = true;
      if (filters.timeRange === '7d') {
        const d = new Date(); d.setDate(now.getDate() - 7);
        matchTime = tDate >= d;
      } else if (filters.timeRange === '30d') {
        const d = new Date(); d.setMonth(now.getMonth() - 1);
        matchTime = tDate >= d;
      } else if (filters.timeRange === '12m') {
        const d = new Date(); d.setFullYear(now.getFullYear() - 1);
        matchTime = tDate >= d;
      } else if (filters.timeRange === 'custom' && filters.customRange.start && filters.customRange.end) {
        const start = new Date(filters.customRange.start);
        const end = new Date(filters.customRange.end);
        end.setHours(23, 59, 59);
        matchTime = tDate >= start && tDate <= end;
      }
      return matchType && matchTime;
    });
  }, [allTransactions, filters]);

  const summary = useMemo(() => {
    const income = allTransactions.filter(t => t.type === 'entrada').reduce((acc, curr) => acc + Number(curr.amount), 0);
    const expense = allTransactions.filter(t => t.type === 'saida').reduce((acc, curr) => acc + Number(curr.amount), 0);
    return { income, expense, balance: income - expense };
  }, [allTransactions]);

  const stats = useMemo(() => {
    const totalOut = filteredData.filter(t => t.type === 'saida').reduce((acc, curr) => acc + curr.amount, 0);
    const totalIn = filteredData.filter(t => t.type === 'entrada').reduce((acc, curr) => acc + curr.amount, 0);
    return { totalOut, totalIn, totalVolume: totalIn + totalOut };
  }, [filteredData]);

  const chartData = useMemo(() => {
    if (filters.timeRange === '12m') {
      return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((name, index) => {
        const mData = filteredData.filter(t => new Date(t.date).getMonth() === index);
        return { name, entrada: mData.filter(t => t.type === 'entrada').reduce((a, b) => a + b.amount, 0), saida: -mData.filter(t => t.type === 'saida').reduce((a, b) => a + b.amount, 0) };
      });
    }
    const days = filters.timeRange === '7d' ? 7 : 30;
    const data = []; const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(now.getDate() - i);
      const dayT = filteredData.filter(t => new Date(t.date).toDateString() === d.toDateString());
      data.push({ name: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), entrada: dayT.filter(t => t.type === 'entrada').reduce((a, b) => a + b.amount, 0), saida: -dayT.filter(t => t.type === 'saida').reduce((a, b) => a + b.amount, 0) });
    }
    return data;
  }, [filteredData, filters.timeRange]);

  const categoryData = useMemo(() => {
    const cats = {};
    filteredData.forEach(t => { cats[t.category] = (cats[t.category] || 0) + t.amount; });
    return Object.entries(cats).map(([name, value]) => ({ name, value, percent: stats.totalVolume > 0 ? (value / stats.totalVolume) * 100 : 0 })).sort((a, b) => b.value - a.value);
  }, [filteredData, stats.totalVolume]);

  const cardsOverview = useMemo(() => {
    const creditCards = cards.filter((c) => c.type === 'credito');
    const used = creditCards.reduce((acc, c) => acc + Number(c.usedLimit || 0), 0);
    const limit = creditCards.reduce((acc, c) => acc + Number(c.creditLimit || 0), 0);
    const va = cards.filter((c) => c.type === 'vale_alimentacao').reduce((acc, c) => acc + Number(c.vaBalance || 0), 0);
    return {
      total: cards.length,
      used,
      available: limit - used,
      va,
    };
  }, [cards]);

  // Utilizando o componente padrão para consistência visual
  if (loading) return <LoadingState message="PROCESSANDO FLUXO ESTRATÉGICO..." />;

  return (
    <div className="w-full pb-10 px-4 md:px-0 text-left space-y-4 md:space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-text-primary italic uppercase tracking-tighter">
            Fluxo <span className="text-brand">Estratégico</span>
          </h1>
          <div className="flex gap-2 mt-3 md:mt-4">
            <button onClick={() => setIsSummaryOpen(true)} className="bg-brand/10 hover:bg-brand text-brand hover:text-white border border-brand/20 px-3 py-2 rounded-xl md:rounded-2xl transition-all flex items-center gap-2 group cursor-pointer active:scale-95">
              <Calendar size={14} className="md:w-4 md:h-4" />
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Extrato</span>
            </button>
            <button onClick={() => setIsFilterOpen(true)} className="bg-bg-card border border-border-ui px-3 py-2 rounded-xl md:rounded-2xl flex items-center gap-2 text-text-primary hover:border-brand transition-all cursor-pointer">
              <Filter size={14} className="text-brand md:w-4 md:h-4" />
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOPBAR DE RESUMO (Mobile optimized) */}
      <div className="bg-bg-card border border-border-ui p-4 md:p-8 rounded-2xl md:rounded-[3rem] shadow-sm relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-8 items-center relative z-10">
          <div className="flex flex-col md:border-r border-border-ui/50 pr-2">
            <div className="flex items-center gap-2 mb-0.5 md:mb-1">
              <Wallet size={12} className="text-brand opacity-70 md:w-3.5 md:h-3.5" />
              <span className="text-[7px] md:text-[10px] text-text-secondary font-black uppercase tracking-widest opacity-60">Saldo Global</span>
            </div>
            <h2 className="text-lg md:text-3xl font-black text-text-primary italic tracking-tighter truncate">
              {summary.balance.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
            </h2>
          </div>

          <div className="flex flex-col md:border-r border-border-ui/50 md:px-2">
            <div className="flex items-center gap-2 mb-0.5 md:mb-1">
              <ArrowUpCircle size={12} className="text-emerald-500 opacity-70 md:w-3.5 md:h-3.5" />
              <span className="text-[7px] md:text-[10px] text-text-secondary font-black uppercase tracking-widest opacity-60">Receitas</span>
            </div>
            <h2 className="text-md md:text-2xl font-black text-emerald-500 italic tracking-tighter truncate">
              {summary.income.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
            </h2>
          </div>

          <div className="flex flex-col md:px-2">
            <div className="flex items-center gap-2 mb-0.5 md:mb-1">
              <ArrowDownCircle size={12} className="text-red-500 opacity-70 md:w-3.5 md:h-3.5" />
              <span className="text-[7px] md:text-[10px] text-text-secondary font-black uppercase tracking-widest opacity-60">Despesas</span>
            </div>
            <h2 className="text-md md:text-2xl font-black text-red-500 italic tracking-tighter truncate">
              {summary.expense.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
            </h2>
          </div>
        </div>
      </div>

      {/* CHART SECTION */}
      <div className="bg-bg-card border border-border-ui rounded-[2rem] md:rounded-[3rem] p-5 md:p-10 shadow-sm">
        <h3 className="text-[10px] md:text-xs font-black text-text-primary uppercase tracking-[0.2em] mb-8 md:mb-12 flex items-center gap-2.5 italic">
          <DollarSign size={14} className="text-brand" /> Fluxo Consolidado
        </h3>
        <div className="h-[280px] md:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 900, fill: '#94a3b8'}} dy={10}/>
              <YAxis hide />
              <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.03)'}} content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-bg-card p-3 rounded-2xl border border-border-ui shadow-2xl text-left">
                      <p className="text-[9px] font-black uppercase text-brand mb-1">{d.name}</p>
                      <p className="text-[10px] font-bold text-emerald-500">In: R$ {d.entrada.toFixed(2)}</p>
                      <p className="text-[10px] font-bold text-red-500">Out: R$ {Math.abs(d.saida).toFixed(2)}</p>
                    </div>
                  );
                }
                return null;
              }} />
              <ReferenceLine y={0} stroke="var(--border-ui)" strokeWidth={1} />
              <Bar isAnimationActive={false} dataKey="entrada" fill="#10b981" radius={[6, 6, 0, 0]} barSize={filters.timeRange === '12m' ? 25 : 10} />
              <Bar isAnimationActive={false} dataKey="saida" fill="#ef4444" radius={[0, 0, 6, 6]} barSize={filters.timeRange === '12m' ? 25 : 10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BOTTOM GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        <div className="bg-bg-card border border-border-ui rounded-[2rem] p-6 md:p-8 lg:col-span-2">
          <h3 className="text-[10px] md:text-xs font-black text-text-primary uppercase mb-6 italic flex items-center gap-2">
            <CreditCard size={12} className="text-brand"/> Cartões no Fluxo
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-bg-main/20 border border-border-ui/30">
              <p className="text-[8px] uppercase font-black text-text-secondary">Ativos</p>
              <p className="text-2xl font-black italic text-brand mt-1">{cardsOverview.total}</p>
            </div>
            <div className="p-4 rounded-2xl bg-bg-main/20 border border-border-ui/30">
              <p className="text-[8px] uppercase font-black text-text-secondary">Crédito usado</p>
              <p className="text-sm font-black italic text-red-500 mt-2">
                {cardsOverview.used.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-bg-main/20 border border-border-ui/30">
              <p className="text-[8px] uppercase font-black text-text-secondary">Crédito livre</p>
              <p className="text-sm font-black italic text-green-500 mt-2">
                {cardsOverview.available.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-bg-main/20 border border-border-ui/30">
              <p className="text-[8px] uppercase font-black text-text-secondary">Saldo VA</p>
              <p className="text-sm font-black italic text-brand mt-2">
                {cardsOverview.va.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-bg-card border border-border-ui rounded-[2rem] p-6 md:p-8">
          <h3 className="text-[10px] md:text-xs font-black text-text-primary uppercase mb-6 italic flex items-center gap-2">
            <ChevronRight size={12} className="text-brand"/> Categorias
          </h3>
          <div className="space-y-5">
            {categoryData.slice(0, 5).map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-[9px] font-black uppercase mb-1.5">
                  <span className="text-text-primary">{item.name}</span>
                  <span className="text-brand">{item.percent.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1 bg-bg-main rounded-full overflow-hidden border border-border-ui">
                  <div className="h-full bg-brand" style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-bg-card border border-border-ui rounded-[2rem] p-6 md:p-8 flex flex-col items-center">
          <h3 className="text-[10px] md:text-xs font-black text-text-primary uppercase mb-4 self-start italic">
            <PieIcon size={12} className="inline mr-2 text-brand"/> Mix Financeiro
          </h3>
          <div className="h-[220px] md:h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie isAnimationActive={false} data={categoryData} innerRadius={60} outerRadius={85} paddingAngle={6} dataKey="value" stroke="none">
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={['#00d1ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} className="outline-none" />
                  ))}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: '8px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <FilterSidebar isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} filters={filters} setFilters={setFilters} />
      <MonthSummaryModal isOpen={isSummaryOpen} onClose={() => setIsSummaryOpen(false)} transactions={allTransactions} />
    </div>
  );
};

export default ExpensesPanel;