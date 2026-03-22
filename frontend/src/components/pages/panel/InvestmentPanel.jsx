import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, DollarSign, PiggyBank, TrendingUp, History } from 'lucide-react';
import api from '@/services/api';
import ModalInvestment from '../../modals/ModalInvestment';
import ModalConfirm from '../../modals/ModalConfirm';
import Pagination from '../../Pagination';
import LoadingState from '@/components/LoadingState';
import { useAlert } from '../../../context/AlertContext';

const InvestmentPanel = () => {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showAlert } = useAlert();

  const [currentPageAtivos, setCurrentPageAtivos] = useState(1);
  const [currentPageHistory, setCurrentPageHistory] = useState(1);
  const itemsPerPage = 3;

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    onConfirm: () => { },
  });

  const fetchInvestments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/investments');
      const data = Array.isArray(response.data) ? response.data : [];
      setInvestments(data);
    } catch (err) {
      console.error("❌ Erro ao buscar investimentos:", err);
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvestments(); }, [fetchInvestments]);

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
    const res = amountInvested * Math.pow(1 + monthlyRate, effectiveMonths);
    return Number(res.toFixed(2));
  }, []);

  const getProgressTemporal = (startDate, endDate) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return Math.min(Math.max(((now - start) / (end - start)) * 100, 0), 100);
  };

  const handleSacar = async (inv) => {
    try {
      const valorFinal = getValorAtual(inv);
      await api.put(`/investments/${inv._id}`, {
        status: 'sacado',
        finalValue: valorFinal,
        liquidatedAt: new Date()
      });
      showAlert('Investimento movido para o histórico!', 'success');
      fetchInvestments();
    } catch (err) {
      showAlert('Erro ao processar saque', 'error');
    } finally {
      setConfirmModal(p => ({ ...p, isOpen: false }));
    }
  };

  const handleDeletar = async (id) => {
    try {
      await api.delete(`/investments/${id}`);
      showAlert('Registro excluído permanentemente', 'success');
      fetchInvestments();
    } catch (err) {
      showAlert('Erro ao excluir', 'error');
    } finally {
      setConfirmModal(p => ({ ...p, isOpen: false }));
    }
  };

  const openConfirm = (type, inv) => {
    if (type === 'liquidate') {
      setConfirmModal({
        isOpen: true,
        title: 'Confirmar Saque',
        message: `Deseja mudar o status de "${inv.name}" para SACADO?`,
        variant: 'success',
        onConfirm: () => handleSacar(inv)
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: 'Excluir Permanente',
        message: `Deseja apagar este registro do banco de dados?`,
        variant: 'danger',
        onConfirm: () => handleDeletar(inv._id)
      });
    }
  };

  const ativos = investments.filter(inv => inv.status !== 'sacado');
  const historico = investments.filter(inv => inv.status === 'sacado');

  const totalInvestido = ativos.reduce((acc, inv) => acc + (Number(inv.amountInvested) || 0), 0);
  const totalSacado = historico.reduce((acc, inv) => acc + (Number(inv.finalValue) || Number(inv.amountInvested) || 0), 0);
  const lucroTotal = investments.reduce((acc, inv) => {
    const amount = Number(inv.amountInvested) || 0;
    const atual = getValorAtual(inv);
    return acc + (atual - amount);
  }, 0);

  if (loading && investments.length === 0) {
    return <LoadingState message="CARREGANDO SUA CARTEIRA..." />;
  }

  return (
    <div className="w-full pb-10 px-4 md:px-0">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 mt-4">
        <h1 className="text-2xl md:text-4xl font-black text-text-primary tracking-tighter italic uppercase">
          Gestão de <span className="text-brand">investimentos</span>
        </h1>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="w-full md:w-auto bg-brand text-white px-6 py-3.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          <Plus size={16} strokeWidth={3} /> Novo investimento
        </button>
      </div>

      {/* TOPBAR UNIFICADA (Compacta Mobile) */}
      <div className="bg-bg-card border border-border-ui rounded-3xl md:rounded-full p-1.5 mb-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border-ui/30">
          
          {/* Total Investido */}
          <div className="px-5 py-3 md:px-8 md:py-6 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center">
            <div className="flex items-center gap-2">
              <PiggyBank className="text-blue-500/60" size={12} />
              <span className="text-[8px] md:text-[9px] text-text-secondary font-black uppercase tracking-wider md:tracking-[0.2em]">Investido</span>
            </div>
            <h2 className="text-sm md:text-3xl font-black text-text-primary italic tracking-tighter">
              {totalInvestido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h2>
          </div>

          {/* Total Sacado */}
          <div className="px-5 py-3 md:px-8 md:py-6 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center">
            <div className="flex items-center gap-2">
              <DollarSign className="text-green-500/60" size={12} />
              <span className="text-[8px] md:text-[9px] text-text-secondary font-black uppercase tracking-wider md:tracking-[0.2em]">Sacado</span>
            </div>
            <h2 className="text-sm md:text-3xl font-black text-text-primary italic tracking-tighter">
              {totalSacado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h2>
          </div>

          {/* Lucro Total */}
          <div className="px-5 py-3 md:px-8 md:py-6 flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center">
            <div className="flex items-center gap-2">
              <TrendingUp className={lucroTotal >= 0 ? "text-brand" : "text-red-500"} size={12} />
              <span className="text-[8px] md:text-[9px] text-text-secondary font-black uppercase tracking-wider md:tracking-[0.2em]">Lucro</span>
            </div>
            <h2 className={`text-sm md:text-3xl font-black italic tracking-tighter ${lucroTotal >= 0 ? "text-brand" : "text-red-500"}`}>
              {lucroTotal >= 0 ? '+ ' : ''}
              {lucroTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h2>
          </div>

        </div>
      </div>

      {/* CARTEIRA ATIVA */}
      <section className="bg-bg-card border border-border-ui rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-10 shadow-sm mb-8">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h3 className="text-[9px] md:text-xs font-black text-text-primary uppercase tracking-[0.2em] italic flex items-center gap-2">
            <TrendingUp size={14} className="text-brand" /> investimentos em Curso
          </h3>
          <span className="text-[8px] md:text-[10px] font-black text-brand bg-brand/10 px-2.5 py-1 rounded-lg border border-brand/20 uppercase">{ativos.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {ativos.slice((currentPageAtivos - 1) * itemsPerPage, currentPageAtivos * itemsPerPage).map((inv) => (
            <InvestmentCard key={inv._id} inv={inv} valor={getValorAtual(inv)} progresso={getProgressTemporal(inv.startDate, inv.endDate)} openConfirm={openConfirm} />
          ))}
          {ativos.length === 0 && <EmptyState text="Nenhum ativo ativo encontrado" />}
        </div>
        <div className="mt-8 md:mt-10 flex justify-center">
          <Pagination currentPage={currentPageAtivos} totalPages={Math.ceil(ativos.length / itemsPerPage)} onPageChange={setCurrentPageAtivos} />
        </div>
      </section>

      {/* HISTÓRICO */}
      <section className="bg-bg-card/40 border border-border-ui border-dashed rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-10">
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h3 className="text-[9px] md:text-xs font-black text-text-secondary uppercase tracking-[0.2em] italic flex items-center gap-2">
            <History size={14} /> Histórico de Saques
          </h3>
          <span className="text-[8px] md:text-[10px] font-black text-text-secondary bg-text-secondary/10 px-2.5 py-1 rounded-lg uppercase">{historico.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {historico.slice((currentPageHistory - 1) * itemsPerPage, currentPageHistory * itemsPerPage).map((inv) => (
            <InvestmentCard key={inv._id} inv={inv} valor={getValorAtual(inv)} progresso={100} openConfirm={openConfirm} isHistory />
          ))}
          {historico.length === 0 && <EmptyState text="O histórico está vazio" />}
        </div>
        <div className="mt-8 md:mt-10 flex justify-center">
          <Pagination currentPage={currentPageHistory} totalPages={Math.ceil(historico.length / itemsPerPage)} onPageChange={setCurrentPageHistory} />
        </div>
      </section>

      <ModalInvestment isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={fetchInvestments} />
      <ModalConfirm {...confirmModal} onClose={() => setConfirmModal(p => ({ ...p, isOpen: false }))} />
    </div>
  );
};

const InvestmentCard = ({ inv, valor, progresso, openConfirm, isHistory }) => (
  <div className={`p-5 md:p-8 bg-bg-main border ${isHistory ? 'border-border-ui/30 opacity-70 grayscale-[0.4]' : 'border-border-ui/50 hover:border-brand shadow-sm'} rounded-[1.5rem] md:rounded-[2.5rem] transition-all flex flex-col justify-between h-full group`}>
    <div className="mb-5 md:mb-6">
      <div className="flex justify-between items-start mb-4">
        <div className="text-left flex-1 min-w-0 pr-2">
          <h4 className="font-black text-[11px] md:text-sm text-text-primary uppercase italic tracking-tighter truncate group-hover:text-brand transition-colors">{inv.name}</h4>
          <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded bg-bg-card border border-border-ui/30 text-text-secondary mt-1 inline-block">{inv.type}</span>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {!isHistory && (
            <button onClick={() => openConfirm('liquidate', inv)} className="p-2.5 md:p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all active:scale-90">
              <DollarSign size={12} md:size={14} strokeWidth={3} />
            </button>
          )}
          <button onClick={() => openConfirm('delete', inv)} className="p-2.5 md:p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90">
            <Trash2 size={12} md:size={14} strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 text-left bg-bg-card/30 p-3 md:p-4 rounded-2xl border border-border-ui/10">
        <div>
          <p className="text-[6px] md:text-[7px] font-black text-text-secondary uppercase opacity-50 mb-0.5">Investido</p>
          <p className="text-[10px] md:text-[11px] font-bold text-text-primary leading-none truncate">R$ {Number(inv.amountInvested).toLocaleString('pt-BR')}</p>
        </div>
        <div className="text-right">
          <p className="text-[6px] md:text-[7px] font-black text-text-secondary uppercase opacity-50 mb-0.5">{isHistory ? 'Resgate' : 'Atual'}</p>
          <p className={`text-[10px] md:text-[11px] font-black italic leading-none truncate ${isHistory ? 'text-text-primary' : 'text-emerald-500'}`}>R$ {valor.toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>

    <div className="space-y-3 md:space-y-4 pt-2">
      <div className="h-1.5 md:h-2 w-full bg-bg-card rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-1000 ${isHistory ? 'bg-text-secondary/30' : 'bg-brand shadow-[0_0_8px_rgba(59,130,246,0.3)]'}`} style={{ width: `${progresso}%` }} />
      </div>
      <div className="flex justify-between items-center text-[7px] md:text-[8px] font-black uppercase italic tracking-tight text-text-secondary/70">
        <div className="flex flex-col items-start">
          <span className="text-[5px] md:text-[6px] opacity-50 not-italic mb-0.5 md:mb-1 uppercase tracking-widest">Início</span>
          <span className="bg-bg-card px-1.5 py-0.5 md:px-2 md:py-1 rounded border border-border-ui/20">{new Date(inv.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className={`text-[9px] md:text-[10px] font-black ${isHistory ? 'text-text-secondary/50' : 'text-brand'}`}>{isHistory ? 'LIQUIDADO' : `${progresso.toFixed(0)}%`}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[5px] md:text-[6px] opacity-50 not-italic mb-0.5 md:mb-1 uppercase tracking-widest">Fim</span>
          <span className="bg-bg-card px-1.5 py-0.5 md:px-2 md:py-1 rounded border border-border-ui/20">{new Date(inv.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
        </div>
      </div>
    </div>
  </div>
);

const EmptyState = ({ text }) => (
  <div className="col-span-full py-12 md:py-16 text-center border-2 border-dashed border-border-ui/10 rounded-[2rem] flex flex-col items-center justify-center gap-3">
    <PiggyBank className="text-text-secondary opacity-20" size={28} />
    <p className="text-[8px] md:text-[9px] font-black text-text-secondary uppercase tracking-[0.3em] italic opacity-40">{text}</p>
  </div>
);

export default InvestmentPanel;