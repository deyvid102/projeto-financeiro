import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Trash2, DollarSign, PiggyBank, TrendingUp, Calendar, History, ArrowUpRight } from 'lucide-react';
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-brand p-6">
      <Loader2 className="animate-spin mb-4" size={48} />
      <p className="text-xs font-black uppercase tracking-[0.3em] italic text-text-secondary text-center">Carregando sua carteira...</p>
    </div>
  );

  return (
    <div className="w-full pb-10 space-y-8 md:space-y-12">
      
      {/* HEADER - Responsivo com alinhamento central no mobile */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
        <h1 className="text-3xl md:text-4xl font-black text-text-primary italic uppercase tracking-tighter text-left">
          Gestão de <span className="text-brand">Ativos</span>
        </h1>
        <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto bg-brand text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95">
          <Plus size={18} strokeWidth={3} /> <span>Novo Ativo</span>
        </button>
      </div>

      {/* CARDS DE RESUMO - 1 coluna mobile, 3 colunas desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-bg-card border border-border-ui p-6 md:p-8 rounded-[1.8rem] md:rounded-[2.5rem] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] text-text-secondary font-black uppercase tracking-[0.2em]">Total Investido</span>
            <div className="bg-blue-500/10 p-2 rounded-xl"><PiggyBank className="text-blue-500" size={18} /></div>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-text-primary italic tracking-tighter">
            {totalInvestido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h2>
          <p className="text-[9px] font-black uppercase tracking-tighter mt-2 opacity-50 text-text-secondary">Em ativos correntes</p>
        </div>

        <div className="bg-bg-card border border-border-ui p-6 md:p-8 rounded-[1.8rem] md:rounded-[2.5rem] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] text-text-secondary font-black uppercase tracking-[0.2em]">Total Sacado</span>
            <div className="bg-green-500/10 p-2 rounded-xl"><DollarSign className="text-green-500" size={18} /></div>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-text-primary italic tracking-tighter">
            {totalSacado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h2>
          <p className="text-[9px] font-black uppercase tracking-tighter mt-2 opacity-50 text-text-secondary">Valores liquidados</p>
        </div>

        <div className={`p-6 md:p-8 rounded-[1.8rem] md:rounded-[2.5rem] text-white shadow-2xl transition-all ${
          lucroTotal < 0 
            ? 'bg-gradient-to-br from-red-600 to-rose-900' 
            : 'bg-gradient-to-br from-emerald-500 to-teal-700'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] opacity-80 font-black uppercase tracking-[0.2em]">Lucro Total</span>
            <div className="bg-white/20 p-2 rounded-xl"><TrendingUp size={18} /></div>
          </div>
          <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter">
            {lucroTotal >= 0 ? '+ ' : '- '}
            {Math.abs(lucroTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </h2>
          <p className="text-[9px] font-black uppercase tracking-tighter mt-2 opacity-70">
            {lucroTotal < 0 ? 'Prejuízo acumulado' : 'Rendimento acumulado'}
          </p>
        </div>
      </div>

      {/* CARTEIRA ATIVA */}
      <section className="bg-bg-card border border-border-ui rounded-[2.2rem] md:rounded-[3rem] p-5 md:p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6 md:mb-8 px-2">
          <h3 className="text-[10px] md:text-xs font-black text-text-primary uppercase tracking-[0.2em] italic flex items-center gap-2">
            <TrendingUp size={16} className="text-brand" /> Ativos em Curso
          </h3>
          <span className="text-[9px] md:text-[10px] font-black text-brand bg-brand/10 px-2.5 py-1 rounded-lg border border-brand/20 uppercase">{ativos.length}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {ativos.slice((currentPageAtivos - 1) * itemsPerPage, currentPageAtivos * itemsPerPage).map((inv) => (
            <InvestmentCard key={inv._id} inv={inv} valor={getValorAtual(inv)} progresso={getProgressTemporal(inv.startDate, inv.endDate)} openConfirm={openConfirm} />
          ))}
          {ativos.length === 0 && <EmptyState text="Nenhum ativo ativo encontrado" />}
        </div>
        <div className="mt-8 flex justify-center">
          <Pagination currentPage={currentPageAtivos} totalPages={Math.ceil(ativos.length / itemsPerPage)} onPageChange={setCurrentPageAtivos} />
        </div>
      </section>

      {/* HISTÓRICO - Estilo pontilhado discreto */}
      <section className="bg-bg-card/40 border border-border-ui border-dashed rounded-[2.2rem] md:rounded-[3rem] p-5 md:p-8">
        <div className="flex justify-between items-center mb-6 md:mb-8 px-2">
          <h3 className="text-[10px] md:text-xs font-black text-text-secondary uppercase tracking-[0.2em] italic flex items-center gap-2">
            <History size={16} /> Histórico de Saques
          </h3>
          <span className="text-[9px] md:text-[10px] font-black text-text-secondary bg-text-secondary/10 px-2.5 py-1 rounded-lg uppercase">{historico.length}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
  <div className={`p-5 md:p-6 bg-bg-main border ${isHistory ? 'border-border-ui/30 opacity-70 grayscale-[0.4]' : 'border-border-ui/50 hover:border-brand shadow-sm'} rounded-[1.8rem] md:rounded-[2.5rem] transition-all flex flex-col justify-between h-full group`}>
    <div className="mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="text-left flex-1 min-w-0 pr-2">
          <h4 className="font-black text-xs md:text-sm text-text-primary uppercase italic tracking-tighter truncate group-hover:text-brand transition-colors">{inv.name}</h4>
          <span className="text-[7px] font-black uppercase px-2 py-0.5 rounded bg-bg-card border border-border-ui/30 text-text-secondary mt-1 inline-block">{inv.type}</span>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {!isHistory && (
            <button onClick={() => openConfirm('liquidate', inv)} className="p-2.5 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all active:scale-90">
              <DollarSign size={14} strokeWidth={3}/>
            </button>
          )}
          <button onClick={() => openConfirm('delete', inv)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90">
            <Trash2 size={14} strokeWidth={3}/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-left bg-bg-card/30 p-3 rounded-2xl border border-border-ui/10">
        <div>
          <p className="text-[7px] font-black text-text-secondary uppercase opacity-50 mb-0.5">Investido</p>
          <p className="text-[11px] font-bold text-text-primary leading-none truncate">R$ {Number(inv.amountInvested).toLocaleString('pt-BR')}</p>
        </div>
        <div className="text-right">
          <p className="text-[7px] font-black text-text-secondary uppercase opacity-50 mb-0.5">{isHistory ? 'Resgate' : 'Atual'}</p>
          <p className={`text-[11px] font-black italic leading-none truncate ${isHistory ? 'text-text-primary' : 'text-emerald-500'}`}>R$ {valor.toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>

    <div className="space-y-3 pt-3">
      <div className="h-1.5 w-full bg-bg-card rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-1000 ${isHistory ? 'bg-text-secondary/30' : 'bg-brand shadow-[0_0_8px_rgba(59,130,246,0.3)]'}`} style={{ width: `${progresso}%` }} />
      </div>
      <div className="flex justify-between items-center text-[8px] font-black uppercase italic tracking-tight text-text-secondary/70">
        <div className="flex flex-col items-start">
          <span className="text-[6px] opacity-50 not-italic mb-0.5 uppercase tracking-widest">Início</span>
          <span className="bg-bg-card px-1.5 py-0.5 rounded border border-border-ui/20">{new Date(inv.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit'})}</span>
        </div>
        <div className="flex flex-col items-center">
            <span className={`text-[9px] font-black ${isHistory ? 'text-text-secondary/50' : 'text-brand'}`}>{isHistory ? 'LIQUIDADO' : `${progresso.toFixed(0)}%`}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[6px] opacity-50 not-italic mb-0.5 uppercase tracking-widest">Fim</span>
          <span className="bg-bg-card px-1.5 py-0.5 rounded border border-border-ui/20">{new Date(inv.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit'})}</span>
        </div>
      </div>
    </div>
  </div>
);

const EmptyState = ({ text }) => (
  <div className="col-span-full py-16 text-center border-2 border-dashed border-border-ui/10 rounded-[2rem] flex flex-col items-center justify-center gap-3">
    <PiggyBank className="text-text-secondary opacity-20" size={32} />
    <p className="text-[9px] font-black text-text-secondary uppercase tracking-[0.3em] italic opacity-40">{text}</p>
  </div>
);

export default InvestmentPanel;