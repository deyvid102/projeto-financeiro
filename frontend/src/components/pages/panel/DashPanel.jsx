import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Loader2, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../../services/Api';

const DashPanel = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ balance: 0, income: 0, expense: 0 });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('anual');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/transactions');
        const data = response.data;
        const sortedData = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransactions(sortedData);
        calculateSummary(data);
      } catch (err) {
        console.error("Erro ao carregar painel:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const calculateSummary = (items) => {
    const income = items
      .filter(t => t.type === 'entrada')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    const expense = items
      .filter(t => t.type === 'saida')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    setSummary({ income, expense, balance: income - expense });
  };

  const chartData = useMemo(() => {
    const now = new Date();
    const dataMap = {};
    const result = [];

    if (timeFilter === 'semanal') {
      // Gera os últimos 7 dias começando de hoje para trás
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        dataMap[label] = { name: label, entradas: 0, saidas: 0, rawDate: new Date(d.setHours(0,0,0,0)) };
      }
    } 
    else if (timeFilter === 'mensal') {
      // Últimos 30 dias
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        dataMap[label] = { name: label, entradas: 0, saidas: 0, rawDate: new Date(d.setHours(0,0,0,0)) };
      }
    }
    else if (timeFilter === 'anual') {
      // Últimos 12 meses
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
        dataMap[label] = { name: label, entradas: 0, saidas: 0, rawDate: new Date(d.setDate(1)) };
      }
    }

    // Preenche com os dados reais das transações
    transactions.forEach(t => {
      const d = new Date(t.date);
      let label;

      if (timeFilter === 'anual') {
        label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
      } else {
        label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      }

      if (dataMap[label]) {
        if (t.type === 'entrada') dataMap[label].entradas += Number(t.amount);
        else dataMap[label].saidas += Number(t.amount);
      }
    });

    return Object.values(dataMap).sort((a, b) => a.rawDate - b.rawDate);
  }, [transactions, timeFilter]);

  const pieData = useMemo(() => {
    const categories = {};
    transactions
      .filter(t => t.type === 'saida')
      .forEach(t => {
        const catName = t.category || 'Outros';
        categories[catName] = (categories[catName] || 0) + Number(t.amount);
      });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const COLORS = ['#8b5cf6', '#06b6d4', '#ec4899', '#3b82f6', '#f59e0b', '#10b981'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-brand">
        <Loader2 className="animate-spin mb-2" size={40} />
        <p className="text-sm font-medium text-text-secondary uppercase tracking-widest italic">Sincronizando Dados...</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500 pb-10">
      
      {/* 1. CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className={`p-8 rounded-[2.5rem] text-white shadow-2xl transition-all duration-500 hover:scale-[1.02] ${
          summary.balance < 0 
            ? 'bg-gradient-to-br from-red-600 to-rose-900 shadow-red-500/20' 
            : 'bg-gradient-to-br from-brand to-blue-600 shadow-brand/20'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] opacity-80 font-black uppercase tracking-[0.2em]">Saldo Disponível</span>
            <div className="bg-white/20 p-2 rounded-xl"><Wallet size={18} /></div>
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter">
            {summary.balance.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
          </h2>
          {summary.balance < 0 && (
            <p className="text-[9px] font-black uppercase tracking-tighter mt-2 opacity-70 animate-pulse">Atenção: Saldo Devedor</p>
          )}
        </div>

        <div className="bg-bg-card border border-border-ui p-8 rounded-[2.5rem] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] text-text-secondary font-black uppercase tracking-[0.2em]">Entradas</span>
            <div className="bg-green-500/10 p-2 rounded-xl"><ArrowUpCircle className="text-green-500" size={18} /></div>
          </div>
          <h2 className="text-3xl font-black text-text-primary italic tracking-tighter">
            {summary.income.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
          </h2>
        </div>

        <div className="bg-bg-card border border-border-ui p-8 rounded-[2.5rem] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] text-text-secondary font-black uppercase tracking-[0.2em]">Saídas</span>
            <div className="bg-red-500/10 p-2 rounded-xl"><ArrowDownCircle className="text-red-500" size={18} /></div>
          </div>
          <h2 className="text-3xl font-black text-text-primary italic tracking-tighter">
            {summary.expense.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
          </h2>
        </div>
      </div>

      {/* 2. GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-bg-card border border-border-ui rounded-[3rem] p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-widest italic">Fluxo de Caixa</h3>
            
            <div className="flex bg-bg-main p-1 rounded-xl border border-border-ui/50">
              {['semanal', 'mensal', 'anual'].map((filter) => (
                <button 
                  key={filter} 
                  onClick={() => setTimeFilter(filter)}
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all duration-300 ${
                    timeFilter === filter 
                      ? 'bg-brand text-white shadow-lg shadow-brand/20 scale-105' 
                      : 'text-text-secondary hover:text-brand'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[300px] animate-in fade-in zoom-in-95 duration-500" key={timeFilter}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 'bold'}} tickFormatter={(val) => `R$${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }} 
                  itemStyle={{ fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="entradas" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorEntrada)" animationDuration={1200} />
                <Area type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorSaida)" animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg-card border border-border-ui rounded-[3rem] p-8 shadow-sm">
          <h3 className="text-sm font-black text-text-primary uppercase tracking-widest italic mb-6 text-center">Despesas por Categoria</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value">
                  {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-8">
            {pieData.slice(0, 4).map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-3 p-3 bg-bg-main/40 rounded-2xl border border-border-ui/30 hover:border-brand/30 transition-colors">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-[9px] font-black text-text-secondary uppercase truncate flex-1">{entry.name}</span>
                <span className="text-[10px] font-black text-text-primary italic">
                  {((entry.value / (summary.expense || 1)) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. TABELA DE MOVIMENTAÇÕES */}
      <div className="bg-bg-card border border-border-ui rounded-[3rem] p-8 shadow-sm">
        <div className="flex justify-between items-end mb-8 px-2">
          <div>
            <h3 className="text-2xl font-black text-text-primary italic tracking-tighter">Histórico <span className="text-brand">Recente</span></h3>
            <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest mt-1">Últimas 5 operações realizadas</p>
          </div>
        </div>

        <div className="overflow-x-auto px-2">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-text-secondary text-[9px] uppercase tracking-[0.3em] opacity-50">
                <th className="pb-2 px-4 font-black">Descrição</th>
                <th className="pb-2 px-4 font-black text-center">Data</th>
                <th className="pb-2 px-4 font-black">Categoria</th>
                <th className="pb-2 px-4 font-black text-right">Valor Líquido</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 5).map((t) => (
                <tr key={t._id} className="group bg-bg-main/20 hover:bg-bg-main/50 transition-all">
                  <td className="py-5 px-5 rounded-l-[1.5rem] font-bold text-sm text-text-primary italic border-y border-l border-transparent group-hover:border-border-ui/50">
                    {t.title}
                  </td>
                  <td className="py-5 px-4 text-center border-y border-transparent group-hover:border-border-ui/50">
                    <span className="inline-flex items-center gap-2 text-text-secondary font-black text-[10px] bg-bg-card px-3 py-1.5 rounded-xl border border-border-ui/20">
                      <Calendar size={12} className="text-brand" />
                      {new Date(t.date).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="py-5 px-4 border-y border-transparent group-hover:border-border-ui/50">
                    <span className="font-black uppercase text-[9px] tracking-widest text-text-secondary/70">
                      {t.category}
                    </span>
                  </td>
                  <td className={`py-5 px-5 rounded-r-[1.5rem] text-right font-black italic border-y border-r border-transparent group-hover:border-border-ui/50 ${t.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                    {t.type === 'entrada' ? '+ ' : '- '}
                    {Number(t.amount).toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
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