import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, PieChart as PieIcon, ChevronRight, Search, 
  X, ArrowUpCircle, ArrowDownCircle, Target, Calendar, TrendingUp, 
  TrendingDown, ChevronLeft, Filter, Check, Wallet, CreditCard, AlertCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, ReferenceLine, PieChart, Pie, Legend 
} from 'recharts';
import api from '@/services/api';
import LoadingState from '@/components/LoadingState';

// --- COMPONENTE: SIDEBAR DE FILTROS (AGORA COM ESTADO INTERNO) ---
const FilterSidebar = ({ isOpen, onClose, filters, setFilters }) => {
  // Estado local para não travar o painel principal enquanto o usuário escolhe
  const [draftFilters, setDraftFilters] = useState(filters);

  // Sincroniza o rascunho com os filtros reais sempre que abrir a sidebar
  useEffect(() => {
    if (isOpen) setDraftFilters(filters);
  }, [isOpen, filters]);

  if (!isOpen) return null;

  // Validação de datas
  const isDateInvalid = draftFilters.timeRange === 'custom' && 
    draftFilters.startDate && draftFilters.endDate && 
    new Date(draftFilters.startDate) > new Date(draftFilters.endDate);

  const handleApply = () => {
    if (isDateInvalid) return;
    setFilters(draftFilters); // Só aqui o painel principal é atualizado
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-[280px] bg-bg-card border-l border-border-ui z-[130] p-6 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-text-primary italic uppercase tracking-tighter">Filtros <span className="text-brand">Max</span></h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl">
            <X size={18} className="text-text-secondary" />
          </button>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
          <section>
            <p className="text-[8px] font-black text-brand uppercase tracking-[0.2em] mb-3">Tipo de Fluxo</p>
            <div className="grid grid-cols-1 gap-1.5">
              {['todos', 'entrada', 'saida'].map(t => (
                <button 
                  key={t}
                  onClick={() => setDraftFilters({ ...draftFilters, viewType: t })}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border uppercase text-[8px] font-black tracking-widest ${
                    draftFilters.viewType === t ? 'bg-brand/10 border-brand text-brand' : 'bg-bg-main/50 border-border-ui/50 text-text-secondary'
                  }`}
                >
                  {t}
                  {draftFilters.viewType === t && <Check size={12} />}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[8px] font-black text-brand uppercase tracking-[0.2em] mb-3">Período Analítico</p>
            <div className="grid grid-cols-1 gap-1.5 mb-4">
              {[
                { id: '7d', label: 'Últimos 7 dias' },
                { id: '30d', label: 'Últimos 30 dias' },
                { id: '12m', label: 'Último Ano (12M)' },
                { id: 'custom', label: 'Período Específico' }
              ].map(r => (
                <button 
                  key={r.id}
                  onClick={() => setDraftFilters({ ...draftFilters, timeRange: r.id })}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border uppercase text-[8px] font-black tracking-widest text-left ${
                    draftFilters.timeRange === r.id ? 'bg-text-primary/10 border-text-primary text-text-primary' : 'bg-bg-main/50 border-border-ui/50 text-text-secondary'
                  }`}
                >
                  {r.label}
                  {draftFilters.timeRange === r.id && <Check size={12} />}
                </button>
              ))}
            </div>

            {draftFilters.timeRange === 'custom' && (
              <div className="grid grid-cols-1 gap-3 p-3 bg-bg-main/30 rounded-xl border border-border-ui/50 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="text-[7px] font-black text-text-secondary uppercase mb-1 block">Início</label>
                  <input 
                    type="date" 
                    value={draftFilters.startDate}
                    onChange={(e) => setDraftFilters({ ...draftFilters, startDate: e.target.value })}
                    className="w-full bg-bg-card border border-border-ui rounded-md px-2 py-1.5 text-[10px] text-text-primary focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="text-[7px] font-black text-text-secondary uppercase mb-1 block">Fim</label>
                  <input 
                    type="date" 
                    value={draftFilters.endDate}
                    onChange={(e) => setDraftFilters({ ...draftFilters, endDate: e.target.value })}
                    className={`w-full bg-bg-card border rounded-md px-2 py-1.5 text-[10px] text-text-primary focus:outline-none ${isDateInvalid ? 'border-red-500' : 'border-border-ui focus:border-brand'}`}
                  />
                </div>
                {isDateInvalid && (
                  <div className="flex items-center gap-1 text-red-500 mt-1">
                    <AlertCircle size={10} />
                    <span className="text-[7px] font-black uppercase">Data fim inválida</span>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <button 
          onClick={handleApply}
          disabled={isDateInvalid}
          className={`w-full py-3 rounded-xl text-white text-[9px] font-black uppercase tracking-[0.2em] mt-6 transition-all ${
            isDateInvalid ? 'bg-gray-600 opacity-50 cursor-not-allowed' : 'bg-brand active:scale-95'
          }`}
        >
          Aplicar Filtros
        </button>
      </div>
    </>
  );
};

// --- COMPONENTE: MODAL DE EXTRATO MENSAL ---
const MonthSummaryModal = ({ isOpen, onClose, transactions }) => {
  const [viewDate, setViewDate] = useState(new Date());

  // Normalize viewDate to start of day UTC for consistent calculations
  const normalizedViewDate = useMemo(() => {
    const d = new Date(viewDate);
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1)); // Always start of month UTC
  }, [viewDate]);

  const summaryData = useMemo(() => {
    if (!isOpen) return { days: [], totalIn: 0, totalOut: 0, net: 0, period: '' };
    
    const year = normalizedViewDate.getUTCFullYear();
    const month = normalizedViewDate.getUTCMonth(); // 0-11

    const now = new Date();
    const nowUtcStartOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const daysArray = [];
    let monthlyIn = 0, monthlyOut = 0;

    for (let i = 1; i <= lastDay; i++) {
      const cur = new Date(Date.UTC(year, month, i)); // Create UTC date for current day
      const dayTransactions = (transactions || []).filter(t => {
        if (!t.date) return false; // Ensure t.date exists
        const tDate = new Date(t.date); // Transaction date is UTC
        // Compare UTC year, month, and day
        return tDate.getUTCFullYear() === year && tDate.getUTCMonth() === month && tDate.getUTCDate() === i;
      });

      const inVal = dayTransactions.filter(t => t.type === 'entrada').reduce((acc, t) => acc + Number(t.amount || 0), 0);
      const outVal = dayTransactions.filter(t => t.type === 'saida').reduce((acc, t) => acc + Number(t.amount || 0), 0);
      monthlyIn += inVal; 
      monthlyOut += outVal;
      
      daysArray.push({ 
        day: i, 
        label: `${i < 10 ? '0'+i : i}/${(month+1)<10 ? '0'+(month+1) : (month+1)}`, 
        isFuture: cur > nowUtcStartOfDay, 
        isToday: cur.getTime() === nowUtcStartOfDay.getTime(), 
        in: inVal, 
        out: outVal, 
        balance: inVal - outVal, 
        hasActivity: dayTransactions.length > 0 
      });
    }
    
    return { 
      days: daysArray, 
      totalIn: monthlyIn, 
      totalOut: monthlyOut, 
      net: monthlyIn - monthlyOut, 
      period: normalizedViewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }) 
    };
  }, [transactions, normalizedViewDate, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-bg-card w-full max-w-xl rounded-t-2xl md:rounded-[2rem] border border-border-ui shadow-2xl relative overflow-hidden flex flex-col h-[80vh] md:max-h-[85vh]">
        <div className="p-4 md:p-6 border-b border-border-ui/50">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-1.5 border border-border-ui/50 rounded-lg text-brand"><ChevronLeft size={16} /></button>
              <h2 className="text-xs md:text-lg font-black text-text-primary italic uppercase tracking-tighter min-w-[100px] text-center">{summaryData.period}</h2>
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-1.5 border border-border-ui/50 rounded-lg text-brand"><ChevronRight size={16} /></button>
            </div>
            <button onClick={onClose} className="p-1.5 text-text-secondary"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-bg-main p-2 rounded-xl text-center"><p className="text-[6px] font-black text-emerald-500 uppercase">In</p><p className="text-[9px] font-black text-text-primary italic">R$ {summaryData.totalIn.toLocaleString('pt-BR')}</p></div>
            <div className="bg-bg-main p-2 rounded-xl text-center"><p className="text-[6px] font-black text-red-500 uppercase">Out</p><p className="text-[9px] font-black text-text-primary italic">R$ {summaryData.totalOut.toLocaleString('pt-BR')}</p></div>
            <div className="bg-brand p-2 rounded-xl text-center"><p className="text-[6px] font-black text-white/60 uppercase">Saldo</p><p className="text-[9px] font-black text-white italic">R$ {summaryData.net.toLocaleString('pt-BR')}</p></div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {summaryData.days.map((item) => (
            <div key={item.day} className={`grid grid-cols-4 px-3 py-2 rounded-lg border ${item.isToday ? 'bg-brand/5 border-brand/40' : item.isFuture ? 'opacity-20' : 'border-border-ui/5 bg-bg-card/40'}`}>
              <div className="flex items-center gap-1">
                <span className="text-[8px] font-black text-text-primary">{item.label}</span>
              </div>
              <div className="text-right text-[8px] font-bold text-emerald-500">{item.in > 0 ? item.in.toLocaleString('pt-BR') : '-'}</div>
              <div className="text-right text-[8px] font-bold text-red-500">{item.out > 0 ? item.out.toLocaleString('pt-BR') : '-'}</div>
              <div className="flex justify-end items-center">{item.hasActivity && (item.balance >= 0 ? <TrendingUp size={8} className="text-emerald-500/40" /> : <TrendingDown size={8} className="text-red-500/40" />)}</div>
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
    startDate: '', 
    endDate: ''    
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

  // --- FILTRAGEM ---
  const filteredData = useMemo(() => {
    return (allTransactions || []).filter(t => {
      if (!t.date) return false;
      const tDate = new Date(t.date); // This is UTC
      // Normalize tDate to start of day UTC for consistent comparison
      const tDateUtcStartOfDay = new Date(Date.UTC(tDate.getUTCFullYear(), tDate.getUTCMonth(), tDate.getUTCDate()));

      const matchType = filters.viewType === 'todos' ? true : t.type === filters.viewType;
      let matchTime = true;
      const now = new Date();
      // Normalize 'now' to start/end of day UTC for consistent comparison
      const nowUtcStartOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      const nowUtcEndOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));

      if (filters.timeRange === '7d') {
        const limit = new Date(nowUtcStartOfDay);
        limit.setUTCDate(nowUtcStartOfDay.getUTCDate() - 7);
        matchTime = tDateUtcStartOfDay >= limit;
      } else if (filters.timeRange === '30d') {
        const limit = new Date(nowUtcStartOfDay);
        limit.setUTCMonth(nowUtcStartOfDay.getUTCMonth() - 1);
        matchTime = tDateUtcStartOfDay >= limit;
      } else if (filters.timeRange === '12m') {
        const limit = new Date(nowUtcStartOfDay);
        limit.setUTCFullYear(nowUtcStartOfDay.getUTCFullYear() - 1);
        matchTime = tDateUtcStartOfDay >= limit;
      } else if (filters.timeRange === 'custom') {
        if (filters.startDate && filters.endDate) {
          const [sY, sM, sD] = filters.startDate.split('-').map(Number);
          const [eY, eM, eD] = filters.endDate.split('-').map(Number);
          const start = new Date(Date.UTC(sY, sM - 1, sD, 0, 0, 0));
          const end = new Date(Date.UTC(eY, eM - 1, eD, 23, 59, 59, 999));
          matchTime = tDateUtcStartOfDay >= start && tDateUtcStartOfDay <= end;
        } else {
          matchTime = false;
        }
      }
      return matchType && matchTime;
    });
  }, [allTransactions, filters]);

  // --- STATS CONSOLIDADOS ---
  const stats = useMemo(() => {
    const totalIn = filteredData.filter(t => t.type === 'entrada').reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const totalOut = filteredData.filter(t => t.type === 'saida').reduce((acc, t) => acc + Number(t.amount || 0), 0);
    return {
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
      totalVolume: totalIn + totalOut
    };
  }, [filteredData]);

  // --- GRÁFICO COM GRANULARIDADE ---
  const chartData = useMemo(() => {
    if (filteredData.length === 0) return [];
    let startDate, endDate;

    if (filters.timeRange === 'custom' && filters.startDate && filters.endDate) {
      const [sY, sM, sD] = filters.startDate.split('-').map(Number);
      const [eY, eM, eD] = filters.endDate.split('-').map(Number);
      // Create UTC dates for custom range
      startDate = new Date(Date.UTC(sY, sM - 1, sD, 0, 0, 0));
      endDate = new Date(Date.UTC(eY, eM - 1, eD, 23, 59, 59, 999));
    } else {
      // Sort by UTC date
      const sortedDates = [...filteredData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      // Extract UTC components for start and end dates
      const firstDate = new Date(sortedDates[0].date);
      const lastDate = new Date(sortedDates[sortedDates.length - 1].date);
      startDate = new Date(Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth(), firstDate.getUTCDate(), 0, 0, 0));
      endDate = new Date(Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth(), lastDate.getUTCDate(), 23, 59, 59, 999));
    }

    const diffDays = Math.ceil(Math.abs(endDate - startDate) / (1000 * 60 * 60 * 24));
    const data = [];

    if (diffDays <= 15) {
      // Iterate day by day using UTC
      for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
        const dayStr = d.toISOString().split('T')[0]; // This is UTC date string
        const dayT = filteredData.filter(t => {
          // Compare transaction date (UTC) with current day string (UTC)
          return new Date(t.date).toISOString().split('T')[0] === dayStr;
        });
        data.push({
          name: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }),
          entrada: dayT.filter(t => t.type === 'entrada').reduce((a, b) => a + Number(b.amount || 0), 0),
          saida: -dayT.filter(t => t.type === 'saida').reduce((a, b) => a + Number(b.amount || 0), 0)
        });
      }
    } else if (diffDays <= 366) {
      // Iterate month by month using UTC
      let current = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));
      const last = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1));
      while (current <= last) {
        const m = current.getUTCMonth();
        const y = current.getUTCFullYear();
        const monthT = filteredData.filter(t => {
          const d = new Date(t.date); // Transaction date is UTC
          return d.getUTCMonth() === m && d.getUTCFullYear() === y;
        });
        data.push({
          name: current.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }).toUpperCase(),
          entrada: monthT.filter(t => t.type === 'entrada').reduce((a, b) => a + Number(b.amount || 0), 0),
          saida: -monthT.filter(t => t.type === 'saida').reduce((a, b) => a + Number(b.amount || 0), 0)
        });
        current.setUTCMonth(current.getUTCMonth() + 1);
      }
    } else {
      // Iterate year by year using UTC
      for (let y = startDate.getUTCFullYear(); y <= endDate.getUTCFullYear(); y++) {
        const yearT = filteredData.filter(t => new Date(t.date).getUTCFullYear() === y);
        data.push({
          name: y.toString(),
          entrada: yearT.filter(t => t.type === 'entrada').reduce((a, b) => a + Number(b.amount || 0), 0),
          saida: -yearT.filter(t => t.type === 'saida').reduce((a, b) => a + Number(b.amount || 0), 0)
        });
      }
    }
    return data;
  }, [filteredData, filters]);

  const categoryData = useMemo(() => {
    const cats = {};
    filteredData.forEach(t => { 
      if (t.category) cats[t.category] = (cats[t.category] || 0) + Number(t.amount || 0); 
    });
    return Object.entries(cats).map(([name, value]) => ({ 
      name, 
      value, 
      percent: stats.totalVolume > 0 ? (value / stats.totalVolume) * 100 : 0 
    })).sort((a, b) => b.value - a.value);
  }, [filteredData, stats.totalVolume]);

  const cardsOverview = useMemo(() => {
    const creditCards = (cards || []).filter((c) => c.type === 'credito');
    const used = creditCards.reduce((acc, c) => acc + Number(c.usedLimit || 0), 0);
    const limit = creditCards.reduce((acc, c) => acc + Number(c.creditLimit || 0), 0);
    const va = (cards || []).filter((c) => c.type === 'vale_alimentacao').reduce((acc, c) => acc + Number(c.vaBalance || 0), 0);
    return { total: (cards || []).length, used, available: limit - used, va };
  }, [cards]);

  if (loading) return <LoadingState message="PROCESSANDO FLUXO ESTRATÉGICO..." />;

  return (
    <div className="w-full pb-6 px-4 md:px-0 text-left space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-text-primary italic uppercase tracking-tighter leading-none">
            Fluxo <span className="text-brand">Estratégico</span>
          </h1>
          <div className="flex gap-1.5 mt-2">
            <button onClick={() => setIsSummaryOpen(true)} className="bg-brand/10 hover:bg-brand text-brand hover:text-white border border-brand/20 px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95">
              <Calendar size={12} />
              <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Extrato</span>
            </button>
            <button onClick={() => setIsFilterOpen(true)} className="bg-bg-card border border-border-ui px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-text-primary hover:border-brand transition-all cursor-pointer">
              <Filter size={12} className="text-brand" />
              <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Filtros</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-bg-card border border-border-ui p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 items-center">
          <div className="flex flex-col md:border-r border-border-ui/30 pr-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Wallet size={10} className="text-brand opacity-60" />
              <span className="text-[7px] md:text-[8px] text-text-secondary font-black uppercase tracking-widest opacity-60">Saldo Período</span>
            </div>
            <h2 className="text-base md:text-2xl font-black text-text-primary italic tracking-tighter truncate">
              {stats.balance.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
            </h2>
          </div>

          <div className="flex flex-col md:border-r border-border-ui/30 md:px-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <ArrowUpCircle size={10} className="text-emerald-500 opacity-60" />
              <span className="text-[7px] md:text-[8px] text-text-secondary font-black uppercase tracking-widest opacity-60">Receitas</span>
            </div>
            <h2 className="text-sm md:text-xl font-black text-emerald-500 italic tracking-tighter truncate">
              {stats.totalIn.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
            </h2>
          </div>

          <div className="flex flex-col md:px-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <ArrowDownCircle size={10} className="text-red-500 opacity-60" />
              <span className="text-[7px] md:text-[8px] text-text-secondary font-black uppercase tracking-widest opacity-60">Despesas</span>
            </div>
            <h2 className="text-sm md:text-xl font-black text-red-500 italic tracking-tighter truncate">
              {stats.totalOut.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
            </h2>
          </div>
        </div>
      </div>

      <div className="bg-bg-card border border-border-ui rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm">
        <h3 className="text-[8px] md:text-[10px] font-black text-text-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-2 italic">
          <DollarSign size={12} className="text-brand" /> Fluxo Consolidado
        </h3>
        <div className="h-[220px] md:h-[300px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} stackOffset="sign">
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 7, fontWeight: 900, fill: '#94a3b8'}} dy={10} interval="preserveStartEnd"/>
                <YAxis hide />
                <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.03)'}} content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-bg-card p-2 rounded-xl border border-border-ui shadow-2xl text-left">
                        <p className="text-[8px] font-black uppercase text-brand mb-1">{d.name}</p>
                        <p className="text-[9px] font-bold text-emerald-500">In: R$ {d.entrada.toFixed(2)}</p>
                        <p className="text-[9px] font-bold text-red-500">Out: R$ {Math.abs(d.saida).toFixed(2)}</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <ReferenceLine y={0} stroke="var(--border-ui)" strokeWidth={1} />
                <Bar isAnimationActive={false} dataKey="entrada" fill="#10b981" radius={[4, 4, 0, 0]} barSize={filters.timeRange === '12m' ? 18 : 8} />
                <Bar isAnimationActive={false} dataKey="saida" fill="#ef4444" radius={[0, 0, 4, 4]} barSize={filters.timeRange === '12m' ? 18 : 8} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-text-secondary">
               <Calendar size={24} className="opacity-20 mb-2" />
               <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Aguardando período válido...</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-bg-card border border-border-ui rounded-2xl p-5 lg:col-span-2">
          <h3 className="text-[8px] md:text-[10px] font-black text-text-primary uppercase mb-4 italic flex items-center gap-2">
            <CreditCard size={10} className="text-brand"/> Cartões no Fluxo
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {[
              { label: 'Ativos', val: cardsOverview.total, color: 'text-brand' },
              { label: 'Crédito usado', val: cardsOverview.used.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), color: 'text-red-500' },
              { label: 'Crédito livre', val: cardsOverview.available.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), color: 'text-green-500' },
              { label: 'Saldo VA', val: cardsOverview.va.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), color: 'text-brand' }
            ].map((c, i) => (
              <div key={i} className="p-3 rounded-xl bg-bg-main/20 border border-border-ui/20">
                <p className="text-[7px] uppercase font-black text-text-secondary">{c.label}</p>
                <p className={`text-xs md:text-sm font-black italic mt-1 ${c.color}`}>{c.val}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-card border border-border-ui rounded-2xl p-5">
          <h3 className="text-[8px] md:text-[10px] font-black text-text-primary uppercase mb-4 italic flex items-center gap-2">
            <ChevronRight size={10} className="text-brand"/> Categorias
          </h3>
          <div className="space-y-4">
            {categoryData.length > 0 ? categoryData.slice(0, 4).map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-[8px] font-black uppercase mb-1">
                  <span className="text-text-primary">{item.name}</span>
                  <span className="text-brand">{item.percent.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1 bg-bg-main rounded-full overflow-hidden border border-border-ui">
                  <div className="h-full bg-brand" style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            )) : <p className="text-[8px] uppercase font-black opacity-20">Sem dados...</p>}
          </div>
        </div>
        
        <div className="bg-bg-card border border-border-ui rounded-2xl p-5 flex flex-col items-center">
          <h3 className="text-[8px] md:text-[10px] font-black text-text-primary uppercase mb-2 self-start italic">
            <PieIcon size={10} className="inline mr-2 text-brand"/> Mix Financeiro
          </h3>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie isAnimationActive={false} data={categoryData} innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value" stroke="none">
                  {categoryData.map((entry, index) => (
                    <Cell key={index} fill={['#00d1ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} className="outline-none" />
                  ))}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: '7px', fontWeight: '900', textTransform: 'uppercase', paddingTop: '15px' }} />
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