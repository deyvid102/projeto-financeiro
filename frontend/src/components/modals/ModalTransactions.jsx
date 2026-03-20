import React, { useState, useEffect } from 'react';
import { X, FileText, Tag, Loader2, Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import api from '@/services/api';
import SelectStyle from '../SelectStyle'; 
import { useAlert } from '../../context/AlertContext'; 

const ModalTransactions = ({ isOpen, onClose, onTransactionAdded, transactionToEdit, presetData }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]); 
  const { showAlert } = useAlert();

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const initialState = {
    title: '', amount: '', type: 'saida', category: 'outros', date: getTodayString(), goal: null 
  };

  const [formData, setFormData] = useState(initialState);

  const getAvailableBalance = () => {
    if (!presetData) return 0;
    return Number(presetData.currentAmount || 0);
  };

  // Cores dinâmicas baseadas no tipo (Red para Saída, Green para Entrada)
  const isExpense = formData.type === 'saida';
  const themeColor = isExpense ? 'red-600' : 'green-600';
  const themeBorder = isExpense ? 'focus:border-red-600' : 'focus:border-green-600';
  const themeText = isExpense ? 'text-red-600' : 'text-green-600';
  const themeBg = isExpense ? 'bg-red-600' : 'bg-green-600';
  const themeShadow = isExpense ? 'shadow-red-600/20' : 'shadow-green-600/20';

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        const formatted = response.data.map(cat => ({ label: cat.name, value: cat.name, _id: cat._id }));
        if (presetData && !formatted.find(c => c.value === 'caixinha')) {
          formatted.push({ label: 'Caixinha', value: 'caixinha' });
        }
        setCategories(formatted);
      } catch (err) { console.error(err); }
    };
    if (isOpen) fetchCategories();
  }, [isOpen, presetData]);

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setFormData({ ...transactionToEdit, date: transactionToEdit.date?.split('T')[0] || getTodayString() });
      } else if (presetData) {
        const goalId = presetData._id || (typeof presetData.goal === 'string' ? presetData.goal : presetData.goal?._id);
        setFormData({
          ...initialState,
          title: presetData.title || '',
          type: presetData.type || 'saida',
          category: 'caixinha',
          goal: goalId
        });
      } else {
        setFormData(initialState);
      }
    }
  }, [isOpen, transactionToEdit, presetData]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const finalAmount = Number(formData.amount);
    if (presetData && formData.type === 'entrada' && finalAmount > getAvailableBalance()) {
        return showAlert(`Saldo insuficiente: R$ ${getAvailableBalance().toLocaleString('pt-BR')}`, "error");
    }
    if (finalAmount <= 0) return showAlert("Insira um valor válido", "error");

    setLoading(true);
    try {
      const payload = { ...formData, amount: finalAmount, isPaid: true };
      if (transactionToEdit) {
        await api.put(`/transactions/${transactionToEdit._id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }
      onTransactionAdded(); 
      onClose();
      showAlert("Operação realizada!", "success");
    } catch (err) {
      showAlert(err.response?.data?.message || "Erro ao salvar", "error");
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
        
        {/* CORPO DO MODAL - SEM overflow-hidden para o Select respirar */}
        <div className="bg-bg-card rounded-[2.5rem] shadow-2xl border border-border-ui relative">
          
          <div className="flex justify-between items-center p-6 border-b border-border-ui/50 bg-bg-main/20 rounded-t-[2.5rem]">
            <h2 className="text-xl font-black text-text-primary italic uppercase tracking-tighter">
              {presetData ? (isExpense ? 'Depositar' : 'Resgatar') : 'Lançamento'} <span className={themeText}>MAX</span>
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all cursor-pointer">
              <X size={18} strokeWidth={3} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            {/* SELECT TABS INTERNO */}
            {!presetData && (
              <div className="flex p-1.5 bg-bg-main rounded-2xl border border-border-ui gap-1.5">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'entrada'})}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all cursor-pointer ${
                    formData.type === 'entrada' ? 'bg-green-600 text-white shadow-lg' : 'text-text-secondary hover:bg-border-ui/50'
                  }`}
                >
                  <ArrowUpCircle size={14} /> Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'saida'})}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all cursor-pointer ${
                    formData.type === 'saida' ? 'bg-red-600 text-white shadow-lg' : 'text-text-secondary hover:bg-border-ui/50'
                  }`}
                >
                  <ArrowDownCircle size={14} /> Saída
                </button>
              </div>
            )}

            <div className="space-y-3 text-left">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest">Valor</label>
                {presetData && formData.type === 'entrada' && (
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, amount: getAvailableBalance().toString() }))}
                    className={`text-[9px] font-bold ${themeText} hover:underline cursor-pointer`}
                  >
                    Máximo: R$ {getAvailableBalance().toLocaleString('pt-BR')}
                  </button>
                )}
              </div>
              
              <div className="relative">
                <span className={`absolute left-5 top-1/2 -translate-y-1/2 font-black text-2xl italic ${themeText}`}>R$</span>
                <input
                  type="number" step="0.01" placeholder="0,00"
                  className={`w-full pl-16 pr-5 py-5 bg-bg-main border border-border-ui rounded-2xl text-text-primary font-black text-3xl outline-none transition-all shadow-inner ${themeBorder}`}
                  value={formData.amount} 
                  onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                  required autoFocus
                />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest ml-1">Descrição</label>
              <div className="relative">
                <FileText className={`absolute left-5 top-1/2 -translate-y-1/2 opacity-40 ${themeText}`} size={16} />
                <input
                  type="text"
                  placeholder="Ex: Pagamento"
                  className={`w-full pl-12 pr-5 py-4 bg-bg-main border border-border-ui rounded-2xl text-text-primary font-bold italic outline-none text-sm transition-all ${presetData ? 'opacity-60 cursor-not-allowed' : themeBorder}`}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required readOnly={!!presetData}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 relative">
              {/* Z-INDEX alto para o Select não sumir sob outros elementos */}
              <div className={`relative z-[100] ${presetData ? 'opacity-50 pointer-events-none' : ''}`}> 
                <SelectStyle
                  label="Categoria" 
                  icon={Tag} 
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  options={categories} 
                  required
                />
              </div>

              <div className="space-y-2 text-left relative z-[10]">
                <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest ml-1">Data</label>
                <input
                  type="date"
                  className={`w-full px-4 py-4 bg-bg-main border border-border-ui rounded-2xl text-text-primary text-xs font-black outline-none transition-all ${themeBorder}`}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <button
              type="submit" 
              disabled={loading}
              className={`w-full text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer ${themeBg} ${themeShadow} hover:scale-[1.01] active:scale-95`}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : "Confirmar Lançamento"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalTransactions;