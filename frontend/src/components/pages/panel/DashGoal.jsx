import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Target, PiggyBank, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import api from '../../../services/api';
import { useAlert } from '../../../context/AlertContext';
import ModalConfirm from '../../modals/ModalConfirm';
import ModalGoal from '../../modals/ModalGoal';
import ModalTransactions from '../../modals/ModalTransactions';

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
      ...goal, // Passa o objeto completo (inclui currentAmount e _id)
      title: `Depósito: ${goal.name}`,
      category: 'caixinha',
      type: 'saida', // Sai do saldo principal -> vai pro cofre
      amount: '',
    });
    setIsTransactionModalOpen(true);
  };

  const handleWithdrawClick = (goal) => {
    setTransactionPreset({
      ...goal, // Passa o objeto completo para validação de saldo
      title: `Resgate: ${goal.name}`,
      category: 'caixinha',
      type: 'entrada', // Sai do cofre -> volta pro saldo principal
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 text-brand">
      <Loader2 className="animate-spin mb-4" size={40} strokeWidth={3} />
      <p className="font-black uppercase tracking-[0.3em] text-[10px]">Acessando Cofres MAX...</p>
    </div>
  );

  return (
    <div className="w-full pb-10 px-1 overflow-hidden">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-6 duration-700">
        <div className="text-left">
          <h1 className="text-4xl font-black text-text-primary italic uppercase tracking-tighter">
            suas <span className="text-brand">caixinhas</span>
          </h1>
          <p className="text-[11px] text-text-secondary font-black uppercase tracking-[0.2em] mt-2 opacity-60">
            Gestão de Objetivos e Reservas
          </p>
        </div>
        <button 
          onClick={() => setIsModalGoalOpen(true)}
          className="bg-brand text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> 
          <span>Criar Caixinha</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {goals.map((goal, index) => (
          <div 
            key={goal._id} 
            className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
            style={{ animationDelay: `${(index + 1) * 100}ms` }}
          >
            <div className="bg-bg-card border border-border-ui rounded-[3rem] p-8 shadow-sm hover:border-brand transition-all group flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-8">
                <div 
                  className="p-4 rounded-[1.5rem] text-white shadow-2xl" 
                  style={{ backgroundColor: goal.color || '#3b82f6' }}
                >
                  <PiggyBank size={24} strokeWidth={2.5} />
                </div>
                <button 
                  onClick={() => setConfirmModal({
                    isOpen: true,
                    title: 'Encerrar Caixinha',
                    message: `Deseja remover "${goal.name}"?`,
                    onConfirm: () => handleDelete(goal._id)
                  })}
                  className="p-2.5 text-text-secondary hover:text-red-500 rounded-xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="text-left mb-8">
                <h3 className="text-2xl font-black text-text-primary italic uppercase tracking-tighter group-hover:text-brand transition-colors">
                  {goal.name}
                </h3>
                <div className="inline-block bg-bg-main px-3 py-1 rounded-lg border border-border-ui mt-2">
                  <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-80">{goal.categoryGoal}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="text-left">
                  <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-1 opacity-50">Acumulado</p>
                  <p className="text-xl font-black text-brand italic tracking-tight">R$ {goal.currentAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-1 opacity-50">Meta Final</p>
                  <p className="text-xl font-black text-text-primary italic tracking-tight opacity-40">R$ {goal.targetAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="space-y-3 mb-10">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Progresso</span>
                  <span className="text-[11px] font-black text-brand italic bg-brand/10 px-2 py-0.5 rounded-md">{goal.progress}%</span>
                </div>
                <div className="h-4 w-full bg-bg-main rounded-full overflow-hidden border border-border-ui/50 p-1 shadow-inner">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${Math.min(goal.progress, 100)}%`,
                      backgroundColor: goal.color || '#3b82f6',
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleDepositClick(goal)}
                  className="flex items-center justify-center gap-2 py-4 bg-bg-main border border-border-ui rounded-2xl text-[10px] font-black uppercase hover:bg-green-500 hover:text-white transition-all active:scale-95"
                >
                  <ArrowUpRight size={16} strokeWidth={3} /> Guardar
                </button>
                <button 
                  onClick={() => handleWithdrawClick(goal)}
                  className="flex items-center justify-center gap-2 py-4 bg-bg-main border border-border-ui rounded-2xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all active:scale-95"
                >
                  <ArrowDownLeft size={16} strokeWidth={3} /> Resgatar
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