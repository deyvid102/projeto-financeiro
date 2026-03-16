import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Tag, Plus, ArrowUpCircle, ArrowDownCircle, 
  Loader2, SlidersHorizontal, ChevronLeft, ChevronRight, 
  X, RotateCcw, Calendar
} from 'lucide-react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import ModalConfirm from '../../modals/ModalConfirm';
import api from "../../../services/api";
import ModalTransactions from "../../modals/ModalTransactions";
import ModalCategory from "../../modals/ModalCategory";
import FilterSidebar from "../../FilterSidebar"; 
import { useAlert } from "../../../context/AlertContext";

const TransactionsPanel = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { showAlert } = useAlert();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  const [filters, setFilters] = useState({
    period: 'all',
    category: 'all',
    order: 'date-desc',
    startDate: '',
    endDate: ''
  });

  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('transactions');
      setTransactions(response.data);
    } catch (err) {
      console.error("Erro ao carregar transações:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter, filters]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`transactions/${transactionToDelete}`);
      await fetchTransactions();
      showAlert("Transação removida com sucesso!", "success");
      setIsConfirmOpen(false);
    } catch (err) {
      showAlert("Erro ao excluir transação.", "error");
    } finally {
      setDeleteLoading(false);
      setTransactionToDelete(null);
    }
  };

  const handleEditClick = (transaction) => {
    setTransactionToEdit(transaction);
    setIsModalOpen(true);
  };

  const clearFilter = (key) => {
    if (key === 'period') {
      setFilters(prev => ({ ...prev, period: 'all', startDate: '', endDate: '' }));
    } else {
      setFilters(prev => ({ ...prev, [key]: 'all' }));
    }
  };

  const processedTransactions = useMemo(() => {
    let result = transactions.filter(t => {
      const matchesType = filter === 'all' ? true : t.type === filter;
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filters.category === 'all' ? true : t.category === filters.category;
      
      // --- TRATAMENTO DE DATA ROBUSTO ---
      // Se t.date for uma string ISO, pegamos apenas a parte YYYY-MM-DD
      const dateString = typeof t.date === 'string' ? t.date.split('T')[0] : '';
      
      const tDate = new Date(dateString + 'T12:00:00'); 
      const today = new Date();
      
      // Zeramos as horas para comparação de dias
      tDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      let matchesPeriod = true;

      if (filters.period === 'today') {
        matchesPeriod = tDate.getTime() === today.getTime();
      } else if (filters.period === 'week') {
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);
        lastWeek.setHours(0, 0, 0, 0);
        matchesPeriod = tDate >= lastWeek && tDate <= today;
      } else if (filters.period === 'month') {
        matchesPeriod = tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
      } else if (filters.period === 'custom') {
        const start = filters.startDate ? new Date(filters.startDate + 'T12:00:00') : null;
        const end = filters.endDate ? new Date(filters.endDate + 'T12:00:00') : null;
        
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);

        if (start && end) {
          matchesPeriod = tDate >= start && tDate <= end;
        } else if (start) {
          matchesPeriod = tDate >= start;
        } else if (end) {
          matchesPeriod = tDate <= end;
        }
      }

      return matchesType && matchesSearch && matchesCategory && matchesPeriod;
    });

    return result.sort((a, b) => {
      if (filters.order === 'date-desc') return new Date(b.date) - new Date(a.date);
      if (filters.order === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (filters.order === 'amount-desc') return b.amount - a.amount;
      if (filters.order === 'amount-asc') return a.amount - b.amount;
      return 0;
    });
  }, [transactions, filter, searchTerm, filters]);

  const totalPages = Math.ceil(processedTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedTransactions.slice(start, start + itemsPerPage);
  }, [processedTransactions, currentPage]);

  const uniqueCategories = useMemo(() => {
    const cats = [...new Set(transactions.map(t => t.category).filter(Boolean))];
    return cats.map(c => ({ label: c, value: c }));
  }, [transactions]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-brand">
        <Loader2 className="animate-spin mb-2" size={40} />
        <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Sincronizando fluxo...</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-6 duration-700 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black text-text-primary tracking-tighter italic uppercase">
            Minhas <span className="text-brand">Transações</span>
          </h1>
          <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.3em] mt-1 opacity-70">Controle de fluxo em tempo real</p>
        </div>
        
        <button 
          onClick={() => {
            setTransactionToEdit(null);
            setIsModalOpen(true);
          }}
          className="group flex items-center gap-3 bg-brand text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:shadow-2xl hover:shadow-brand/30 transition-all active:scale-95 shadow-lg"
        >
          <Plus size={18} strokeWidth={3} />
          Nova Transação
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="md:col-span-2 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 group-focus-within:text-brand transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-bg-card border border-border-ui rounded-2xl focus:outline-none focus:border-brand transition-all text-sm font-bold shadow-sm"
          />
        </div>
        
        <div className="flex bg-bg-card border border-border-ui rounded-2xl p-1.5 shadow-sm">
          <button onClick={() => setFilter('all')} className={`flex-1 py-2 text-[9px] uppercase tracking-[0.2em] font-black rounded-xl transition-all ${filter === 'all' ? 'bg-brand text-white shadow-md' : 'text-text-secondary'}`}>Todas</button>
          <button onClick={() => setFilter('entrada')} className={`flex-1 py-2 text-[9px] uppercase tracking-[0.2em] font-black rounded-xl transition-all ${filter === 'entrada' ? 'bg-green-500 text-white shadow-md' : 'text-text-secondary hover:text-green-500'}`}>Entradas</button>
          <button onClick={() => setFilter('saida')} className={`flex-1 py-2 text-[9px] uppercase tracking-[0.2em] font-black rounded-xl transition-all ${filter === 'saida' ? 'bg-red-500 text-white shadow-md' : 'text-text-secondary hover:text-red-500'}`}>Saídas</button>
        </div>

        <button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center justify-center gap-3 px-4 py-4 bg-bg-card border border-border-ui rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-brand transition-all shadow-sm">
          <Tag size={18} /> Categorias
        </button>

        <button onClick={() => setIsFilterSidebarOpen(true)} className={`flex items-center justify-center gap-3 px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${isFilterSidebarOpen ? 'bg-text-primary text-white border-text-primary' : 'bg-bg-card text-text-secondary border-border-ui hover:border-brand'}`}>
          <SlidersHorizontal size={18} /> Filtros
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-8 min-h-[45px]">
        {filters.period !== 'all' && (
          <div className="flex items-center gap-3 px-4 py-2 bg-brand/10 border border-brand/20 rounded-xl animate-in zoom-in duration-300">
            <Calendar size={12} className="text-brand" />
            <span className="text-[9px] font-black text-brand uppercase tracking-widest">Janela:</span>
            <span className="text-[10px] font-black text-text-primary uppercase italic">
              {filters.period === 'custom' 
                ? `${filters.startDate || '...'} até ${filters.endDate || '...'}`
                : filters.period === 'today' ? 'Hoje' : filters.period === 'week' ? '7 Dias' : 'Mês'}
            </span>
            <button onClick={() => clearFilter('period')} className="p-1 hover:bg-brand hover:text-white rounded-md transition-all text-brand"><X size={12} strokeWidth={4} /></button>
          </div>
        )}
        
        {filters.category !== 'all' && (
          <div className="flex items-center gap-3 px-4 py-2 bg-brand/10 border border-brand/20 rounded-xl animate-in zoom-in duration-300">
            <Tag size={12} className="text-brand" />
            <span className="text-[10px] font-black text-text-primary uppercase italic">{filters.category}</span>
            <button onClick={() => clearFilter('category')} className="p-1 hover:bg-brand hover:text-white rounded-md transition-all text-brand"><X size={12} strokeWidth={4} /></button>
          </div>
        )}

        {(filters.period !== 'all' || filters.category !== 'all') && (
          <button onClick={() => setFilters({ period: 'all', category: 'all', order: 'date-desc', startDate: '', endDate: '' })} className="flex items-center gap-2 px-4 py-2 text-[9px] font-black text-text-secondary hover:text-red-500 uppercase tracking-widest transition-all">
            <RotateCcw size={12} strokeWidth={3} /> Limpar tudo
          </button>
        )}
      </div>

      <div className="bg-bg-card border border-border-ui rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-main/30 text-text-secondary text-[10px] uppercase tracking-[0.2em] border-b border-border-ui/50">
                <th className="px-8 py-6 font-black">Status</th>
                <th className="px-4 py-6 font-black">Título</th>
                <th className="px-4 py-6 font-black text-center">Categoria</th>
                <th className="px-4 py-6 font-black text-center">Data</th>
                <th className="px-4 py-6 font-black text-right">Valor</th>
                <th className="px-8 py-6 font-black text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ui/30">
              {paginatedTransactions.map((t, index) => (
                <tr key={t._id} className="text-sm text-text-primary hover:bg-bg-main/20 transition-all group animate-in slide-in-from-right duration-500">
                  <td className="px-8 py-6">
                    <div className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${t.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                      {t.type === 'entrada' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                      {t.type === 'entrada' ? 'Entrada' : 'Saída'}
                    </div>
                  </td>
                  <td className="px-4 py-6 font-black italic tracking-tight text-text-primary group-hover:text-brand transition-colors uppercase">{t.title}</td>
                  <td className="px-4 py-6 text-center">
                    <span className="px-4 py-1.5 bg-bg-main border border-border-ui/50 rounded-lg text-[9px] font-black text-text-secondary uppercase tracking-widest">{t.category}</span>
                  </td>
                  <td className="px-4 py-6 text-center text-text-secondary font-bold text-xs">
                    {new Date(t.date).toLocaleDateString('pt-br', { timeZone: 'UTC' })}
                  </td>
                  <td className={`px-4 py-6 text-right font-black text-sm italic ${t.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                    {t.type === 'entrada' ? '+ ' : '- '}{t.amount.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEditClick(t)} className="p-3 bg-bg-main hover:bg-brand hover:text-white rounded-xl text-text-secondary transition-all active:scale-90"><FiEdit2 size={14} /></button>
                      <button onClick={() => { setTransactionToDelete(t._id); setIsConfirmOpen(true); }} className="p-3 bg-bg-main hover:bg-red-500 hover:text-white rounded-xl text-text-secondary transition-all active:scale-90"><FiTrash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {processedTransactions.length === 0 && (
          <div className="py-24 text-center flex flex-col items-center justify-center opacity-40">
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhum registro encontrado</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-6 bg-bg-main/10 border-t border-border-ui/50">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest italic">Página <span className="text-brand">{currentPage}</span> de {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-3 bg-bg-card border border-border-ui rounded-xl text-text-secondary hover:text-brand disabled:opacity-30 transition-all shadow-sm"><ChevronLeft size={18} strokeWidth={3} /></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-3 bg-bg-card border border-border-ui rounded-xl text-text-secondary hover:text-brand disabled:opacity-30 transition-all shadow-sm"><ChevronRight size={18} strokeWidth={3} /></button>
            </div>
          </div>
        )}
      </div>

      <FilterSidebar isOpen={isFilterSidebarOpen} onClose={() => setIsFilterSidebarOpen(false)} categories={uniqueCategories} filters={filters} setFilters={setFilters} onApply={() => setIsFilterSidebarOpen(false)} />
      <ModalTransactions isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setTransactionToEdit(null); }} onTransactionAdded={fetchTransactions} transactionToEdit={transactionToEdit} />
      <ModalCategory isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} />
      <ModalConfirm isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} loading={deleteLoading} title="Excluir Transação" message="Deseja realmente apagar esta transação?" />
    </div>
  );
};

export default TransactionsPanel;