import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Trash2, DollarSign, TrendingUp, History, ArrowUpRight, 
  ArrowDownRight, Activity, List, Wallet, 
  ArrowDownCircle, CheckCircle2, Calendar, Calculator
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import api from '@/services/api';
import ModalInvestment from '../../modals/ModalInvestment';
import ModalConfirm from '../../modals/ModalConfirm';
import ModalMarketChart from '../../modals/ModalMarketChart';
import ModalInvestmentDetail from '../../modals/ModalInvestmentDetail';
import Pagination from '../../Pagination';
import LoadingState from '@/components/LoadingState';
import { useAlert } from '../../../context/AlertContext';

const InvestmentPanel = () => {
  const [investments, setInvestments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('30D');
  const { showAlert } = useAlert();

  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [selectedInv, setSelectedInv] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, title: '', message: '', variant: 'danger', onConfirm: () => { },
  });

  // Estados de Paginação
  const [currentPageAtivos, setCurrentPageAtivos] = useState(1);
  const [currentPageHistorico, setCurrentPageHistorico] = useState(1);
  const itemsPerPage = 4;
  const itemsPerPageHistorico = 8; // Histórico costuma ocupar menos espaço, então 8 é um bom número

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [invRes, transRes] = await Promise.all([
        api.get('/investments'),
        api.get('/transactions')
      ]);
      
      setInvestments(Array.isArray(invRes.data) ? invRes.data : []);
      setTransactions(Array.isArray(transRes.data) ? transRes.data : []);
    } catch (err) {
      showAlert('Erro ao carregar dados do patrimônio', 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSacar = async (inv) => {
    try {
      await api.put(`/investments/${inv._id}/liquidate`, { 
        addAsIncome: true, 
        sellPrice: inv.currentTotalValue
      });
      showAlert(`${inv.ticker || inv.name} liquidado com sucesso!`, 'success');
      fetchData();
    } catch (err) { 
      showAlert('Erro ao processar saque.', 'error'); 
    } finally { 
      setConfirmModal(p => ({ ...p, isOpen: false })); 
    }
  };

  const handleDeletar = async (id) => {
    try {
      await api.delete(`/investments/${id}`);
      showAlert('Investimento removido!', 'success');
      fetchData();
    } catch (err) { showAlert('Erro ao excluir registro.', 'error'); }
    finally { setConfirmModal(p => ({ ...p, isOpen: false })); }
  };

  const openConfirm = (type, inv) => {
    if (type === 'liquidate') {
      setConfirmModal({ 
        isOpen: true, 
        title: 'Confirmar Saque', 
        message: `Deseja realizar o resgate de ${inv.ticker || inv.name} por R$ ${Number(inv.currentTotalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}?`, 
        variant: 'success', 
        onConfirm: () => handleSacar(inv) 
      });
    } else {
      setConfirmModal({ 
        isOpen: true, 
        title: 'Excluir Registro', 
        message: 'Esta ação não pode ser desfeita.', 
        variant: 'danger', 
        onConfirm: () => handleDeletar(inv._id) 
      });
    }
  };

  const ativos = useMemo(() => 
    investments.filter(inv => inv.status === 'em andamento'), 
  [investments]);

  const historicoComValores = useMemo(() => {
    const finalizados = investments.filter(inv => inv.status === 'sacado' || inv.status === 'finalizado');
    
    return finalizados.map(inv => {
      const dataSaque = new Date(inv.updatedAt).getTime();
      const transacaoResgate = transactions.find(t => {
        const dataTransacao = new Date(t.date || t.createdAt).getTime();
        const diffSegundos = Math.abs(dataSaque - dataTransacao) / 1000;
        const matchTitulo = t.title.toLowerCase().includes(inv.name.toLowerCase()) || 
                           (inv.ticker && t.title.toLowerCase().includes(inv.ticker.toLowerCase()));
        return t.type === 'entrada' && matchTitulo && diffSegundos < 10;
      });

      const valorSacado = transacaoResgate ? transacaoResgate.amount : (inv.lastPrice || inv.amountInvested);
      const investido = inv.amountInvested;
      const lucro = valorSacado - investido;

      return {
        ...inv,
        valorSacado,
        lucro,
        lucroPercent: investido > 0 ? (lucro / investido) * 100 : 0
      };
    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [investments, transactions]);
  
  // Lógica de Paginação Aplicada
  const paginatedAtivos = useMemo(() => {
    const start = (currentPageAtivos - 1) * itemsPerPage;
    return ativos.slice(start, start + itemsPerPage);
  }, [ativos, currentPageAtivos]);

  const paginatedHistorico = useMemo(() => {
    const start = (currentPageHistorico - 1) * itemsPerPageHistorico;
    return historicoComValores.slice(start, start + itemsPerPageHistorico);
  }, [historicoComValores, currentPageHistorico]);

  const totalInvestido = useMemo(() => ativos.reduce((acc, inv) => acc + (Number(inv.amountInvested) || 0), 0), [ativos]);
  const totalAtual = useMemo(() => ativos.reduce((acc, inv) => acc + (Number(inv.currentTotalValue) || 0), 0), [ativos]);
  const rendimentoTotal = totalAtual - totalInvestido;
  const valorSacadoTotal = useMemo(() => historicoComValores.reduce((acc, inv) => acc + inv.valorSacado, 0), [historicoComValores]);

  const multiSeriesData = useMemo(() => {
    const labels = [{ id: 'start', name: 'Valor inicial' }, { id: 'current', name: 'Atual' }];
    return labels.map((label) => {
      const dataPoint = { name: label.name };
      ativos.forEach(inv => {
        const key = inv.ticker || inv.name;
        dataPoint[key] = label.id === 'start' ? Number(inv.amountInvested || 0) : Number(inv.currentTotalValue || 0);
      });
      return dataPoint;
    });
  }, [ativos]);

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444'];

  if (loading && investments.length === 0) return <LoadingState message="SINCRONIZANDO DADOS..." />;

  return (
    <div className="w-full min-h-screen pb-10 px-4 md:px-0 flex flex-col text-left">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 mb-6 mt-4">
        <h1 className="text-xl md:text-3xl font-black text-text-primary tracking-tighter italic uppercase">
          Gestão de <span className="text-brand">Patrimônio</span>
        </h1>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => setIsMarketOpen(true)} className="flex-1 md:flex-none border border-border-ui bg-bg-card text-text-primary px-4 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
            <List size={16} className="text-brand" /> Ranking
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none bg-brand text-white px-6 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
            <Plus size={16} strokeWidth={3} /> Aporte
          </button>
        </div>
      </div>

      <div className="w-full mb-8">
        <div className="hidden md:flex bg-bg-card border border-border-ui rounded-full p-1.5 items-center shadow-sm">
          <StatCapsule label="Total Investido" value={totalInvestido} icon={<Wallet size={12} className="text-blue-500" />} colorClass="text-text-primary" />
          <div className="w-[1px] h-8 bg-border-ui/50 mx-2" />
          <StatCapsule label="Total Sacado" value={valorSacadoTotal} icon={<ArrowDownCircle size={12} className="text-brand" />} colorClass="text-brand" />
          <div className="w-[1px] h-8 bg-border-ui/50 mx-2" />
          <StatCapsule label="Lucro em Carteira" value={rendimentoTotal} icon={<TrendingUp size={12} />} colorClass={rendimentoTotal >= 0 ? 'text-brand' : 'text-red-500'} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-stretch mb-10">
        <div className="w-full lg:w-[50%]">
          <div className="bg-bg-card border border-border-ui rounded-[2rem] p-5 md:p-6 shadow-sm flex flex-col h-[400px] relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div>
                   <h3 className="text-[9px] font-black text-text-primary uppercase tracking-[0.2em] italic mb-1">Patrimônio Atualizado</h3>
                   <p className="text-xl md:text-2xl font-black text-text-primary tracking-tighter italic">R$ {totalAtual.toLocaleString('pt-BR')}</p>
                </div>
                <div className="flex bg-bg-main border border-border-ui p-1 rounded-xl">
                  <button onClick={() => setTimeFilter('30D')} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${timeFilter === '30D' ? 'bg-brand text-white shadow-lg' : 'text-text-secondary opacity-50'}`}>30D</button>
                  <button onClick={() => setTimeFilter('12M')} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${timeFilter === '12M' ? 'bg-brand text-white shadow-lg' : 'text-text-secondary opacity-50'}`}>12M</button>
                </div>
              </div>
              
              <div className="flex-1 w-full" style={{ minHeight: '250px', marginLeft: '-10px' }}>
                {ativos.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={multiSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'currentColor', fontSize: 8, fontWeight: 900, opacity: 0.5}} />
                      <YAxis hide domain={['auto', 'auto']} />
                      <RechartsTooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-ui)', borderRadius: '16px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
                      {ativos.map((inv, index) => (
                        <Area key={inv._id} type="monotone" dataKey={inv.ticker || inv.name} stroke={COLORS[index % COLORS.length]} fill={COLORS[index % COLORS.length]} fillOpacity={0.05} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-card)' }} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center opacity-20 uppercase font-black text-[10px] tracking-widest text-center">Aguardando dados...</div>
                )}
              </div>
          </div>
        </div>

        <div className="w-full lg:w-[50%]">
          <section className="bg-bg-card border border-border-ui rounded-[2rem] p-5 md:p-6 shadow-sm h-full flex flex-col">
              <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em] italic mb-4 flex items-center gap-2">
                <Activity size={12} className="text-brand" /> Ativos em Tempo Real
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {paginatedAtivos.map((inv) => (
                  <InvestmentCard key={inv._id} inv={inv} openConfirm={openConfirm} onShowChart={() => setSelectedInv(inv)} />
                ))}
                {ativos.length === 0 && <EmptyState text="Sua carteira está vazia" />}
              </div>
              <div className="mt-auto pt-6 flex justify-center">
                <Pagination currentPage={currentPageAtivos} totalPages={Math.ceil(ativos.length / itemsPerPage)} onPageChange={setCurrentPageAtivos} />
              </div>
          </section>
        </div>
      </div>

      {historicoComValores.length > 0 && (
        <section className="mt-2">
          <div className="flex items-center gap-3 mb-4">
             <div className="h-px bg-border-ui flex-1" />
             <h3 className="text-[9px] font-black text-text-secondary uppercase tracking-[0.3em] italic flex items-center gap-2">
                <History size={12} /> Histórico de Saques
             </h3>
             <div className="h-px bg-border-ui flex-1" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedHistorico.map(inv => (
                  <div key={inv._id} className="bg-bg-card border border-border-ui/40 p-5 rounded-[1.8rem] relative overflow-hidden group hover:border-brand/40 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-text-primary uppercase italic truncate pr-2 tracking-tighter">{inv.ticker || inv.name}</span>
                        <span className="text-[6px] font-bold text-text-secondary uppercase opacity-50">{new Date(inv.updatedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <CheckCircle2 size={12} className="text-brand" />
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[7px] font-black text-text-secondary uppercase opacity-40">Investido</span>
                        <span className="text-[9px] font-bold text-text-secondary italic">R$ {inv.amountInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center bg-brand/5 p-1.5 rounded-lg">
                        <span className="text-[7px] font-black text-brand uppercase">Sacado</span>
                        <span className="text-[11px] font-black text-text-primary italic">R$ {inv.valorSacado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-border-ui/10">
                      <span className="text-[7px] font-black text-text-secondary uppercase opacity-40">Resultado</span>
                      <div className={`text-[9px] font-black italic flex items-center gap-1 ${inv.lucro >= 0 ? 'text-brand' : 'text-red-500'}`}>
                        {inv.lucro >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {inv.lucro >= 0 ? '+' : ''}{inv.lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({inv.lucroPercent.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
              ))}
          </div>
          {/* Paginação do Histórico */}
          <div className="mt-4 flex justify-center">
            <Pagination 
              currentPage={currentPageHistorico} 
              totalPages={Math.ceil(historicoComValores.length / itemsPerPageHistorico)} 
              onPageChange={setCurrentPageHistorico} 
            />
          </div>
        </section>
      )}

      <ModalInvestment isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={fetchData} />
      <ModalConfirm {...confirmModal} onClose={() => setConfirmModal(p => ({ ...p, isOpen: false }))} />
      <ModalMarketChart isOpen={isMarketOpen} onClose={() => setIsMarketOpen(false)} />
      <ModalInvestmentDetail isOpen={!!selectedInv} investment={selectedInv} onClose={() => setSelectedInv(null)} />
    </div>
  );
};

// Componentes Auxiliares
const StatCapsule = ({ label, value, icon, colorClass }) => (
  <div className="flex-1 px-4 py-2 flex flex-col justify-center text-left">
    <div className="flex items-center gap-1.5 mb-0.5 opacity-60 uppercase font-black text-[7px] tracking-[0.15em] text-text-secondary">
      {icon} {label}
    </div>
    <p className={`text-lg font-black italic tracking-tighter ${colorClass}`}>
      R$ {Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    </p>
  </div>
);

const InvestmentCard = ({ inv, openConfirm, onShowChart }) => {
  const valAtualTotal = Number(inv.currentTotalValue || 0);
  const lucroPercent = Number(inv.profitPercentage || 0);
  const valInvestido = Number(inv.amountInvested || 0);
  const isCripto = inv.type?.toLowerCase() === 'criptomoedas';

  return (
    <div onClick={onShowChart} className="p-5 bg-bg-main border border-border-ui/40 hover:border-brand/60 rounded-[1.5rem] transition-all cursor-pointer group flex flex-col justify-between shadow-sm text-left relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-black text-[11px] text-text-primary uppercase italic truncate max-w-[120px] group-hover:text-brand transition-colors">
            {inv.ticker || inv.name}
          </h4>
          <p className="text-[7px] font-bold text-text-secondary opacity-50 uppercase tracking-widest">{inv.type}</p>
        </div>
        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
           <button onClick={() => openConfirm('liquidate', inv)} className="p-2 bg-brand/5 text-brand rounded-xl hover:bg-brand hover:text-white transition-all shadow-sm"><DollarSign size={12} strokeWidth={3} /></button>
           <button onClick={() => openConfirm('delete', inv)} className="p-2 bg-red-500/5 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={12} strokeWidth={3} /></button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4 py-3 border-y border-border-ui/10">
          <div>
            <p className="text-[6px] font-black text-text-secondary uppercase opacity-40 mb-1">Investido</p>
            <p className="text-[10px] font-bold text-text-primary italic">R$ {valInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="text-right">
            <p className="text-[6px] font-black text-text-secondary uppercase opacity-40 mb-1">Valor Atual</p>
            <p className={`text-[10px] font-black italic ${lucroPercent >= 0 ? 'text-brand' : 'text-red-500'}`}>R$ {valAtualTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
      </div>
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <p className="text-[6px] font-black text-text-secondary uppercase opacity-40">{isCripto ? 'Sua Fração' : 'Quantidade'}</p>
          <p className="text-[8px] font-bold text-text-primary/60 italic">{Number(inv.quantity).toFixed(isCripto ? 6 : 2)} {inv.ticker || ''}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black flex items-center gap-1.5 shadow-sm ${lucroPercent >= 0 ? 'bg-brand/10 text-brand' : 'bg-red-500/10 text-red-500'}`}>
           {lucroPercent >= 0 ? <ArrowUpRight size={10} strokeWidth={3}/> : <ArrowDownRight size={10} strokeWidth={3}/>} 
           {Math.abs(lucroPercent).toFixed(2)}%
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ text }) => (
  <div className="col-span-full py-8 text-center border-2 border-dashed border-border-ui/10 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 opacity-50">
    <p className="text-[8px] font-black text-text-secondary uppercase tracking-[0.2em]">{text}</p>
  </div>
);

export default InvestmentPanel;