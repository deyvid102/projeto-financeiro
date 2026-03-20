import React, { useState, useEffect } from 'react';
import { X, DollarSign, TrendingUp, Briefcase, Receipt, Check, Loader2 } from 'lucide-react';
import api from '@/services/api';
import { useAlert } from '../../context/AlertContext';
import SelectStyle from '../SelectStyle';

const ModalInvestment = ({ isOpen, onClose, onRefresh, onTransactionAdded }) => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  const initialState = {
    name: '',
    type: 'renda fixa',
    amountInvested: '',
    expectedProfitability: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    addAsTransaction: false
  };

  const [formData, setFormData] = useState(initialState);

  // Resetar o formulário quando o modal fechar
  useEffect(() => {
    if (!isOpen) {
      setFormData(initialState);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSend = {
        ...formData,
        amountInvested: Number(formData.amountInvested),
        expectedProfitability: Number(formData.expectedProfitability),
      };

      await api.post('/investments', dataToSend);
      
      showAlert('Ativo MAX registrado com sucesso!', 'success');
      
      if (typeof onRefresh === 'function') onRefresh();
      
      if (formData.addAsTransaction && typeof onTransactionAdded === 'function') {
        onTransactionAdded();
      }
      
      onClose();
    } catch (err) {
      console.error(err);
      showAlert(err.response?.data?.message || 'Erro ao processar investimento no servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Retorno nulo imediato se não estiver aberto (sem delays de animação)
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-bg-card w-full max-w-md rounded-[3.5rem] border border-border-ui shadow-2xl relative overflow-visible">
        
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-border-ui/50">
          <div className="text-left">
            <h2 className="text-2xl font-black text-text-primary italic uppercase tracking-tighter">
              Novo Ativo <span className="text-brand">MAX</span>
            </h2>
            <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.2em] mt-1 opacity-60">Alocação de Capital</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all text-text-secondary cursor-pointer active:scale-90">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2 block">Nome do Ativo</label>
            <div className="relative group">
              <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-brand" size={18} />
              <input 
                required type="text" value={formData.name} placeholder="Ex: CDB 110% CDI"
                className="w-full bg-bg-main border border-border-ui rounded-[1.5rem] py-5 pl-14 pr-4 text-sm font-black italic outline-none focus:border-brand transition-all text-text-primary shadow-inner"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative z-[60]">
              <SelectStyle 
                label="Tipo"
                value={formData.type}
                options={[
                  { label: 'Renda Fixa', value: 'renda fixa' },
                  { label: 'Outros', value: 'outros' }
                ]}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2">Valor (R$)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xs font-black text-brand italic">R$</span>
                <input 
                  required type="number" step="0.01" value={formData.amountInvested}
                  className="w-full bg-bg-main border border-border-ui rounded-[1.5rem] py-5 pl-12 pr-4 text-sm font-black italic outline-none focus:border-brand transition-all text-text-primary shadow-inner"
                  onChange={(e) => setFormData({...formData, amountInvested: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2">Rentabilidade Alvo (% a.a)</label>
            <div className="relative">
              <TrendingUp className="absolute left-5 top-1/2 -translate-y-1/2 text-brand" size={18} />
              <input 
                required type="number" step="0.1" value={formData.expectedProfitability} placeholder="12.5"
                className="w-full bg-bg-main border border-border-ui rounded-[1.5rem] py-5 pl-14 pr-4 text-sm font-black italic outline-none focus:border-brand transition-all text-text-primary shadow-inner"
                onChange={(e) => setFormData({...formData, expectedProfitability: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2">Início</label>
              <input required type="date" value={formData.startDate} className="w-full bg-bg-main border border-border-ui rounded-[1.5rem] py-4 px-5 text-[12px] font-black outline-none text-text-primary shadow-inner focus:border-brand transition-all uppercase" onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2">Vencimento</label>
              <input required type="date" value={formData.endDate} className="w-full bg-bg-main border border-border-ui rounded-[1.5rem] py-4 px-5 text-[12px] font-black outline-none text-text-primary shadow-inner focus:border-brand transition-all uppercase" onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
            </div>
          </div>

          <div 
            onClick={() => setFormData({...formData, addAsTransaction: !formData.addAsTransaction})}
            className={`flex items-center justify-between p-5 rounded-[2.2rem] cursor-pointer transition-all border ${formData.addAsTransaction ? 'bg-brand/10 border-brand' : 'bg-bg-main border-border-ui/50'}`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl transition-all ${formData.addAsTransaction ? 'bg-brand text-white' : 'bg-bg-card text-text-secondary border border-border-ui'}`}>
                <Receipt size={18} strokeWidth={3} />
              </div>
              <div className="text-left">
                <p className={`text-[11px] font-black uppercase italic tracking-tighter ${formData.addAsTransaction ? 'text-brand' : 'text-text-primary'}`}>Lançar no Extrato</p>
                <p className="text-[9px] font-bold text-text-secondary uppercase opacity-60">Registrar como saída</p>
              </div>
            </div>
            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${formData.addAsTransaction ? 'bg-brand border-brand' : 'border-border-ui'}`}>
              {formData.addAsTransaction && <Check size={16} className="text-white" strokeWidth={4} />}
            </div>
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-brand text-white py-5 rounded-[1.8rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-brand/20 hover:shadow-brand/40 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 active:scale-95 mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} strokeWidth={3} /> : <><DollarSign size={18} strokeWidth={3} /> Salvar Ativo</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModalInvestment;