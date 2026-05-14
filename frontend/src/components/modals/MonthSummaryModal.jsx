import React, { useMemo } from 'react';
import { X, ArrowUpCircle, ArrowDownCircle, Target, Calendar, PieChart } from 'lucide-react';

const MonthSummaryModal = ({ isOpen, onClose, transactions }) => {
  const [viewDate, setViewDate] = useState(new Date());

  const summaryData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const now = new Date();
    // Zera as horas para comparação justa
    now.setHours(0, 0, 0, 0);

    const lastDay = new Date(year, month + 1, 0).getDate();
    const daysArray = [];
    let monthlyIn = 0, monthlyOut = 0;

    for (let i = 1; i <= lastDay; i++) {
      const cur = new Date(year, month, i);
      
      // Filtro robusto ignorando fuso horário
      const dayTransactions = transactions.filter(t => {
        const [tYear, tMonth, tDay] = t.date.split('T')[0].split('-').map(Number);
        return tYear === year && tMonth === (month + 1) && tDay === i;
      });

      const inVal = dayTransactions.filter(t => t.type === 'entrada').reduce((acc, t) => acc + Number(t.amount), 0);
      const outVal = dayTransactions.filter(t => t.type === 'saida').reduce((acc, t) => acc + Number(t.amount), 0);
      
      monthlyIn += inVal; 
      monthlyOut += outVal;

      daysArray.push({ 
        day: i, 
        label: `${i < 10 ? '0'+i : i}/${(month+1)<10 ? '0'+(month+1) : (month+1)}`, 
        isFuture: cur > now, 
        isToday: cur.getTime() === now.getTime(), 
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
      period: viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) 
    };
  }, [transactions, viewDate, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="bg-bg-card w-full max-w-lg rounded-[3rem] border border-border-ui shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-border-ui/50 flex justify-between items-center bg-gradient-to-r from-brand/5 to-transparent">
          <div>
            <h2 className="text-2xl font-black text-text-primary italic uppercase tracking-tighter">
              Resumo <span className="text-brand text-3xl">MAX</span>
            </h2>
            <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mt-1">{summary.period}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-text-secondary transition-all active:scale-90">
            <X size={24} strokeWidth={3} />
          </button>
        </div>
        {/* Content */}
        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          
          {/* Cards Rápidos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-bg-main p-6 rounded-[2rem] border border-emerald-500/20 relative overflow-hidden group">
               <ArrowUpCircle className="absolute -right-2 -bottom-2 text-emerald-500/10 group-hover:scale-110 transition-transform" size={80} />
               <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Entradas</p>
               <p className="text-xl font-black text-text-primary italic">R$ {summary.income.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-bg-main p-6 rounded-[2rem] border border-red-500/20 relative overflow-hidden group">
               <ArrowDownCircle className="absolute -right-2 -bottom-2 text-red-500/10 group-hover:scale-110 transition-transform" size={80} />
               <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Saídas</p>
               <p className="text-xl font-black text-text-primary italic">R$ {summary.expenses.toLocaleString('pt-BR')}</p>
            </div>
          </div>

          {/* Saldo do Mês */}
          <div className="bg-brand p-8 rounded-[2.5rem] shadow-xl shadow-brand/20 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Resultado Líquido</p>
              <h3 className="text-3xl font-black text-white italic tracking-tighter">
                R$ {summary.balance.toLocaleString('pt-BR')}
              </h3>
            </div>
            <Target className="text-white/20" size={48} strokeWidth={3} />
          </div>

          {/* Categorias Criticas */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
              <PieChart size={14} className="text-brand" /> Maiores Gastos por Categoria
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {summary.topCategories.map((cat, i) => (
                <div key={i} className="flex items-center justify-between bg-bg-main/50 p-4 rounded-2xl border border-border-ui/40">
                  <span className="text-xs font-black text-text-primary uppercase italic">{cat.name}</span>
                  <span className="text-xs font-black text-brand tracking-tighter">
                    R$ {cat.value.toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
              {summary.topCategories.length === 0 && (
                <p className="text-[10px] text-text-secondary uppercase italic py-4 text-center">Nenhuma saída registrada este mês</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-bg-main/50 border-t border-border-ui/50 flex justify-center">
            <div className="flex items-center gap-2 text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-60">
                <Calendar size={12} />
                Frequência: {summary.count} operações detectadas
            </div>
        </div>
      </div>
    </div>
  );
};

export default MonthSummaryModal;