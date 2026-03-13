import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../../../services/api';
import ModalTransactions from '../../modals/ModalTransactions';
import ModalConfirm from '../../modals/ModalConfirm';
import { useAlert } from '../../../context/AlertContext';

const TransactionsPanel = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const { showAlert } = useAlert();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
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

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`transactions/${transactionToDelete}`);
      await fetchTransactions();
      showAlert("Transação removida com sucesso!", "success");
      setIsConfirmOpen(false);
    } catch (err) {
      console.error("Erro ao deletar:", err);
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

  const filteredTransactions = transactions.filter(t => {
    const matchesFilter = filter === 'all' ? true : t.type === filter;
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-brand font-sans">
        <Loader2 className="animate-spin mb-2" size={40} />
        <p className="text-sm font-medium text-text-secondary">Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Minhas Transações</h1>
          <p className="text-sm text-text-secondary font-medium">Gerencie seu fluxo de caixa em tempo real</p>
        </div>
        
        {/* BOTÃO NOVA TRANSAÇÃO MINIMALISTA */}
        <button 
          onClick={() => {
            setTransactionToEdit(null);
            setIsModalOpen(true);
          }}
          className="group relative flex items-center gap-3 bg-brand text-white px-6 py-3.5 rounded-full font-bold text-sm tracking-tight hover:shadow-2xl hover:shadow-brand/30 transition-all duration-300 active:scale-95 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
            <Plus size={18} className="text-white" />
          </div>
          <span className="relative">Nova Transação</span>
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="md:col-span-2 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 group-focus-within:text-brand transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-bg-card border border-border-ui rounded-full focus:outline-none focus:border-brand transition-all text-sm font-medium shadow-sm"
          />
        </div>
        
        <div className="flex bg-bg-card border border-border-ui rounded-full p-1.5 shadow-sm">
          <button onClick={() => setFilter('all')} className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-black rounded-full transition-all ${filter === 'all' ? 'bg-brand text-white shadow-md' : 'text-text-secondary hover:text-text-primary'}`}>Todas</button>
          <button onClick={() => setFilter('entrada')} className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-black rounded-full transition-all ${filter === 'entrada' ? 'bg-green-500 text-white shadow-md' : 'text-text-secondary hover:text-green-500'}`}>Entradas</button>
          <button onClick={() => setFilter('saida')} className={`flex-1 py-2 text-[10px] uppercase tracking-widest font-black rounded-full transition-all ${filter === 'saida' ? 'bg-red-500 text-white shadow-md' : 'text-text-secondary hover:text-red-500'}`}>Saídas</button>
        </div>

        <button className="flex items-center justify-center gap-2 px-4 py-4 bg-bg-card border border-border-ui rounded-full text-sm font-bold text-text-secondary hover:text-brand transition-all shadow-sm">
          <Filter size={18} />
          Filtrar
        </button>
      </div>

      {/* Tabela de Transações */}
      <div className="bg-bg-card border border-border-ui rounded-[2rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-bg-main/30 text-text-secondary text-[10px] uppercase tracking-[0.2em]">
                <th className="px-8 py-6 font-black">Status</th>
                <th className="px-4 py-6 font-black">Título</th>
                <th className="px-4 py-6 font-black text-center">Categoria</th>
                <th className="px-4 py-6 font-black text-center">Data</th>
                <th className="px-4 py-6 font-black text-right">Valor</th>
                <th className="px-8 py-6 font-black text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-ui/50">
              {filteredTransactions.map((t) => (
                <tr key={t._id} className="text-sm text-text-primary hover:bg-bg-main/20 transition-all group">
                  <td className="px-8 py-6">
                    <div className={`flex items-center gap-2 font-extrabold text-[11px] uppercase tracking-wider ${t.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                      {t.type === 'entrada' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                      {t.type === 'entrada' ? 'Entrada' : 'Saída'}
                    </div>
                  </td>
                  <td className="px-4 py-6 font-bold text-text-primary group-hover:text-brand transition-colors">{t.title}</td>
                  <td className="px-4 py-6 text-center">
                    <span className="px-4 py-1.5 bg-bg-main border border-border-ui/50 rounded-full text-[9px] font-black text-text-secondary uppercase tracking-widest">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-4 py-6 text-center text-text-secondary font-bold text-xs">
                    {new Date(t.date).toLocaleDateString('pt-br')}
                  </td>
                  <td className={`px-4 py-6 text-right font-black text-base ${t.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                    {t.type === 'entrada' ? '+ ' : '- '}
                    {t.amount.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={() => handleEditClick(t)}
                        className="p-3 bg-bg-main/80 hover:bg-brand hover:text-white rounded-2xl text-text-secondary transition-all cursor-pointer shadow-sm active:scale-90"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          setTransactionToDelete(t._id);
                          setIsConfirmOpen(true);
                        }}
                        className="p-3 bg-bg-main/80 hover:bg-red-500 hover:text-white rounded-2xl text-text-secondary transition-all cursor-pointer shadow-sm active:scale-90"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="py-24 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-bg-main rounded-full flex items-center justify-center mb-4 border border-border-ui">
               <Search size={32} className="text-text-secondary opacity-20" />
            </div>
            <p className="text-text-secondary font-bold text-lg">Nada por aqui...</p>
            <p className="text-text-secondary/60 text-sm">Não encontramos nenhuma transação.</p>
          </div>
        )}
      </div>

      <ModalTransactions 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTransactionToEdit(null);
        }}
        onTransactionAdded={fetchTransactions}
        transactionToEdit={transactionToEdit}
      />

      <ModalConfirm 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Excluir Transação"
        message="Deseja realmente apagar esta transação?"
      />
    </div>
  );
};

export default TransactionsPanel;