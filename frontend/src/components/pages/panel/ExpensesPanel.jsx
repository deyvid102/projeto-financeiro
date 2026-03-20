import React, { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, DollarSign, PieChart as PieIcon, ChevronRight, Search 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, ReferenceLine, PieChart, Pie, Legend 
} from 'recharts';
import api from '@/services/api';

// TOOLTIP CUSTOMIZADO PARA O GRÁFICO DE PIZZA
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-bg-card/95 backdrop-blur-xl p-5 rounded-[2rem] border border-border-ui shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" 
            style={{ backgroundColor: data.fill || payload[0].color }} 
          />
          <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
            {data.name}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-black italic text-text-primary tracking-tighter">
            R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 bg-bg-main rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand transition-all duration-1000" 
                style={{ width: `${data.percent}%` }} 
              />
            </div>
            <p className="text-[10px] font-black text-brand italic">
              {data.percent.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const ExpensesPanel = () => {
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [viewType, setViewType] = useState('todos'); 
  const [timeRange, setTimeRange] = useState('12m');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/transactions');
        setAllTransactions(response.data);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 1. FILTRAGEM DOS DADOS BRUTOS
  const filteredData = useMemo(() => {
    const now = new Date();
    return allTransactions.filter(t => {
      const tDate = new Date(t.date);
      const matchType = viewType === 'todos' ? true : t.type === viewType;
      
      let matchTime = true;
      if (timeRange === '7d') {
        const d = new Date(); d.setDate(now.getDate() - 7);
        matchTime = tDate >= d;
      } else if (timeRange === '30d') {
        const d = new Date(); d.setMonth(now.getMonth() - 1);
        matchTime = tDate >= d;
      } else if (timeRange === '12m') {
        const d = new Date(); d.setFullYear(now.getFullYear() - 1);
        matchTime = tDate >= d;
      } else if (timeRange === 'custom' && customRange.start && customRange.end) {
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        end.setHours(23, 59, 59);
        matchTime = tDate >= start && tDate <= end;
      }
      return matchType && matchTime;
    });
  }, [allTransactions, viewType, timeRange, customRange]);

  const stats = useMemo(() => {
    const totalOut = filteredData.filter(t => t.type === 'saida').reduce((acc, curr) => acc + curr.amount, 0);
    const totalIn = filteredData.filter(t => t.type === 'entrada').reduce((acc, curr) => acc + curr.amount, 0);
    return { totalOut, totalIn, totalVolume: totalIn + totalOut };
  }, [filteredData]);

  // 2. LÓGICA DINÂMICA DO GRÁFICO (CHART DATA)
  const chartData = useMemo(() => {
    if (timeRange === '12m') {
      const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return monthsNames.map((name, index) => {
        const mData = filteredData.filter(t => new Date(t.date).getMonth() === index);
        return {
          name,
          entrada: mData.filter(t => t.type === 'entrada').reduce((a, b) => a + b.amount, 0),
          saida: -mData.filter(t => t.type === 'saida').reduce((a, b) => a + b.amount, 0)
        };
      });
    }

    // Para 7d ou 30d, vamos agrupar por DIA
    const daysToIterate = timeRange === '7d' ? 7 : 30;
    const data = [];
    const now = new Date();

    for (let i = daysToIterate - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateString = d.toDateString();
      
      const dayTransactions = filteredData.filter(t => new Date(t.date).toDateString() === dateString);
      
      data.push({
        name: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        entrada: dayTransactions.filter(t => t.type === 'entrada').reduce((a, b) => a + b.amount, 0),
        saida: -dayTransactions.filter(t => t.type === 'saida').reduce((a, b) => a + b.amount, 0)
      });
    }
    return data;
  }, [filteredData, timeRange]);

  const categoryData = useMemo(() => {
    const categories = {};
    filteredData.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    return Object.entries(categories)
      .map(([name, value]) => ({
        name, value,
        percent: stats.totalVolume > 0 ? (value / stats.totalVolume) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData, stats.totalVolume]);

  const COLORS = ['#00d1ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-brand">
      <Loader2 className="animate-spin mb-4" size={40} />
      <p className="font-black uppercase tracking-[0.3em] text-[10px]">ENGINE LOADING...</p>
    </div>
  );

  return (
    <div className="w-full pb-10 px-4 md:px-0">
      
      <div className="mb-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-text-primary italic uppercase tracking-tighter">Fluxo <span className="text-brand">Estratégico</span></h1>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex bg-bg-card border border-border-ui p-1 rounded-xl shadow-inner">
              {['todos', 'saida', 'entrada'].map(t => (
                <button key={t} onClick={() => setViewType(t)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewType === t ? 'bg-brand text-white shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}>{t}</button>
              ))}
            </div>
            <div className="flex bg-bg-card border border-border-ui p-1 rounded-xl shadow-inner">
              {['12m', '30d', '7d', 'custom'].map(r => (
                <button key={r} onClick={() => setTimeRange(r)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${timeRange === r ? 'bg-text-primary text-bg-main shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}>{r}</button>
              ))}
            </div>

            {timeRange === 'custom' && (
              <div className="flex items-center gap-3 bg-bg-card border border-brand/30 p-2 rounded-xl animate-in zoom-in-95 duration-300 shadow-lg shadow-brand/5">
                <input type="date" className="bg-transparent text-[10px] font-black uppercase text-text-primary outline-none cursor-pointer" value={customRange.start} onChange={(e) => setCustomRange({...customRange, start: e.target.value})} />
                <div className="h-4 w-[1px] bg-border-ui" />
                <input type="date" className="bg-transparent text-[10px] font-black uppercase text-text-primary outline-none cursor-pointer" value={customRange.end} onChange={(e) => setCustomRange({...customRange, end: e.target.value})} />
                <Search size={14} className="text-brand ml-1" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GRÁFICO BI-DIRECIONAL */}
      <div className="bg-bg-card border border-border-ui rounded-[3rem] p-10 mb-10 hover:border-brand/40 transition-all shadow-sm">
        <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.2em] mb-12 flex items-center gap-3"><DollarSign size={16} className="text-brand" /> Fluxo Consolidado ({timeRange})</h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} dy={15}/>
              <YAxis hide />
              <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.03)'}} 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-bg-card p-4 rounded-3xl border border-border-ui shadow-2xl animate-in fade-in zoom-in-95">
                        <p className="text-[10px] font-black uppercase text-brand mb-2">{d.name}</p>
                        <p className="text-xs font-bold text-emerald-500">In: R$ {d.entrada.toFixed(2)}</p>
                        <p className="text-xs font-bold text-red-500">Out: R$ {Math.abs(d.saida).toFixed(2)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={0} stroke="var(--border-ui)" strokeWidth={1} />
              <Bar dataKey="entrada" fill="#10b981" radius={[10, 10, 0, 0]} barSize={timeRange === '12m' ? 40 : 15} />
              <Bar dataKey="saida" fill="#ef4444" radius={[0, 0, 10, 10]} barSize={timeRange === '12m' ? 40 : 15} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CATEGORIAS E PIZZA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-bg-card border border-border-ui rounded-[3rem] p-8">
          <h3 className="text-xs font-black text-text-primary uppercase mb-8 italic flex items-center gap-2"><ChevronRight size={14} className="text-brand"/> Volume por Categoria</h3>
          <div className="space-y-6">
            {categoryData.slice(0, 5).map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                  <span className="text-text-primary">{item.name}</span>
                  <span className="text-brand">{item.percent.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-bg-main rounded-full overflow-hidden border border-border-ui shadow-inner">
                  <div className="h-full bg-brand transition-all duration-1000" style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-card border border-border-ui rounded-[3rem] p-8 flex flex-col items-center">
          <h3 className="text-xs font-black text-text-primary uppercase mb-4 self-start italic"><PieIcon size={14} className="inline mr-2 text-brand"/> Mix Financeiro</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={categoryData} 
                  innerRadius={70} 
                  outerRadius={95} 
                  paddingAngle={8} 
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={index} 
                      fill={COLORS[index % COLORS.length]} 
                      className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{ 
                    fontSize: '9px', 
                    fontWeight: '900', 
                    textTransform: 'uppercase', 
                    paddingTop: '30px',
                    letterSpacing: '0.1em'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesPanel;