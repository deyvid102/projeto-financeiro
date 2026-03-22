import React, { useState, useEffect, useCallback } from 'react';
import { Plus, PiggyBank, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import api from '@/services/api';
import { useAlert } from '../../../context/AlertContext';
import ModalConfirm from '../../modals/ModalConfirm';
import ModalGoal from '../../modals/ModalGoal';
import ModalTransactions from '../../modals/ModalTransactions';
import LoadingState from '@/components/LoadingState'; // Importando o novo componente

const DashGoal = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalGoalOpen, setIsModalGoalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionPreset, setTransactionPreset] = useState(null);
  const { showAlert } = useAlert();
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/goals');
      setGoals(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Erro ao buscar caixinhas:", err);
      showAlert('Erro ao carregar metas', 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const handleCloseTransactionModal = useCallback(() => {
    setIsTransactionModalOpen(false);
    setTransactionPreset(null);
  }, []);

  const handleDepositClick = (goal) => {
    setTransactionPreset({
      ...goal,
      title: `Depósito: ${goal.name}`,
      category: 'caixinha',
      type: 'saida',
      amount: '',
    });
    setIsTransactionModalOpen(true);
  };

  const handleWithdrawClick = (goal) => {
    setTransactionPreset({
      ...goal,
      title: `Resgate: ${goal.name}`,
      category: 'caixinha',
      type: 'entrada',
      amount: '',
    });
    setIsTransactionModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/goals/${id}`);
      showAlert('Caixinha removida!', 'success');
      fetchGoals();
    } catch (err) {
      showAlert('Erro ao remover caixinha', 'error');
    } finally {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Cálculo do Total Investido nas Caixinhas
  const totalCaixinhas = goals.reduce((acc, goal) => acc + (Number(goal.currentAmount) || 0), 0);

  // Utilizando o componente padrão com mensagem customizada
  if (loading) return <LoadingState message="ACESSANDO COFRES MAX..." />;

  return (
    <div className="w-full pb-10 px-1 overflow-hidden space-y-6 md:space-y-10">
      
      {/* HEADER & TOPBAR */}
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-6 duration-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-black text-text-primary italic uppercase tracking-tighter">
              suas <span className="text-brand">caixinhas</span>
            </h1>
          </div>
          <button 
            onClick={() => setIsModalGoalOpen(true)}
            className="bg-brand text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 w-full md:w-auto"
          >
            <Plus size={18} strokeWidth={3} /> 
            <span>Criar Caixinha</span>
          </button>
        </div>

        {/* RESUMO TOTAL - Estilo Topbar Compacta */}
        <div className="bg-bg-card border border-border-ui p-4 md:p-8 rounded-2xl md:rounded-[3rem] shadow-sm flex items-center justify-between">
           <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 md:p-4 bg-brand/10 rounded-xl text-brand">
                <PiggyBank size={20} md:size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[8px] md:text-[10px] text-text-secondary font-black uppercase tracking-widest opacity-60">Total Acumulado</p>
                <h2 className="text-xl md:text-3xl font-black text-text-primary italic tracking-tighter">
                  {totalCaixinhas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h2>
              </div>
           </div>
           <div className="hidden md:block text-right">
              <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest opacity-40">Objetivos Ativos</p>
              <p className="text-2xl font-black text-brand italic">{goals.length}</p>
           </div>
        </div>
      </div>

      {/* GRID DE CAIXINHAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8">
        {goals.map((goal, index) => (
          <div 
            key={goal._id} 
            className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
            style={{ animationDelay: `${(index + 1) * 100}ms` }}
          >
            <div className="bg-bg-card border border-border-ui rounded-[1.8rem] md:rounded-[3rem] p-5 md:p-8 shadow-sm hover:border-brand transition-all group flex flex-col justify-between h-full">
              
              <div className="flex justify-between items-center mb-5 md:mb-8">
                <div 
                  className="p-2.5 md:p-4 rounded-xl md:rounded-[1.5rem] text-white shadow-lg" 
                  style={{ backgroundColor: goal.color || '#3b82f6' }}
                >
                  <PiggyBank size={18} md:size={24} strokeWidth={2.5} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] md:text-[9px] font-black text-text-secondary uppercase tracking-widest bg-bg-main px-2 py-1 rounded border border-border-ui">{goal.categoryGoal}</span>
                  <button 
                    onClick={() => setConfirmModal({
                      isOpen: true,
                      title: 'Encerrar Caixinha',
                      message: `Deseja remover "${goal.name}"?`,
                      onConfirm: () => handleDelete(goal._id)
                    })}
                    className="p-2 text-text-secondary hover:text-red-500 rounded-lg transition-all"
                  >
                    <Trash2 size={16} md:size={20} />
                  </button>
                </div>
              </div>

              <div className="text-left mb-4 md:mb-8">
                <h3 className="text-lg md:text-2xl font-black text-text-primary italic uppercase tracking-tighter group-hover:text-brand transition-colors truncate">
                  {goal.name}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 md:gap-4 mb-5 md:mb-8">
                <div className="text-left">
                  <p className="text-[7px] md:text-[9px] font-black text-text-secondary uppercase tracking-widest mb-0.5 opacity-50">Acumulado</p>
                  <p className="text-sm md:text-xl font-black text-brand italic tracking-tight truncate">R$ {goal.currentAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                  <p className="text-[7px] md:text-[9px] font-black text-text-secondary uppercase tracking-widest mb-0.5 opacity-50">Meta</p>
                  <p className="text-sm md:text-xl font-black text-text-primary italic tracking-tight opacity-40 truncate">R$ {goal.targetAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="space-y-2 md:space-y-3 mb-6 md:mb-10">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[7px] md:text-[10px] font-black text-text-secondary uppercase tracking-widest">Progresso</span>
                  <span className="text-[9px] md:text-[11px] font-black text-brand italic bg-brand/10 px-1.5 py-0.5 rounded-md">{goal.progress}%</span>
                </div>
                <div className="h-2 md:h-4 w-full bg-bg-main rounded-full overflow-hidden border border-border-ui/50 p-0.5 md:p-1 shadow-inner">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${Math.min(goal.progress, 100)}%`,
                      backgroundColor: goal.color || '#3b82f6',
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <button 
                  onClick={() => handleDepositClick(goal)}
                  className="flex items-center justify-center gap-2 py-3 md:py-4 bg-bg-main border border-border-ui rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase hover:bg-green-500 hover:text-white transition-all active:scale-95"
                >
                  <ArrowUpRight size={14} md:size={16} strokeWidth={3} /> Guardar
                </button>
                <button 
                  onClick={() => handleWithdrawClick(goal)}
                  className="flex items-center justify-center gap-2 py-3 md:py-4 bg-bg-main border border-border-ui rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all active:scale-95"
                >
                  <ArrowDownLeft size={14} md:size={16} strokeWidth={3} /> Resgatar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ModalGoal isOpen={isModalGoalOpen} onClose={() => setIsModalGoalOpen(false)} onRefresh={fetchGoals} />
      <ModalTransactions 
        isOpen={isTransactionModalOpen}
        onClose={handleCloseTransactionModal} 
        onTransactionAdded={fetchGoals}
        presetData={transactionPreset}
      />
      <ModalConfirm 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant="danger"
      />
    </div>
  );
};

export default DashGoal;