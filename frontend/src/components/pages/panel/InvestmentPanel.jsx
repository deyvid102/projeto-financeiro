import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Trash2, DollarSign, PiggyBank, TrendingUp } from 'lucide-react';
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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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
      console.error("❌ Erro Backend:", err);
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvestments(); }, [fetchInvestments]);

  // Resetar página ao mudar a lista (opcional mas recomendado)
  useEffect(() => {
    setCurrentPage(1);
  }, [investments.length]);

  const getValorAtual = (inv) => {
    const amountInvested = Number(inv.amountInvested) || 0;
    const isCrypto = inv.type === 'criptomoedas' || inv.type === 'Cripto';
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
  };

  const totals = investments.reduce((acc, inv) => {
    acc.invested += Number(inv.amountInvested) || 0;
    acc.current += getValorAtual(inv);
    return acc;
  }, { invested: 0, current: 0 });

  const totalLucro = Number((totals.current - totals.invested).toFixed(2));
  const lucroPercentTotal = totals.invested > 0 ? (totalLucro / totals.invested) * 100 : 0;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInvestments = investments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(investments.length / itemsPerPage);

  const handleAction = async (endpoint, method, body, id) => {
    try {
      if (method === 'delete') await api.delete(`/investments/${id}`);
      else await api.put(`/investments/${id}${endpoint}`, body);
      showAlert('Operação realizada com sucesso!', 'success');
      fetchInvestments();
    } catch (err) { showAlert('Erro ao processar operação', 'error'); }
    finally { setConfirmModal(p => ({ ...p, isOpen: false })); }
  };

  const openConfirm = (type, inv) => {
    const valor = getValorAtual(inv);
    if (type === 'liquidate') {
      setConfirmModal({
        isOpen: true,
        title: 'Confirmar Resgate MAX',
        message: `Deseja resgatar o montante de R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}?`,
        variant: 'success',
        onConfirm: () => handleAction('/liquidate', 'put', { addAsIncome: true }, inv._id)
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: 'Remover Ativo',
        message: `Deseja excluir permanentemente "${inv.name}" da sua carteira?`,
        variant: 'danger',
        onConfirm: () => handleAction('', 'delete', {}, inv._id)
      });
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 text-brand">
      <Loader2 className="animate-spin mb-4" size={40} strokeWidth={3} />
      <p className="font-black uppercase tracking-[0.3em] text-[10px]">Analizando Carteira MAX...</p>
    </div>
  );

  return (
    <div className="w-full pb-10">
      
      {/* HEADER ESTILO MAX */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 px-1 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="text-left">
          <h1 className="text-4xl font-black text-text-primary italic uppercase tracking-tighter">
            seus <span className="text-brand">Investimentos</span>
          </h1>
          <p className="text-[11px] text-text-secondary font-black uppercase tracking-[0.2em] mt-2 opacity-60">
            Inteligência e Gestão de Ativos
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-brand text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:shadow-2xl hover:shadow-brand/30 transition-all flex items-center justify-center gap-3 cursor-pointer group active:scale-95"
        >
          <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> 
          <span>Novo Ativo</span>
        </button>
      </div>

      {/* CARDS DE RESUMO COM CASCATA (DELAY 100ms, 200ms, 300ms) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '100ms' }}>
          <div className="bg-bg-card border border-border-ui p-7 rounded-[2.5rem] flex justify-between items-center shadow-sm group hover:border-blue-500/30 transition-all">
            <div className="text-left">
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1 opacity-60">Total Aplicado</p>
              <h2 className="text-2xl font-black text-text-primary italic tracking-tight">R$ {totals.invested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
            </div>
            <div className="p-4 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform"><DollarSign size={24} strokeWidth={2.5} /></div>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '200ms' }}>
          <div className="bg-bg-card border border-border-ui p-7 rounded-[2.5rem] flex justify-between items-center shadow-sm group hover:border-cyan-500/30 transition-all">
            <div className="text-left">
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1 opacity-60">Patrimônio Líquido</p>
              <h2 className="text-2xl font-black text-text-primary italic tracking-tight">R$ {totals.current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
            </div>
            <div className="p-4 bg-cyan-500 text-white rounded-2xl shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform"><PiggyBank size={24} strokeWidth={2.5} /></div>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '300ms' }}>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-7 rounded-[2.5rem] shadow-xl shadow-green-500/20 flex justify-between items-center text-white group hover:scale-[1.02] transition-all">
            <div className="text-left">
              <p className="text-[10px] font-black opacity-80 uppercase tracking-widest mb-1">Performance Total</p>
              <h2 className="text-2xl font-black italic tracking-tight">R$ {totalLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
              <div className="inline-flex items-center bg-white/20 px-2 py-0.5 rounded-lg mt-2">
                 <p className="text-[10px] font-black uppercase tracking-tighter">↑ {lucroPercentTotal.toFixed(2)}% de Retorno</p>
              </div>
            </div>
            <div className="p-4 bg-white/20 text-white rounded-2xl backdrop-blur-md"><TrendingUp size={24} strokeWidth={3} /></div>
          </div>
        </div>
      </div>

      {/* GRID DE ATIVOS */}
      <div className="bg-bg-card border border-border-ui rounded-[3rem] p-10 shadow-sm min-h-[550px] flex flex-col animate-in fade-in zoom-in-95 duration-1000">
        <div className="flex justify-between items-center mb-10 pb-6 border-b border-border-ui/40">
          <h3 className="text-xs font-black text-text-primary uppercase tracking-[0.2em] italic">Composição da Carteira</h3>
          <span className="text-[10px] font-black text-brand bg-brand/10 px-4 py-1.5 rounded-xl border border-brand/20 uppercase tracking-widest">
            {investments.length} Ativos Ativos
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 flex-1">
          {currentInvestments.map((inv, index) => {
            const valorAtual = getValorAtual(inv);
            const valorInvestido = Number(inv.amountInvested);
            const lucroPercent = valorInvestido > 0 ? ((valorAtual - valorInvestido) / valorInvestido) * 100 : 0;
            const isPositive = lucroPercent >= 0;
            
            return (
              <div 
                key={inv._id} 
                className="animate-in fade-in slide-in-from-right-8 duration-700 fill-mode-both"
                style={{ animationDelay: `${(index + 4) * 100}ms` }} // Começa após os cards de cima (+400ms)
              >
                <div className="p-7 bg-bg-main border border-border-ui/50 rounded-[2.5rem] hover:border-brand transition-all group relative overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-brand/5 h-full">
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="text-left">
                        <h4 className="font-black text-sm text-text-primary uppercase italic tracking-tighter group-hover:text-brand transition-colors">{inv.name}</h4>
                        <p className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-60 mt-1">{inv.type}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openConfirm('liquidate', inv)} className="p-2.5 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all cursor-pointer">
                          <DollarSign size={16} strokeWidth={3}/>
                        </button>
                        <button onClick={() => openConfirm('delete', inv)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all cursor-pointer">
                          <Trash2 size={16} strokeWidth={3}/>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="text-left">
                        <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-1 opacity-50">Custo Base</p>
                        <p className="text-sm font-bold text-text-primary italic">R$ {valorInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-1 opacity-50">Market Value</p>
                        <p className="text-sm font-black text-brand italic">R$ {valorAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest p-1 px-2 rounded-lg ${isPositive ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                        {isPositive ? 'PROFIT' : 'LOSS'} {isPositive ? '↑' : '↓'} {Math.abs(lucroPercent).toFixed(2)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-bg-card rounded-full overflow-hidden border border-border-ui/50 p-0.5 shadow-inner">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${isPositive ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(Math.max(Math.abs(lucroPercent), 5), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {investments.length === 0 && (
            <div className="col-span-full py-24 text-center border-4 border-dashed border-border-ui/30 rounded-[3rem] bg-bg-main/20">
              <div className="bg-bg-card w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-border-ui">
                 <TrendingUp size={24} className="text-text-secondary opacity-20" />
              </div>
              <p className="text-[11px] font-black text-text-secondary uppercase tracking-[0.3em] italic">Nenhum ativo detectado na rede</p>
            </div>
          )}
        </div>

        <div className="mt-12 flex justify-center">
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={(page) => setCurrentPage(page)} 
          />
        </div>
      </div>

      <ModalInvestment isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={fetchInvestments} />
      <ModalConfirm {...confirmModal} onClose={() => setConfirmModal(p => ({ ...p, isOpen: false }))} />
    </div>
  );
};

export default InvestmentPanel;