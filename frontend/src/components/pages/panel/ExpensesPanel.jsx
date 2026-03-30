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
import LoadingState from '@/components/LoadingState';

const FilterSidebar = ({ isOpen, onClose, filters, setFilters }) => {
  if (!isOpen) return null;

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
                  onClick={() => setFilters({ ...filters, viewType: t })}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border uppercase text-[8px] font-black tracking-widest ${
                    filters.viewType === t ? 'bg-brand/10 border-brand text-brand' : 'bg-bg-main/50 border-border-ui/50 text-text-secondary'
                  }`}
                >
                  {t}
                  {filters.viewType === t && <Check size={12} />}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[8px] font-black text-brand uppercase tracking-[0.2em] mb-3">Período Analítico</p>
            <div className="grid grid-cols-1 gap-1.5">
              {[
                { id: '7d', label: 'Últimos 7 dias' },
                { id: '30d', label: 'Últimos 30 dias' },
                { id: '12m', label: 'Último Ano (12M)' },
                { id: 'custom', label: 'Personalizado' }
              ].map(r => (
                <button 
                  key={r.id}
                  onClick={() => setFilters({ ...filters, timeRange: r.id })}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border uppercase text-[8px] font-black tracking-widest text-left ${
                    filters.timeRange === r.id ? 'bg-text-primary/10 border-text-primary text-text-primary' : 'bg-bg-main/50 border-border-ui/50 text-text-secondary'
                  }`}
                >
                  {r.label}
                  {filters.timeRange === r.id && <Check size={12} />}
                </button>
              ))}
            </div>
          </section>
        </div>

        <button onClick={onClose} className="w-full bg-brand py-3 rounded-xl text-white text-[9px] font-black uppercase tracking-[0.2em] mt-6 active:scale-95 transition-transform">
          Aplicar Filtros
        </button>
      </div>
    </>
  );
};

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
    return { total: cards.length, used, available: limit - used, va };
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
              <span className="text-[7px] md:text-[8px] text-text-secondary font-black uppercase tracking-widest opacity-60">Saldo Global</span>
            </div>
            <h2 className="text-base md:text-2xl font-black text-text-primary italic tracking-tighter truncate">
              {summary.balance.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
            </h2>
          </div>

          <div className="flex flex-col md:border-r border-border-ui/30 md:px-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <ArrowUpCircle size={10} className="text-emerald-500 opacity-60" />
              <span className="text-[7px] md:text-[8px] text-text-secondary font-black uppercase tracking-widest opacity-60">Receitas</span>
            </div>
            <h2 className="text-sm md:text-xl font-black text-emerald-500 italic tracking-tighter truncate">
              {summary.income.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
            </h2>
          </div>

          <div className="flex flex-col md:px-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <ArrowDownCircle size={10} className="text-red-500 opacity-60" />
              <span className="text-[7px] md:text-[8px] text-text-secondary font-black uppercase tracking-widest opacity-60">Despesas</span>
            </div>
            <h2 className="text-sm md:text-xl font-black text-red-500 italic tracking-tighter truncate">
              {summary.expense.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
            </h2>
          </div>
        </div>
      </div>

      <div className="bg-bg-card border border-border-ui rounded-2xl md:rounded-[2rem] p-4 md:p-6 shadow-sm">
        <h3 className="text-[8px] md:text-[10px] font-black text-text-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-2 italic">
          <DollarSign size={12} className="text-brand" /> Fluxo Consolidado
        </h3>
        <div className="h-[220px] md:h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 7, fontWeight: 900, fill: '#94a3b8'}} dy={10}/>
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
            {categoryData.slice(0, 4).map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-[8px] font-black uppercase mb-1">
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