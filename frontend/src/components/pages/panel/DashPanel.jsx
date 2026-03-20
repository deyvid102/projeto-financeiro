import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Loader2, Calendar, TrendingUp, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, ReferenceLine } from 'recharts';
import api from '../../../services/api';

// Tooltip Personalizada com Glassmorphism e Design Premium
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-card/80 backdrop-blur-xl border border-border-ui p-4 rounded-[1.5rem] shadow-2xl animate-in fade-in zoom-in duration-200">
        <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-3 border-b border-border-ui/50 pb-2 italic">
          {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-[11px] font-bold text-text-primary uppercase italic">{entry.name}</span>
              </div>
              <span className="text-[12px] font-black italic" style={{ color: entry.color || entry.fill }}>
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
        
        const profit = invData.reduce((acc, inv) => {
          return acc + (getValorAtual(inv) - (Number(inv.amountInvested) || 0));
        }, 0);

        setSummary({ income, expense, balance: income - expense, totalProfit: profit });
      } catch (err) {
        console.error("Erro ao carregar painel:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getValorAtual]);

  // Processamento de dados para gráficos temporais
  const timeChartsData = useMemo(() => {
    const now = new Date();
    const dataMap = {};
    const periods = timeFilter === 'semanal' ? 7 : timeFilter === 'mensal' ? 30 : 12;
    
    for (let i = periods - 1; i >= 0; i--) {
      const d = new Date();
      if (timeFilter === 'anual') d.setMonth(now.getMonth() - i); 
      else d.setDate(now.getDate() - i);
      
      const label = timeFilter === 'anual' 
        ? d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '') 
        : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      dataMap[label] = { name: label, entradas: 0, saidas: 0, bipolarSaida: 0, rawDate: new Date(d) };
    }

    transactions.forEach(t => {
      const d = new Date(t.date);
      let label = (timeFilter === 'anual') 
        ? d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '')
        : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      if (dataMap[label]) {
        if (t.type === 'entrada') dataMap[label].entradas += Number(t.amount);
        else {
          dataMap[label].saidas += Number(t.amount);
          dataMap[label].bipolarSaida -= Number(t.amount); // Valor negativo para o gráfico bipolar
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-brand">
        <Loader2 className="animate-spin mb-2" size={40} />
        <p className="text-sm font-black uppercase tracking-widest italic opacity-50 text-text-secondary">Sincronizando Engine...</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500 pb-10">
      
      {/* 1. CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-900 p-8 rounded-[2.5rem] text-white shadow-blue-500/20 shadow-2xl transition-all hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-4"><span className="text-[10px] opacity-70 font-black uppercase tracking-widest">Saldo Disponível</span><Wallet size={18} /></div>
          <h2 className="text-3xl font-black italic tracking-tighter">{summary.balance.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}</h2>
        </div>

        <div className="bg-bg-card border border-border-ui p-8 rounded-[2.5rem] shadow-sm transition-all hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-4"><span className="text-[10px] text-text-secondary font-black uppercase tracking-widest">Entradas Totais</span><ArrowUpCircle className="text-emerald-500" size={18} /></div>
          <h2 className="text-3xl font-black text-emerald-500 italic tracking-tighter">{summary.income.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}</h2>
        </div>

        <div className="bg-bg-card border border-border-ui p-8 rounded-[2.5rem] shadow-sm transition-all hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-4"><span className="text-[10px] text-text-secondary font-black uppercase tracking-widest">Saídas Totais</span><ArrowDownCircle className="text-red-500" size={18} /></div>
          <h2 className="text-3xl font-black text-red-500 italic tracking-tighter">{summary.expense.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}</h2>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-8 rounded-[2.5rem] text-white shadow-emerald-500/20 shadow-2xl transition-all hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-4"><span className="text-[10px] opacity-70 font-black uppercase tracking-widest">Rendimento Total</span><TrendingUp size={18} /></div>
          <h2 className="text-3xl font-black italic tracking-tighter">+{summary.totalProfit.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}</h2>
        </div>
      </div>

      {/* 2. GRID DE GRÁFICOS (2 COLUNAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        
        {/* COLUNA ESQUERDA: TEMPORAL */}
        <div className="space-y-8">
          {/* FLUXO DE CAIXA */}
          <div className="bg-bg-card border border-border-ui rounded-[3rem] p-8 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-black text-text-primary uppercase tracking-widest italic">Fluxo de Caixa</h3>
              <div className="flex bg-bg-main p-1 rounded-xl border border-border-ui/50">
                {['semanal', 'mensal', 'anual'].map((f) => (
                  <button key={f} onClick={() => setTimeFilter(f)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${timeFilter === f ? 'bg-brand text-white' : 'text-text-secondary hover:text-brand'}`}>{f}</button>
                ))}
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeChartsData}>
                  <defs>
                    <linearGradient id="cEntrada" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                    <linearGradient id="cSaida" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 'bold'}} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" name="Entradas" dataKey="entradas" stroke="#3b82f6" strokeWidth={4} fill="url(#cEntrada)" />
                  <Area type="monotone" name="Saídas" dataKey="saidas" stroke="#ef4444" strokeWidth={4} fill="url(#cSaida)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICO BIPOLAR */}
          <div className="bg-bg-card border border-border-ui rounded-[3rem] p-8 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-widest italic mb-8 flex items-center gap-2">
              <BarChart3 size={16} className="text-brand" /> Comparativo de Volume
            </h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeChartsData} stackOffset="sign">
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 'bold'}} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                  <Bar name="Entradas" dataKey="entradas" fill="#10b981" radius={[10, 10, 0, 0]} barSize={12} />
                  <Bar name="Saídas" dataKey="bipolarSaida" fill="#ef4444" radius={[0, 0, 10, 10]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: DISTRIBUIÇÃO */}
        <div className="space-y-8">
          {/* GASTOS POR CATEGORIA */}
          <div className="bg-bg-card border border-border-ui rounded-[3rem] p-8 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-widest italic mb-6">Gastos por Categoria</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value">
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} cornerRadius={10} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-8">
              {categoryData.slice(0, 4).map((e, i) => (
                <div key={e.name} className="flex items-center gap-3 p-3 bg-bg-main/40 rounded-2xl border border-border-ui/30">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[9px] font-black text-text-secondary uppercase truncate flex-1">{e.name}</span>
                  <span className="text-[10px] font-black text-text-primary italic">{((e.value / (categoryData.reduce((a,b)=>a+b.value,0)||1))*100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* INVESTIMENTOS ATIVOS */}
          <div className="bg-bg-card border border-border-ui rounded-[3rem] p-8 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-widest italic mb-6 flex items-center gap-2">
              <PieIcon size={16} className="text-emerald-500" /> Alocação de Ativos
            </h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={activeInvestmentsData} innerRadius={0} outerRadius={90} paddingAngle={2} dataKey="value">
                    {activeInvestmentsData.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-8">
              {activeInvestmentsData.slice(0, 4).map((e, i) => (
                <div key={e.name} className="flex items-center gap-3 p-3 bg-bg-main/40 rounded-2xl border border-border-ui/30">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[(i + 2) % COLORS.length] }} />
                  <span className="text-[9px] font-black text-text-secondary uppercase truncate flex-1">{e.name}</span>
                  <span className="text-[10px] font-black text-text-primary italic">{((e.value / (activeInvestmentsData.reduce((a,b)=>a+b.value,0)||1))*100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. HISTÓRICO */}
      <div className="bg-bg-card border border-border-ui rounded-[3rem] p-8 shadow-sm">
        <h3 className="text-2xl font-black text-text-primary italic tracking-tighter mb-8">Histórico <span className="text-brand">Recente</span></h3>
        <div className="overflow-x-auto px-2">
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
                <tr key={t._id} className="group bg-bg-main/20 hover:bg-bg-main/50 transition-all">
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