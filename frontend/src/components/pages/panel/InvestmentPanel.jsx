import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Trash2, DollarSign, TrendingUp, History, ArrowUpRight, 
  ArrowDownRight, Activity, List, Wallet, 
  ArrowDownCircle, CheckCircle2, Calendar 
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
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState('30D'); // '30D' ou '12M'
  const { showAlert } = useAlert();

  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [selectedInv, setSelectedInv] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, title: '', message: '', variant: 'danger', onConfirm: () => { },
  });

  const [currentPageAtivos, setCurrentPageAtivos] = useState(1);
  const itemsPerPage = 4;

  const fetchInvestments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/investments');
      setInvestments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setInvestments([]);
      showAlert('Erro ao carregar investimentos', 'error');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => { fetchInvestments(); }, [fetchInvestments]);

  const handleSacar = async (inv) => {
    try {
      await api.put(`/investments/${inv._id}/liquidate`, { 
        addAsIncome: true, 
        sellPrice: inv.currentTotalValue
      });
      showAlert(`${inv.ticker || inv.name} liquidado com sucesso!`, 'success');
      fetchInvestments();
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
      fetchInvestments();
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
        message: 'Esta ação não pode ser desfeita e não gerará transação de entrada.', 
        variant: 'danger', 
        onConfirm: () => handleDeletar(inv._id) 
      });
    }
  };

  const ativos = useMemo(() => 
    investments.filter(inv => inv.status === 'em andamento'), 
  [investments]);

  const historico = useMemo(() => 
    investments.filter(inv => inv.status === 'sacado' || inv.status === 'finalizado'), 
  [investments]);
  
  const totalInvestido = useMemo(() => ativos.reduce((acc, inv) => acc + (Number(inv.amountInvested) || 0), 0), [ativos]);
  const totalAtual = useMemo(() => ativos.reduce((acc, inv) => acc + (Number(inv.currentTotalValue) || 0), 0), [ativos]);
  const rendimentoTotal = totalAtual - totalInvestido;

  const valorSacadoTotal = useMemo(() => 
    historico.reduce((acc, inv) => acc + Number(inv.sellPrice || inv.amountInvested || 0), 0), 
  [historico]);

  // LÓGICA DE FILTRO DO GRÁFICO
  const multiSeriesData = useMemo(() => {
    const labels = timeFilter === '30D' 
      ? [{ id: 'start', name: 'Valor inicial' }, { id: 'current', name: 'Hoje' }]
      : [{ id: 'start', name: 'Valor inicial' }, { id: 'current', name: 'Atual' }];

    return labels.map((label) => {
      const dataPoint = { name: label.name };
      ativos.forEach(inv => {
        const key = inv.ticker || inv.name;
        // Simulando a visão histórica baseada no aporte vs atual para o gráfico de área
        dataPoint[key] = label.id === 'start' 
          ? Number(inv.amountInvested || 0) 
          : Number(inv.currentTotalValue || 0);
      });
      return dataPoint;
    });
  }, [ativos, timeFilter]);

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444'];

  if (loading && investments.length === 0) return <LoadingState message="CONECTANDO ÀS APIs DE MERCADO..." />;

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

        <div className="md:hidden bg-bg-card border border-border-ui rounded-[1.5rem] p-5 shadow-sm space-y-3">
          <MobileStatItem label="Investido" value={totalInvestido} icon={<Wallet size={12} />} />
          <MobileStatItem label="Lucro" value={rendimentoTotal} icon={<TrendingUp size={12} />} isProfit={rendimentoTotal >= 0} />
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
                
                {/* FILTROS DO GRÁFICO */}
                <div className="flex bg-bg-main border border-border-ui p-1 rounded-xl">
                  <button 
                    onClick={() => setTimeFilter('30D')}
                    className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${timeFilter === '30D' ? 'bg-brand text-white shadow-lg' : 'text-text-secondary opacity-50'}`}
                  >
                    30D
                  </button>
                  <button 
                    onClick={() => setTimeFilter('12M')}
                    className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${timeFilter === '12M' ? 'bg-brand text-white shadow-lg' : 'text-text-secondary opacity-50'}`}
                  >
                    12M
                  </button>
                </div>
              </div>
              
              <div className="flex-1 w-full" style={{ minHeight: '250px', marginLeft: '-10px' }}>
                {ativos.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={multiSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: 'currentColor', fontSize: 8, fontWeight: 900, opacity: 0.5}} 
                      />
                      <YAxis hide domain={['auto', 'auto']} />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--bg-card)', 
                          border: '1px solid var(--border-ui)', 
                          borderRadius: '16px',
                          fontSize: '10px',
                          fontWeight: '900',
                          textTransform: 'uppercase'
                        }} 
                      />
                      {ativos.map((inv, index) => (
                        <Area 
                          key={inv._id} 
                          type="monotone" 
                          dataKey={inv.ticker || inv.name} 
                          stroke={COLORS[index % COLORS.length]} 
                          fill={COLORS[index % COLORS.length]}
                          fillOpacity={0.05} 
                          strokeWidth={3}
                          animationDuration={1500}
                          dot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-card)' }}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center opacity-20 uppercase font-black text-[10px] tracking-widest text-center">
                    Aguardando dados...
                  </div>
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
                {ativos.slice((currentPageAtivos - 1) * itemsPerPage, currentPageAtivos * itemsPerPage).map((inv) => (
                  <InvestmentCard 
                    key={inv._id} 
                    inv={inv} 
                    openConfirm={openConfirm} 
                    onShowChart={() => setSelectedInv(inv)} 
                  />
                ))}
                {ativos.length === 0 && <EmptyState text="Sua carteira está vazia" />}
              </div>
              <div className="mt-auto pt-6 flex justify-center">
                <Pagination currentPage={currentPageAtivos} totalPages={Math.ceil(ativos.length / itemsPerPage)} onPageChange={setCurrentPageAtivos} />
              </div>
          </section>
        </div>
      </div>

      {historico.length > 0 && (
        <section className="mt-2">
          <div className="flex items-center gap-3 mb-4">
             <div className="h-px bg-border-ui flex-1" />
             <h3 className="text-[9px] font-black text-text-secondary uppercase tracking-[0.3em] italic flex items-center gap-2">
                <History size={12} /> Histórico de Saques
             </h3>
             <div className="h-px bg-border-ui flex-1" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {historico.map(inv => (
                <div key={inv._id} className="bg-bg-card border border-border-ui/40 p-4 rounded-2xl relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[9px] font-black text-text-primary uppercase italic truncate pr-2">{inv.ticker || inv.name}</span>
                    <CheckCircle2 size={10} className="text-brand" />
                  </div>
                  <span className="text-[12px] font-black text-text-primary">
                    R$ {Number(inv.sellPrice || inv.amountInvested).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <div className="text-[6px] font-bold text-text-secondary uppercase mt-1 opacity-50">
                    {new Date(inv.updatedAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      <ModalInvestment isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={fetchInvestments} />
      <ModalConfirm {...confirmModal} onClose={() => setConfirmModal(p => ({ ...p, isOpen: false }))} />
      <ModalMarketChart isOpen={isMarketOpen} onClose={() => setIsMarketOpen(false)} />
      <ModalInvestmentDetail isOpen={!!selectedInv} investment={selectedInv} onClose={() => setSelectedInv(null)} />
    </div>
  );
};

// COMPONENTES AUXILIARES (Mantidos conforme solicitado)
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

const MobileStatItem = ({ label, value, icon, isProfit = false }) => (
  <div className="flex justify-between items-center px-1">
    <div className="flex items-center gap-2">
      <div className="p-1.5 bg-white/5 rounded-lg">{icon}</div>
      <span className="text-[8px] font-black text-text-secondary uppercase tracking-widest">{label}</span>
    </div>
    <span className={`text-sm font-black italic ${isProfit ? 'text-brand' : 'text-text-primary'}`}>
      R$ {Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    </span>
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
      <div className="flex items-center gap-1.5 mb-3 px-1">
        <Calendar size={10} className="text-text-secondary opacity-40" />
        <p className="text-[7px] font-black text-text-secondary uppercase opacity-60 tracking-tighter">
          Início: <span className="text-text-primary">{new Date(inv.startDate).toLocaleDateString('pt-BR')}</span>
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4 py-3 border-y border-border-ui/10">
          <div>
            <p className="text-[6px] font-black text-text-secondary uppercase opacity-40 mb-1">Investido</p>
            <p className="text-[10px] font-bold text-text-primary italic">
              R$ {valInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[6px] font-black text-text-secondary uppercase opacity-40 mb-1">Valor Atual</p>
            <p className={`text-[10px] font-black italic ${lucroPercent >= 0 ? 'text-brand' : 'text-red-500'}`}>
              R$ {valAtualTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
      </div>
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          {inv.endDate ? (
            <>
              <p className="text-[6px] font-black text-text-secondary uppercase opacity-40">Vencimento</p>
              <div className="flex items-center gap-1">
                <Calendar size={8} className="text-brand opacity-60" />
                <p className="text-[8px] font-bold text-brand italic">{new Date(inv.endDate).toLocaleDateString('pt-BR')}</p>
              </div>
            </>
          ) : (
            <>
              <p className="text-[6px] font-black text-text-secondary uppercase opacity-40">
                {isCripto ? 'Sua Fração' : 'Quantidade'}
              </p>
              <p className="text-[8px] font-bold text-text-primary/60 italic">
                {Number(inv.quantity).toFixed(isCripto ? 6 : 2)} {inv.ticker || ''}
              </p>
            </>
          )}
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