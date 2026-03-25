import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, DollarSign, TrendingUp, Briefcase, Receipt, Check, Loader2, 
  BarChart4, Landmark, Bitcoin, PieChart, Calendar, Calculator
} from 'lucide-react';
import api from '@/services/api';
import { useAlert } from '../../context/AlertContext';

const ModalInvestment = ({ isOpen, onClose, onRefresh, onTransactionAdded }) => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  const initialState = {
    name: '',
    type: 'renda fixa',
    ticker: '', 
    amountInvested: '',
    expectedProfitability: '',
    startDate: new Date().toISOString().split('T')[0], 
    endDate: '',
    addAsTransaction: false
  };

  const [formData, setFormData] = useState(initialState);

  // Lógica de Visibilidade
  const isFixedIncome = formData.type === 'renda fixa';
  const showVencimento = isFixedIncome || formData.type === 'outros';

  // --- LÓGICA DE SIMULAÇÃO ---
  const simulation = useMemo(() => {
    const { amountInvested, expectedProfitability, startDate, endDate } = formData;
    
    if (!isFixedIncome || !amountInvested || !expectedProfitability || !endDate) return null;

    const principal = parseFloat(amountInvested);
    const taxaAnual = parseFloat(expectedProfitability) / 100;
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);

    if (d2 <= d1) return null;

    // Cálculo de tempo em anos (base 365 dias)
    const diffEmMs = d2 - d1;
    const dias = Math.floor(diffEmMs / (1000 * 60 * 60 * 24));
    const anos = dias / 365;

    // Juros Compostos: M = P * (1 + i)^t
    const montanteBruto = principal * Math.pow((1 + taxaAnual), anos);
    const lucroBruto = montanteBruto - principal;

    return {
      total: montanteBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      lucro: lucroBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      dias: dias
    };
  }, [formData, isFixedIncome]);

  useEffect(() => {
    const bottomBar = document.querySelector('nav[aria-label="Navegação principal"]');
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (bottomBar) bottomBar.style.display = 'none';
    } else {
      document.body.style.overflow = 'unset';
      if (bottomBar) bottomBar.style.display = 'block';
    }
    return () => {
      document.body.style.overflow = 'unset';
      if (bottomBar) bottomBar.style.display = 'block';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setFormData(initialState);
  }, [isOpen]);

  const investmentTypes = [
    { value: 'renda fixa', label: 'Renda Fixa', icon: <Landmark size={14} /> },
    { value: 'acoes', label: 'Ações', icon: <BarChart4 size={14} /> },
    { value: 'fiis', label: 'FIIs', icon: <Briefcase size={14} /> },
    { value: 'criptomoedas', label: 'Cripto', icon: <Bitcoin size={14} /> },
    { value: 'outros', label: 'Outros', icon: <PieChart size={14} /> },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedStartDate = new Date(formData.startDate);
      selectedStartDate.setMinutes(selectedStartDate.getMinutes() + selectedStartDate.getTimezoneOffset());

      const dataToSend = {
        ...formData,
        ticker: isFixedIncome ? '' : formData.ticker,
        amountInvested: Number(formData.amountInvested),
        quantity: 0, 
        startDate: selectedStartDate,
        expectedProfitability: showVencimento ? Number(formData.expectedProfitability) : 0,
        endDate: showVencimento ? formData.endDate : null,
      };

      await api.post('/investments', dataToSend);
      showAlert('Ativo registrado com sucesso!', 'success');
      
      if (onRefresh) onRefresh();
      if (formData.addAsTransaction && onTransactionAdded) onTransactionAdded();
      onClose();
    } catch (err) {
      showAlert(err.response?.data?.message || 'Erro ao processar investimento', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center bg-black/90 backdrop-blur-md md:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-bg-card w-full max-w-md rounded-t-[2.5rem] md:rounded-[3rem] border-t md:border border-border-ui shadow-2xl relative overflow-hidden max-h-[95vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        
        <div className="md:hidden w-12 h-1.5 bg-border-ui/50 rounded-full mx-auto mt-4 shrink-0" />

        <div className="flex justify-between items-center p-6 md:p-8 border-b border-border-ui/50 shrink-0">
          <div className="text-left">
            <h2 className="text-xl md:text-2xl font-black text-text-primary italic uppercase tracking-tighter">
              Novo <span className="text-brand">Ativo</span>
            </h2>
            <p className="text-[9px] md:text-[10px] text-text-secondary font-black uppercase tracking-[0.2em] mt-1 opacity-60">Cálculo Automático por Cota</p>
          </div>
          <button onClick={onClose} className="p-2 md:p-3 hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all text-text-secondary cursor-pointer active:scale-90">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 overflow-y-auto custom-scrollbar pb-10">
          
          {/* Seleção de Tipo */}
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2">Classe do Ativo</label>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {investmentTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormData({...formData, type: t.value, ticker: t.value === 'renda fixa' ? '' : formData.ticker})}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all shrink-0 border 
                    ${formData.type === t.value 
                      ? 'bg-brand border-brand text-white shadow-lg shadow-brand/20' 
                      : 'bg-bg-main border-border-ui text-text-secondary hover:border-brand/40'}`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nome / Ticker */}
          <div className="flex flex-col gap-3">
            <div className={`grid ${isFixedIncome ? 'grid-cols-1' : 'grid-cols-3'} gap-3`}>
              <div className={`${isFixedIncome ? 'col-span-1' : 'col-span-2'} space-y-2 text-left`}>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2">Nome do Ativo</label>
                <input 
                  required type="text" value={formData.name} placeholder={isFixedIncome ? "Ex: CDB Safra 110% CDI" : "Ex: Bitcoin ou Petrobras"}
                  className="w-full bg-bg-main border border-border-ui rounded-2xl py-4 px-5 text-sm font-black italic outline-none focus:border-brand transition-all text-text-primary shadow-inner"
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              {!isFixedIncome && (
                <div className="space-y-2 text-left animate-in zoom-in-95 duration-200">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2">Ticker</label>
                  <input 
                    type="text" value={formData.ticker} placeholder="BTC"
                    className="w-full bg-bg-main border border-border-ui rounded-2xl py-4 px-3 text-center text-[10px] font-black uppercase outline-none focus:border-brand transition-all text-text-primary shadow-inner"
                    onChange={(e) => setFormData({...formData, ticker: e.target.value})}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Valor Investido */}
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2">Total Investido (Aporte)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand italic">R$</span>
              <input 
                required type="number" step="0.01" value={formData.amountInvested}
                className="w-full bg-bg-main border border-border-ui rounded-2xl py-4 pl-10 pr-4 text-sm font-black italic outline-none focus:border-brand transition-all text-text-primary shadow-inner"
                onChange={(e) => setFormData({...formData, amountInvested: e.target.value})}
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Data de Início */}
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2">Data da Operação</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-brand" size={16} />
              <input 
                required type="date" value={formData.startDate}
                className="w-full bg-bg-main border border-border-ui rounded-2xl py-4 pl-12 pr-4 text-[11px] font-black outline-none text-text-primary shadow-inner focus:border-brand transition-all uppercase" 
                onChange={(e) => setFormData({...formData, startDate: e.target.value})} 
              />
            </div>
          </div>

          {/* Renda Fixa Fields */}
          {showVencimento && (
            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2">Rentab. % a.a</label>
                <div className="relative">
                  <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-brand" size={14} />
                  <input 
                    required type="number" step="0.1" value={formData.expectedProfitability} placeholder="12.5"
                    className="w-full bg-bg-main border border-border-ui rounded-2xl py-4 pl-10 pr-4 text-sm font-black italic outline-none focus:border-brand transition-all text-text-primary shadow-inner"
                    onChange={(e) => setFormData({...formData, expectedProfitability: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2">Vencimento</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={14} />
                  <input 
                    required type="date" value={formData.endDate} 
                    className="w-full bg-bg-main border border-border-ui rounded-2xl py-4 pl-10 pr-4 text-[10px] font-black outline-none text-text-primary shadow-inner focus:border-brand transition-all uppercase" 
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* --- CAMPO DE SIMULAÇÃO ABAIXO DA RENTABILIDADE --- */}
          {simulation && (
            <div className="bg-brand/10 border border-brand/20 rounded-[2rem] p-5 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between border-b border-brand/10 pb-3">
                <div className="flex items-center gap-2">
                  <Calculator size={14} className="text-brand" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-brand italic">Projeção de Retorno</span>
                </div>
                <span className="text-[8px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full uppercase italic">
                  {simulation.dias} dias
                </span>
              </div>
              
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-text-secondary uppercase opacity-60">Montante Final Bruto</p>
                  <p className="text-2xl font-black text-text-primary italic tracking-tighter">
                    {simulation.total.split(',')[0]}<span className="text-sm opacity-60">,{simulation.total.split(',')[1]}</span>
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[8px] font-black text-text-secondary uppercase opacity-60">Lucro Estimado</p>
                  <p className="text-sm font-black text-green-500 italic">
                    +{simulation.lucro}
                  </p>
                </div>
              </div>

              <p className="text-[7px] font-bold text-text-secondary uppercase opacity-40 leading-tight">
                * Simulação baseada em juros compostos anuais sobre dias corridos. Valores sem considerar impostos.
              </p>
            </div>
          )}

          {/* Checkbox Transação */}
          <div 
            onClick={() => setFormData({...formData, addAsTransaction: !formData.addAsTransaction})}
            className={`flex items-center justify-between p-5 rounded-[2rem] cursor-pointer transition-all border ${formData.addAsTransaction ? 'bg-brand/10 border-brand shadow-lg shadow-brand/5' : 'bg-bg-main border-border-ui/50'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl transition-all ${formData.addAsTransaction ? 'bg-brand text-white' : 'bg-bg-card text-text-secondary border border-border-ui'}`}>
                <Receipt size={18} strokeWidth={3} />
              </div>
              <div className="text-left">
                <p className={`text-[10px] font-black uppercase italic tracking-tighter ${formData.addAsTransaction ? 'text-brand' : 'text-text-primary'}`}>Lançar no Extrato</p>
                <p className="text-[8px] font-bold text-text-secondary uppercase opacity-60">Registrar saída do saldo</p>
              </div>
            </div>
            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${formData.addAsTransaction ? 'bg-brand border-brand' : 'border-border-ui'}`}>
              {formData.addAsTransaction && <Check size={14} className="text-white" strokeWidth={4} />}
            </div>
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-brand text-white py-5 rounded-[1.8rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-brand/20 hover:shadow-brand/40 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
          >
            {loading ? <Loader2 className="animate-spin" size={18} strokeWidth={3} /> : <><DollarSign size={18} strokeWidth={3} /> Salvar Ativo</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModalInvestment;