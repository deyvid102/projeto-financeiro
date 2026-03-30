import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Tag, Plus, ArrowUpCircle, ArrowDownCircle, 
  SlidersHorizontal, ChevronLeft, ChevronRight, 
  X, RotateCcw, Calendar, Repeat, CreditCard, Eye, CalendarClock, Wallet, Loader2
} from 'lucide-react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

import api from '@/services/api';
import { useAlert } from "@/context/AlertContext";

import ModalConfirm from "@/components/modals/ModalConfirm";
import ModalTransactions from "@/components/modals/ModalTransactions";
import ModalCategory from "@/components/modals/ModalCategory";
import ModalRecurrence from "@/components/modals/ModalRecurrence";
import ModalCard from "@/components/modals/ModalCard";
import FilterSidebar from "@/components/FilterSidebar";
import LoadingState from '@/components/LoadingState';

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
  const [isModalRecurrenceOpen, setIsModalRecurrenceOpen] = useState(false);
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
  const [cards, setCards] = useState([]);
  const [activeTab, setActiveTab] = useState('transactions');
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [detailCard, setDetailCard] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get('transactions');
      setTransactions(response.data);
    } catch (err) {
      console.error("Erro ao carregar transações:", err);
      showAlert("Não foi possível carregar os dados.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCards = async () => {
    try {
      const response = await api.get('/cards');
      setCards(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Erro ao carregar cartões:", err);
    }
  };

  const openCardDetails = async (card) => {
    console.log('[TransactionsPanel][CardDetails] Abrindo:', card);
    setDetailCard(card);
    setDetailData(null);
    setDetailLoading(true);
    try {
      if (card.type === 'credito') {
        const [summaryRes, transactionsRes, recurrencesRes] = await Promise.allSettled([
          api.get(`/cards/${card._id}/bill-summary`),
          api.get('/transactions'),
          api.get('/recurrences'),
        ]);

        console.log('[TransactionsPanel][CardDetails] bill-summary:', summaryRes);
        console.log('[TransactionsPanel][CardDetails] transactions:', transactionsRes);
        console.log('[TransactionsPanel][CardDetails] recurrences:', recurrencesRes);

        const summaryData = summaryRes.status === 'fulfilled' ? summaryRes.value.data : null;
        const transactionsData = transactionsRes.status === 'fulfilled' ? (transactionsRes.value.data || []) : [];
        const recurrencesData = recurrencesRes.status === 'fulfilled' ? (recurrencesRes.value.data || []) : [];

        const cardTransactions = transactionsData
          .filter((t) => t.card?._id === card._id || t.card === card._id)
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        const creditRecurrences = recurrencesData
          .filter((r) => (r.cardId?._id || r.cardId) === card._id)
          .map((r) => ({
            _id: `rec-${r._id}`,
            title: `${r.title} (${r.currentInstallment}/${r.totalInstallments}x)`,
            date: r.createdAt || new Date().toISOString(),
            type: 'saida',
            amount: Number(r.amount || 0),
            isProjected: true,
          }));

        setDetailData({
          mode: 'credito',
          summary: summaryData,
          transactions: [...cardTransactions, ...creditRecurrences].sort((a, b) => new Date(b.date) - new Date(a.date)),
        });
      } else if (card.type === 'vale_alimentacao') {
        const statementRes = await api.get(`/cards/${card._id}/va-statement`);
        console.log('[TransactionsPanel][CardDetails] va-statement:', statementRes.data);
        setDetailData({ mode: 'va', statement: statementRes.data, transactions: statementRes.data?.transactions || [] });
      } else {
        const transactionsRes = await api.get('/transactions');
        console.log('[TransactionsPanel][CardDetails] transactions débito:', transactionsRes.data);
        const cardTransactions = (transactionsRes.data || [])
          .filter((t) => t.card?._id === card._id || t.card === card._id)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setDetailData({ mode: 'debito', transactions: cardTransactions });
      }
    } catch (err) {
      console.error('[TransactionsPanel][CardDetails] Erro:', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
        url: err?.config?.url,
        method: err?.config?.method,
      });
      showAlert(err?.response?.data?.message || "Erro ao carregar detalhes do cartão.", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchCards();
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

  const handleDeleteClick = (transaction) => {
    setTransactionToDelete(transaction._id);
    setIsConfirmOpen(true);
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
      
      const dateString = typeof t.date === 'string' ? t.date.split('T')[0] : '';
      const tDate = new Date(dateString + 'T12:00:00'); 
      const today = new Date();
      tDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      let matchesPeriod = true;
      if (filters.period === 'today') matchesPeriod = tDate.getTime() === today.getTime();
      else if (filters.period === 'week') {
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);
        matchesPeriod = tDate >= lastWeek && tDate <= today;
      } else if (filters.period === 'month') {
        matchesPeriod = tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
      } else if (filters.period === 'custom') {
        const start = filters.startDate ? new Date(filters.startDate + 'T12:00:00') : null;
        const end = filters.endDate ? new Date(filters.endDate + 'T12:00:00') : null;
        if (start && end) matchesPeriod = tDate >= start && tDate <= end;
        else if (start) matchesPeriod = tDate >= start;
        else if (end) matchesPeriod = tDate <= end;
      }
      return matchesType && matchesSearch && matchesCategory && matchesPeriod;
    });

    return result.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date);
      const dateB = new Date(b.createdAt || b.date);
      if (filters.order === 'date-desc') return dateB - dateA;
      if (filters.order === 'date-asc') return dateA - dateB;
      if (filters.order === 'amount-desc') return b.amount - a.amount;
      if (filters.order === 'amount-asc') return a.amount - b.amount;
      return dateB - dateA; 
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

  if (loading && transactions.length === 0) {
    return <LoadingState message="SINCRONIZANDO FLUXO..." />;
  }

  return (
    <div className="w-full pb-6 md:pb-10 px-4 md:px-0">
      {/* Header Responsivo - Ajuste de margem mobile */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-5 md:mb-8 mt-2 md:mt-4">
        <h1 className="text-2xl md:text-4xl font-black text-text-primary tracking-tighter italic uppercase">
          Minhas <span className="text-brand">Transações</span>
        </h1>
        {activeTab === 'transactions' ? (
          <button 
            onClick={() => { setTransactionToEdit(null); setIsModalOpen(true); }} 
            className="w-full md:w-auto bg-brand text-white px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> Nova Transação
          </button>
        ) : (
          <button 
            onClick={() => setIsCardModalOpen(true)} 
            className="w-full md:w-auto bg-brand text-white px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-3 transition-transform active:scale-95"
          >
            <CreditCard size={18} strokeWidth={3} /> Gerenciar Cartões
          </button>
        )}
      </div>

      <div className="flex p-1.5 bg-bg-card border border-border-ui rounded-2xl mb-4 md:mb-6">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'transactions' ? 'bg-brand text-white' : 'text-text-secondary hover:bg-bg-main/50'}`}
        >
          Transações
        </button>
        <button
          onClick={() => setActiveTab('cards')}
          className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'cards' ? 'bg-brand text-white' : 'text-text-secondary hover:bg-bg-main/50'}`}
        >
          <CreditCard size={14} /> Cartões
        </button>
      </div>

      {activeTab === 'transactions' && (
      <>
      {/* Barra de Busca e Filtros Rápidos - Compactada no mobile */}
      <div className="flex flex-col gap-3 md:gap-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por título..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-11 pr-4 py-3.5 md:py-4 bg-bg-card border border-border-ui rounded-xl md:rounded-2xl text-sm font-bold outline-none focus:border-brand transition-all shadow-sm" 
            />
          </div>
          
          <div className="flex bg-bg-card border border-border-ui rounded-xl md:rounded-2xl p-1 shadow-sm overflow-hidden h-[48px] md:h-auto">
             <button onClick={() => setFilter('all')} className={`flex-1 flex items-center justify-center py-2 text-[9px] uppercase font-black rounded-lg md:rounded-xl transition-all ${filter === 'all' ? 'bg-brand text-white shadow-md' : 'text-text-secondary hover:bg-bg-main'}`}>TODAS</button>
             <button onClick={() => setFilter('entrada')} className={`flex-1 flex items-center justify-center py-2 rounded-lg md:rounded-xl transition-all ${filter === 'entrada' ? 'bg-green-500 text-white shadow-md' : 'text-text-secondary hover:text-green-500'}`}><ArrowUpCircle size={20} /></button>
             <button onClick={() => setFilter('saida')} className={`flex-1 flex items-center justify-center py-2 rounded-lg md:rounded-xl transition-all ${filter === 'saida' ? 'bg-red-500 text-white shadow-md' : 'text-text-secondary hover:text-red-500'}`}><ArrowDownCircle size={20} /></button>
          </div>

          <div className="grid grid-cols-3 md:contents gap-2">
            <button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center justify-center gap-2 p-3.5 md:p-4 bg-bg-card border border-border-ui rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase text-text-secondary hover:text-brand transition-all shadow-sm"><Tag size={16} /> <span className="hidden sm:inline">Categorias</span></button>
            <button onClick={() => setIsModalRecurrenceOpen(true)} className="flex items-center justify-center gap-2 p-3.5 md:p-4 bg-bg-card border border-brand/20 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase text-brand hover:bg-brand hover:text-white transition-all group shadow-sm"><Repeat size={16} /> <span className="hidden sm:inline">Recorrências</span></button>
            <button onClick={() => setIsFilterSidebarOpen(true)} className={`flex items-center justify-center gap-2 p-3.5 md:p-4 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase transition-all shadow-sm border ${isFilterSidebarOpen ? 'bg-text-primary text-white border-text-primary' : 'bg-bg-card text-text-secondary border-border-ui hover:border-brand'}`}><SlidersHorizontal size={16} /> <span className="hidden sm:inline">Filtros</span></button>
          </div>
        </div>
      </div>

      {/* Etiquetas de Filtro Ativo - Redução de padding */}
      <div className="flex flex-wrap items-center gap-2 mb-4 md:mb-6 min-h-[30px] md:min-h-[40px]">
        {filters.period !== 'all' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-lg md:rounded-xl">
            <Calendar size={12} className="text-brand" />
            <span className="text-[9px] md:text-[10px] font-black text-text-primary uppercase italic">
              {filters.period === 'custom' ? 'Personalizado' : filters.period === 'today' ? 'Hoje' : filters.period === 'week' ? '7 Dias' : 'Mês'}
            </span>
            <button onClick={() => clearFilter('period')} className="p-1 hover:bg-brand hover:text-white rounded-md transition-all text-brand"><X size={10} strokeWidth={4} /></button>
          </div>
        )}
        {filters.category !== 'all' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-lg md:rounded-xl">
            <Tag size={12} className="text-brand" />
            <span className="text-[9px] md:text-[10px] font-black text-text-primary uppercase italic">{filters.category}</span>
            <button onClick={() => clearFilter('category')} className="p-1 hover:bg-brand hover:text-white rounded-md transition-all text-brand"><X size={10} strokeWidth={4} /></button>
          </div>
        )}
        {(filters.period !== 'all' || filters.category !== 'all') && (
          <button onClick={() => setFilters({ period: 'all', category: 'all', order: 'date-desc', startDate: '', endDate: '' })} className="text-[8px] md:text-[9px] font-black text-text-secondary hover:text-red-500 uppercase tracking-widest flex items-center gap-1.5 ml-1 transition-colors">
            <RotateCcw size={12} strokeWidth={3} /> Limpar
          </button>
        )}
      </div>

      {/* Container Principal de Dados */}
      <div className="bg-bg-card border border-border-ui rounded-[1.2rem] md:rounded-[2.5rem] shadow-sm overflow-hidden">
        
        {/* VIEW DESKTOP: TABELA (Sem alterações) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-main/30 text-text-secondary text-[10px] uppercase tracking-[0.2em] border-b border-border-ui/50">
                <th className="px-8 py-6 font-black text-center">Status</th>
                <th className="px-4 py-6 font-black">Título</th>
                <th className="px-4 py-6 font-black text-center">Categoria</th>
                <th className="px-4 py-6 font-black text-center">Cartão</th>
                <th className="px-4 py-6 font-black text-center">Data</th>
                <th className="px-4 py-6 font-black text-right">Valor</th>
                <th className="px-8 py-6 font-black text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ui/30">
              {paginatedTransactions.map((t) => (
                <TransactionRow key={t._id} t={t} onEdit={handleEditClick} onDelete={handleDeleteClick} />
              ))}
            </tbody>
          </table>
        </div>

        {/* VIEW MOBILE: CARDS - Otimizado para densidade */}
        <div className="md:hidden divide-y divide-border-ui/20">
          {paginatedTransactions.map((t) => (
            <div key={t._id} className="p-4 flex flex-col gap-3 bg-bg-card active:bg-bg-main/5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-9 h-9 rounded-full ${t.type === 'entrada' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                    {t.type === 'entrada' ? <ArrowUpCircle size={20} strokeWidth={3} /> : <ArrowDownCircle size={20} strokeWidth={3} />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase italic tracking-tight text-text-primary leading-tight">{t.title}</span>
                    <span className="text-[8px] font-bold text-text-secondary opacity-60 uppercase">{new Date(t.date).toLocaleDateString('pt-br', { timeZone: 'UTC' })}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-[13px] font-black italic ${t.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                    {t.type === 'entrada' ? '+ ' : '- '}{t.amount.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <span className="px-1.5 py-0.5 bg-bg-main border border-border-ui/40 rounded text-[7px] font-black text-text-secondary uppercase mt-0.5">{t.category}</span>
                  {t.card?.name && (
                    <span className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[7px] font-black text-blue-500 uppercase mt-1">
                      {t.card.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEditClick(t)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-bg-main rounded-lg text-text-secondary font-black text-[8px] uppercase border border-border-ui/40 transition-colors active:bg-brand/10 active:text-brand"><FiEdit2 size={11}/> Editar</button>
                <button onClick={() => handleDeleteClick(t)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-bg-main rounded-lg text-red-500 font-black text-[8px] uppercase border border-red-500/10 transition-colors active:bg-red-500/10"><FiTrash2 size={11}/> Excluir</button>
              </div>
            </div>
          ))}
          {paginatedTransactions.length === 0 && (
            <div className="p-10 text-center text-[10px] font-black text-text-secondary uppercase opacity-40">Nenhuma transação encontrada</div>
          )}
        </div>

        {/* Paginação Responsiva - Mais compacta no mobile */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 md:px-8 py-4 md:py-6 bg-bg-main/10 border-t border-border-ui/50">
            <p className="text-[8px] md:text-[10px] font-black text-text-secondary uppercase tracking-widest italic">Pág <span className="text-brand">{currentPage}</span> / {totalPages}</p>
            <div className="flex gap-1.5 md:gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2.5 md:p-3 bg-bg-card border border-border-ui rounded-lg md:rounded-xl text-text-secondary hover:text-brand disabled:opacity-30 transition-all"><ChevronLeft size={16} md:size={18} strokeWidth={3} /></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2.5 md:p-3 bg-bg-card border border-border-ui rounded-lg md:rounded-xl text-text-secondary hover:text-brand disabled:opacity-30 transition-all"><ChevronRight size={16} md:size={18} strokeWidth={3} /></button>
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {activeTab === 'cards' && (
        <div className="bg-bg-card border border-border-ui rounded-[1.2rem] md:rounded-[2.5rem] shadow-sm p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
            <div className="p-4 rounded-2xl border border-border-ui/50 bg-bg-main/20">
              <p className="text-[9px] font-black uppercase text-text-secondary">Cartões ativos</p>
              <p className="text-2xl font-black italic text-brand mt-1">{cards.length}</p>
            </div>
            <div className="p-4 rounded-2xl border border-border-ui/50 bg-bg-main/20">
              <p className="text-[9px] font-black uppercase text-text-secondary">Limite total</p>
              <p className="text-lg font-black italic text-text-primary mt-1">
                R$ {cards.filter(c => c.type === 'credito').reduce((acc, c) => acc + Number(c.creditLimit || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-border-ui/50 bg-bg-main/20">
              <p className="text-[9px] font-black uppercase text-text-secondary">Saldo VA total</p>
              <p className="text-lg font-black italic text-text-primary mt-1">
                R$ {cards.filter(c => c.type === 'vale_alimentacao').reduce((acc, c) => acc + Number(c.vaBalance || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {cards.map((card) => (
              <div key={card._id} className="p-4 rounded-2xl border border-border-ui/40 bg-bg-main/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase italic text-text-primary">{card.name}</p>
                  <p className="text-[9px] font-bold text-text-secondary uppercase mt-1">
                    {card.type === 'vale_alimentacao' ? 'vale alimentação' : card.type}
                    {card.lastFourDigits ? ` • **** ${card.lastFourDigits}` : ''}
                  </p>
                </div>
                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2">
                  {card.type === 'credito' && (
                    <p className="text-[10px] font-black text-brand text-left sm:text-right">
                      Disp.: R$ {Number(card.availableLimit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                  {card.type === 'vale_alimentacao' && (
                    <p className="text-[10px] font-black text-brand text-left sm:text-right">
                      Saldo: R$ {Number(card.vaBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                  <button
                    onClick={() => openCardDetails(card)}
                    className="p-2 rounded-xl bg-bg-card border border-border-ui/40 text-text-secondary hover:text-brand transition-all"
                    title="Detalhes do cartão"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            ))}
            {cards.length === 0 && (
              <div className="p-8 text-center text-[10px] font-black uppercase text-text-secondary opacity-50">
                Nenhum cartão cadastrado
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modais */}
      <FilterSidebar isOpen={isFilterSidebarOpen} onClose={() => setIsFilterSidebarOpen(false)} categories={uniqueCategories} filters={filters} setFilters={setFilters} onApply={() => setIsFilterSidebarOpen(false)} />
      <ModalTransactions isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setTransactionToEdit(null); }} onTransactionAdded={fetchTransactions} transactionToEdit={transactionToEdit} />
      <ModalCategory isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} />
      <ModalRecurrence isOpen={isModalRecurrenceOpen} onClose={() => setIsModalRecurrenceOpen(false)} onAdded={fetchTransactions} />
      <ModalConfirm isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} loading={deleteLoading} title="Excluir Transação" message="Deseja realmente apagar esta transação?" />
      <ModalCard isOpen={isCardModalOpen} onClose={() => { setIsCardModalOpen(false); fetchCards(); }} />

      {detailCard && (
        <div className="fixed inset-0 z-[140] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setDetailCard(null)} />
          <div className="relative z-10 w-full max-w-3xl h-[90vh] md:h-auto md:max-h-[90vh] overflow-hidden bg-bg-card border border-border-ui rounded-t-[2rem] md:rounded-[2rem] shadow-2xl flex flex-col">
            <div className="p-5 md:p-6 border-b border-border-ui/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase italic text-text-primary">{detailCard.name}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mt-1">
                  {detailCard.type === 'credito' ? 'Detalhes de fatura' : detailCard.type === 'vale_alimentacao' ? 'Extrato VA' : 'Compras no débito'}
                </p>
              </div>
              <button onClick={() => setDetailCard(null)} className="p-2 rounded-xl hover:bg-bg-main transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar space-y-4">
              {detailLoading && (
                <div className="h-24 flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-brand" />
                </div>
              )}

              {!detailLoading && detailData?.mode === 'credito' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl border border-border-ui/40 bg-bg-main/20">
                    <p className="text-[9px] uppercase font-black text-text-secondary">Vira em</p>
                    <p className="text-sm font-black italic text-brand mt-1">
                      {detailData.summary?.card?.closingDay ? `Todo dia ${detailData.summary.card.closingDay}` : '--'}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border-ui/40 bg-bg-main/20">
                    <p className="text-[9px] uppercase font-black text-text-secondary">Fatura atual</p>
                    <p className="text-sm font-black italic text-red-500 mt-1">
                      R$ {Number(detailData.summary?.currentBill?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border-ui/40 bg-bg-main/20">
                    <p className="text-[9px] uppercase font-black text-text-secondary">Limite disponível</p>
                    <p className="text-sm font-black italic text-green-500 mt-1">
                      R$ {Number(detailData.summary?.card?.availableLimit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}

              {!detailLoading && detailData?.mode === 'va' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl border border-border-ui/40 bg-bg-main/20">
                    <p className="text-[9px] uppercase font-black text-text-secondary">Saldo VA</p>
                    <p className="text-sm font-black italic text-brand mt-1">
                      R$ {Number(detailData.statement?.card?.vaBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border-ui/40 bg-bg-main/20">
                    <p className="text-[9px] uppercase font-black text-text-secondary">Recarga</p>
                    <p className="text-sm font-black italic text-green-500 mt-1">
                      R$ {Number(detailData.statement?.card?.vaRechargeAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border-ui/40 bg-bg-main/20">
                    <p className="text-[9px] uppercase font-black text-text-secondary">Vira em</p>
                    <p className="text-sm font-black italic text-text-primary mt-1">
                      Todo dia {detailData.statement?.card?.vaRechargeDay || '--'}
                    </p>
                  </div>
                </div>
              )}

              {!detailLoading && (
                <div className="rounded-2xl border border-border-ui/40 overflow-hidden">
                  <div className="px-4 py-3 bg-bg-main/30 border-b border-border-ui/40 flex items-center gap-2">
                    <Wallet size={14} className="text-brand" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Compras recentes</p>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto custom-scrollbar divide-y divide-border-ui/20">
                    {(detailData?.transactions || []).slice(0, 30).map((t) => (
                      <div key={t._id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase text-text-primary">{t.title}</p>
                          <p className="text-[9px] font-bold text-text-secondary mt-1 flex items-center gap-1">
                            <CalendarClock size={12} />
                            {new Date(t.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <p className={`text-[10px] font-black italic ${t.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                          {t.type === 'entrada' ? '+ ' : '- '}
                          {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          {t.isProjected ? ' (prevista)' : ''}
                        </p>
                      </div>
                    ))}
                    {(detailData?.transactions || []).length === 0 && (
                      <div className="px-4 py-6 text-center text-[10px] font-black uppercase text-text-secondary opacity-60">
                        Sem compras para este cartão
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-componente para a linha da tabela (Desktop) - Mantido igual
const TransactionRow = ({ t, onEdit, onDelete }) => {
  const hasInstallments = t.recurrence?.totalInstallments > 1 || t.totalInstallments > 1;
  const current = t.currentInstallment || t.recurrence?.currentInstallment;
  const total = t.totalInstallments || t.recurrence?.totalInstallments;

  return (
    <tr className="text-sm text-text-primary hover:bg-bg-main/20 transition-all group">
      <td className="px-8 py-6 text-center">
        <div className={`flex items-center justify-center w-9 h-9 mx-auto rounded-full ${t.type === 'entrada' ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
          {t.type === 'entrada' ? <ArrowUpCircle size={22} strokeWidth={3} /> : <ArrowDownCircle size={22} strokeWidth={3} />}
        </div>
      </td>
      <td className="px-4 py-6">
        <div className="flex flex-col">
          <span className="font-black italic tracking-tight uppercase group-hover:text-brand transition-colors">
            {t.title} 
            {hasInstallments && <span className="ml-1.5 text-blue-500 font-black not-italic lowercase">({current}/{total})</span>}
          </span>
          <div className="flex gap-2 items-center mt-1">
            {t.isRecurring && (
              <span className="flex items-center gap-1 text-[8px] font-black text-brand uppercase tracking-tighter">
                <Repeat size={10} /> Recorrente
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-6 text-center">
        <span className="px-4 py-1.5 bg-bg-main border border-border-ui/50 rounded-lg text-[9px] font-black text-text-secondary uppercase tracking-widest">{t.category}</span>
      </td>
      <td className="px-4 py-6 text-center">
        {t.card ? (
          <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] font-black text-blue-500 uppercase tracking-widest">
            {t.card?.name || 'Cartão'}
          </span>
        ) : null}
      </td>
      <td className="px-4 py-6 text-center text-text-secondary font-bold text-xs">
        {new Date(t.date).toLocaleDateString('pt-br', { timeZone: 'UTC' })}
      </td>
      <td className={`px-4 py-6 text-right font-black text-sm italic ${t.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
        {t.type === 'entrada' ? '+ ' : '- '}{t.amount.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
      </td>
      <td className="px-8 py-6 text-center">
        <div className="flex justify-center gap-2">
          <button onClick={() => onEdit(t)} className="p-3 bg-bg-main rounded-xl transition-all hover:bg-brand hover:text-white text-text-secondary">
            <FiEdit2 size={14} />
          </button>
          <button onClick={() => onDelete(t)} className="p-3 bg-bg-main rounded-xl transition-all hover:bg-red-500 hover:text-white text-text-secondary">
            <FiTrash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default TransactionsPanel;