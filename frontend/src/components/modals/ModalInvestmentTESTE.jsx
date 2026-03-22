import React, { useState, useEffect } from 'react';
import { 
  X, DollarSign, TrendingUp, Briefcase, Receipt, Check, Loader2, 
  BarChart4, Landmark, Bitcoin, PieChart 
} from 'lucide-react';
import api from '@/services/api';
import { useAlert } from '../../context/AlertContext';
import SelectStyle from '../SelectStyle';

const ModalInvestment = ({ isOpen, onClose, onRefresh, onTransactionAdded }) => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  const initialState = {
    name: '',
    type: 'renda_fixa',
    ticker: '', // Novo: Para Ações/FIIs
    amountInvested: '',
    quantity: '1', // Novo: Quantidade de cotas/ações
    expectedProfitability: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    addAsTransaction: false
  };

  const [formData, setFormData] = useState(initialState);

  // Tipos de investimentos com ícones e configurações
  const investmentTypes = [
    { value: 'renda_fixa', label: 'Renda Fixa', icon: <Landmark size={14} /> },
    { value: 'acoes', label: 'Ações', icon: <BarChart4 size={14} /> },
    { value: 'fiis', label: 'FIIs', icon: <Briefcase size={14} /> },
    { value: 'cripto', label: 'Cripto', icon: <Bitcoin size={14} /> },
    { value: 'outros', label: 'Outros', icon: <PieChart size={14} /> },
  ];

  useEffect(() => {
    if (!isOpen) setFormData(initialState);
  }, [isOpen]);

  const isVariableIncome = ['acoes', 'fiis', 'cripto'].includes(formData.type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        amountInvested: Number(formData.amountInvested),
        quantity: Number(formData.quantity),
        expectedProfitability: isVariableIncome ? 0 : Number(formData.expectedProfitability),
        // Se for renda variável, o vencimento pode ser nulo
        endDate: isVariableIncome ? null : formData.endDate,
      };

      await api.post('/investments', dataToSend);
      showAlert('Ativo MAX registrado com sucesso!', 'success');
      
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
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-bg-card w-full max-w-md rounded-t-[2.5rem] md:rounded-[3.5rem] border-t md:border border-border-ui shadow-2xl relative overflow-hidden max-h-[95vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 md:p-8 border-b border-border-ui/50 shrink-0">
          <div className="text-left">
            <h2 className="text-xl md:text-2xl font-black text-text-primary italic uppercase tracking-tighter">
              Novo <span className="text-brand">Ativo</span>
            </h2>
            <p className="text-[9px] md:text-[10px] text-text-secondary font-black uppercase tracking-[0.2em] mt-1 opacity-60">Expansão de Patrimônio</p>
          </div>
          <button onClick={onClose} className="p-2 md:p-3 hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all text-text-secondary cursor-pointer">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4 overflow-y-auto custom-scrollbar">
          
          {/* Seleção de Tipo (Visual) */}
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2">Classe do Ativo</label>
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {investmentTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormData({...formData, type: t.value})}
                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase transition-all shrink-0 border 
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
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2">Nome do Ativo</label>
              <input 
                required type="text" value={formData.name} placeholder="Ex: Tesouro Selic ou Vale3"
                className="w-full bg-bg-main border border-border-ui rounded-[1.2rem] py-4 px-5 text-sm font-black italic outline-none focus:border-brand transition-all text-text-primary shadow-inner"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2">Cód/Ticker</label>
              <input 
                type="text" value={formData.ticker} placeholder="ABCD3"
                className="w-full bg-bg-main border border-border-ui rounded-[1.2rem] py-4 px-3 text-center text-sm font-black uppercase outline-none focus:border-brand transition-all text-text-primary shadow-inner"
                onChange={(e) => setFormData({...formData, ticker: e.target.value})}
              />
            </div>
          </div>

          {/* Valores e Quantidade */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2">
                {isVariableIncome ? 'Preço Médio' : 'Valor Investido'}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand italic">R$</span>
                <input 
                  required type="number" step="0.01" value={formData.amountInvested}
                  className="w-full bg-bg-main border border-border-ui rounded-[1.2rem] py-4 pl-10 pr-4 text-sm font-black italic outline-none focus:border-brand transition-all text-text-primary shadow-inner"
                  onChange={(e) => setFormData({...formData, amountInvested: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2">Qtd / Cotas</label>
              <div className="relative">
                <input 
                  required type="number" step="1" value={formData.quantity}
                  className="w-full bg-bg-main border border-border-ui rounded-[1.2rem] py-4 px-5 text-sm font-black italic outline-none focus:border-brand transition-all text-text-primary shadow-inner"
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Rentabilidade ou Vencimento Condicional */}
          {!isVariableIncome ? (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2">Rentab. % a.a</label>
                <div className="relative">
                  <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-brand" size={16} />
                  <input 
                    required type="number" step="0.1" value={formData.expectedProfitability} placeholder="12.5"
                    className="w-full bg-bg-main border border-border-ui rounded-[1.2rem] py-4 pl-10 pr-4 text-sm font-black italic outline-none focus:border-brand transition-all text-text-primary shadow-inner"
                    onChange={(e) => setFormData({...formData, expectedProfitability: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2">Vencimento</label>
                <input 
                  required type="date" value={formData.endDate} 
                  className="w-full bg-bg-main border border-border-ui rounded-[1.2rem] py-4 px-4 text-[11px] font-black outline-none text-text-primary shadow-inner focus:border-brand transition-all uppercase" 
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})} 
                />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-brand/5 border border-brand/20 rounded-[1.2rem] animate-in slide-in-from-top-2">
              <p className="text-[9px] font-black text-brand uppercase tracking-widest text-center">
                Renda Variável: Atualize o valor total periodicamente para refletir o mercado.
              </p>
            </div>
          )}

          {/* Lançar no Extrato */}
          <div 
            onClick={() => setFormData({...formData, addAsTransaction: !formData.addAsTransaction})}
            className={`flex items-center justify-between p-4 rounded-[1.5rem] cursor-pointer transition-all border ${formData.addAsTransaction ? 'bg-brand/10 border-brand shadow-lg shadow-brand/5' : 'bg-bg-main border-border-ui/50'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl transition-all ${formData.addAsTransaction ? 'bg-brand text-white' : 'bg-bg-card text-text-secondary border border-border-ui'}`}>
                <Receipt size={16} strokeWidth={3} />
              </div>
              <div className="text-left">
                <p className={`text-[10px] font-black uppercase italic tracking-tighter ${formData.addAsTransaction ? 'text-brand' : 'text-text-primary'}`}>Lançar no Extrato</p>
                <p className="text-[8px] font-bold text-text-secondary uppercase opacity-60">Debitar do saldo atual</p>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${formData.addAsTransaction ? 'bg-brand border-brand' : 'border-border-ui'}`}>
              {formData.addAsTransaction && <Check size={12} className="text-white" strokeWidth={4} />}
            </div>
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-brand text-white py-5 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-brand/20 hover:shadow-brand/40 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={18} strokeWidth={3} /> : <><DollarSign size={18} strokeWidth={3} /> Confirmar Ativo</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModalInvestment;