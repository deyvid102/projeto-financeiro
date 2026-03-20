import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Trash2, DollarSign, PiggyBank, TrendingUp, Calendar, History } from 'lucide-react';
import api from '../../../services/api';
import ModalInvestment from '../../modals/ModalInvestment';
import ModalConfirm from '../../modals/ModalConfirm';
import Pagination from '../../Pagination';
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
    onConfirm: () => {},
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

  return (
    <div className="w-full pb-10 space-y-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <h1 className="text-4xl font-black text-text-primary italic uppercase tracking-tighter text-left">
          Gestão de <span className="text-brand">Ativos</span>
        </h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-brand text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:shadow-2xl transition-all flex items-center gap-3 active:scale-95">
          <Plus size={18} strokeWidth={3} /> <span>Novo Ativo</span>
        </button>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bg-card border border-border-ui p-8 rounded-[2.5rem] shadow-sm transition-all duration-500 hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] text-text-secondary font-black uppercase tracking-[0.2em]">Total Investido</span>
            <div className="bg-blue-500/10 p-2 rounded-xl"><PiggyBank className="text-blue-500" size={18} /></div>
          </div>
          <h2 className="text-3xl font-black text-text-primary italic tracking-tighter">
            {totalInvestido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h2>
          <p className="text-[9px] font-black uppercase tracking-tighter mt-2 opacity-50 text-text-secondary">Em ativos correntes</p>
        </div>

        <div className="bg-bg-card border border-border-ui p-8 rounded-[2.5rem] shadow-sm transition-all duration-500 hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] text-text-secondary font-black uppercase tracking-[0.2em]">Total Sacado</span>
            <div className="bg-green-500/10 p-2 rounded-xl"><DollarSign className="text-green-500" size={18} /></div>
          </div>
          <h2 className="text-3xl font-black text-text-primary italic tracking-tighter">
            {totalSacado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h2>
          <p className="text-[9px] font-black uppercase tracking-tighter mt-2 opacity-50 text-text-secondary">Valores liquidados</p>
        </div>

        {/* CARD DE LUCRO AJUSTADO PARA VERDE */}
        <div className={`p-8 rounded-[2.5rem] text-white shadow-2xl transition-all duration-500 hover:scale-[1.02] ${
          lucroTotal < 0 
            ? 'bg-gradient-to-br from-red-600 to-rose-900 shadow-red-500/20' 
            : 'bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-500/20'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] opacity-80 font-black uppercase tracking-[0.2em]">Lucro Total</span>
            <div className="bg-white/20 p-2 rounded-xl"><TrendingUp size={18} /></div>
          </div>
          <h2 className="text-3xl font-black italic tracking-tighter">
            {lucroTotal >= 0 ? '+ ' : '- '}
            {Math.abs(lucroTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h2>
          <p className="text-[9px] font-black uppercase tracking-tighter mt-2 opacity-70">
            {lucroTotal < 0 ? 'Prejuízo acumulado' : 'Rendimento acumulado'}
          </p>
        </div>
      </div>

      {/* CARTEIRA ATIVA */}
      <section className="bg-bg-card border border-border-ui rounded-[3rem] p-8 shadow-sm">
        <div className="flex justify-between items-center mb-8 px-2">
          <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.2em] italic flex items-center gap-3">
            <TrendingUp size={16} className="text-brand" /> Ativos em Curso
          </h3>
          <span className="text-[10px] font-black text-brand bg-brand/10 px-3 py-1 rounded-lg border border-brand/20 uppercase">{ativos.length}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ativos.slice((currentPageAtivos - 1) * itemsPerPage, currentPageAtivos * itemsPerPage).map((inv) => (
            <InvestmentCard key={inv._id} inv={inv} valor={getValorAtual(inv)} progresso={getProgressTemporal(inv.startDate, inv.endDate)} openConfirm={openConfirm} />
          ))}
          {ativos.length === 0 && <EmptyState text="Nenhum ativo ativo encontrado" />}
        </div>
        <div className="mt-8 flex justify-center">
          <Pagination currentPage={currentPageAtivos} totalPages={Math.ceil(ativos.length / itemsPerPage)} onPageChange={setCurrentPageAtivos} />
        </div>
      </section>

      {/* HISTÓRICO */}
      <section className="bg-bg-card/40 border border-border-ui border-dashed rounded-[3rem] p-8">
        <div className="flex justify-between items-center mb-8 px-2">
          <h3 className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] italic flex items-center gap-3">
            <History size={16} /> Histórico de Saques
          </h3>
          <span className="text-[10px] font-black text-text-secondary bg-text-secondary/10 px-3 py-1 rounded-lg uppercase">{historico.length}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {historico.slice((currentPageHistory - 1) * itemsPerPage, currentPageHistory * itemsPerPage).map((inv) => (
            <InvestmentCard key={inv._id} inv={inv} valor={getValorAtual(inv)} progresso={100} openConfirm={openConfirm} isHistory />
          ))}
          {historico.length === 0 && <EmptyState text="O histórico está vazio" />}
        </div>
        <div className="mt-8 flex justify-center">
          <Pagination currentPage={currentPageHistory} totalPages={Math.ceil(historico.length / itemsPerPage)} onPageChange={setCurrentPageHistory} />
        </div>
      </section>

      <ModalInvestment isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={fetchInvestments} />
      <ModalConfirm {...confirmModal} onClose={() => setConfirmModal(p => ({ ...p, isOpen: false }))} />
    </div>
  );
};

const InvestmentCard = ({ inv, valor, progresso, openConfirm, isHistory }) => (
  <div className={`p-6 bg-bg-main border ${isHistory ? 'border-border-ui/30 opacity-60 grayscale-[0.3]' : 'border-border-ui/50 hover:border-brand'} rounded-[2.5rem] transition-all flex flex-col justify-between h-full shadow-sm`}>
    <div className="mb-4">
      <div className="flex justify-between items-start mb-3">
        <div className="text-left">
          <h4 className="font-black text-[12px] text-text-primary uppercase italic tracking-tighter">{inv.name}</h4>
          <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded bg-brand/10 text-brand mt-1 inline-block">{inv.type}</span>
        </div>
        <div className="flex gap-1.5">
          {!isHistory && (
            <button onClick={() => openConfirm('liquidate', inv)} className="p-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all cursor-pointer">
              <DollarSign size={12} strokeWidth={3}/>
            </button>
          )}
          <button onClick={() => openConfirm('delete', inv)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all cursor-pointer">
            <Trash2 size={12} strokeWidth={3}/>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-left">
        <div>
          <p className="text-[8px] font-black text-text-secondary uppercase opacity-50">Investido</p>
          <p className="text-[12px] font-bold text-text-primary">R$ {Number(inv.amountInvested).toLocaleString('pt-BR')}</p>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black text-text-secondary uppercase opacity-50">{isHistory ? 'Valor Final' : 'Valor Atual'}</p>
          <p className={`text-[12px] font-black italic ${isHistory ? 'text-text-primary' : 'text-brand'}`}>R$ {valor.toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>

    <div className="space-y-2 pt-3 border-t border-border-ui/20">
      <div className="h-1 w-full bg-bg-card rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-1000 ${isHistory ? 'bg-green-500 opacity-40' : 'bg-brand shadow-[0_0_8px_rgba(var(--brand-rgb),0.3)]'}`} style={{ width: `${progresso}%` }} />
      </div>
      <div className="flex justify-between items-center text-[8px] font-black uppercase italic opacity-60">
        <div className="flex flex-col items-start">
          <span className="text-[6px] opacity-50 not-italic">Início</span>
          <span>{new Date(inv.startDate).toLocaleDateString()}</span>
        </div>
        <span className={isHistory ? 'text-green-500 opacity-100' : 'text-brand opacity-100'}>{isHistory ? 'CONCLUÍDO' : `${progresso.toFixed(0)}%`}</span>
        <div className="flex flex-col items-end">
          <span className="text-[6px] opacity-50 not-italic">Término</span>
          <span>{new Date(inv.endDate).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  </div>
);

const EmptyState = ({ text }) => (
  <div className="col-span-full py-12 text-center border-2 border-dashed border-border-ui/10 rounded-[2.5rem]">
    <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest italic opacity-40">{text}</p>
  </div>
);

export default InvestmentPanel;