import React, { useState, useEffect } from 'react';
import { X, FileText, Tag, Loader2, ArrowUpCircle, ArrowDownCircle, CreditCard, Hash } from 'lucide-react';
import api from '@/services/api';
import SelectStyle from '../SelectStyle'; 
import { useAlert } from '../../context/AlertContext'; 

const ModalTransactions = ({ isOpen, onClose, onTransactionAdded, transactionToEdit, presetData }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]); 
  const [cards, setCards] = useState([]);
  const { showAlert } = useAlert();

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const initialState = {
    title: '', amount: '', type: 'saida', category: 'outros', date: getTodayString(), goal: null, cardId: '', installments: 1
  };

  const [formData, setFormData] = useState(initialState);

  const getAvailableBalance = () => {
    if (!presetData) return 0;
    return Number(presetData.currentAmount || 0);
  };

  const isExpense = formData.type === 'saida';
  const selectedCard = cards.find((card) => card._id === formData.cardId) || null;
  const isCreditCardFlow = selectedCard?.type === 'credito' && !transactionToEdit;
  const installmentCount = Math.min(12, Math.max(1, Number(formData.installments || 1)));
  const totalAmount = Number(formData.amount || 0);
  const installmentAmount = isCreditCardFlow && installmentCount > 0
    ? Number((totalAmount / installmentCount).toFixed(2))
    : totalAmount;
  const creditAvailable = selectedCard?.availableLimit ?? Math.max(0, Number(selectedCard?.creditLimit || 0) - Number(selectedCard?.usedLimit || 0));
  const isVaCardFlow = selectedCard?.type === 'vale_alimentacao' && !transactionToEdit;
  const themeColor = isExpense ? 'red-600' : 'green-600';
  const themeBorder = isExpense ? 'focus:border-red-600' : 'focus:border-green-600';
  const themeText = isExpense ? 'text-red-600' : 'text-green-600';
  const themeBg = isExpense ? 'bg-red-600' : 'bg-green-600';
  const themeShadow = isExpense ? 'shadow-red-600/20' : 'shadow-green-600/20';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catResponse, cardResponse] = await Promise.all([api.get('/categories'), api.get('/cards')]);
        const formatted = catResponse.data.map(cat => ({ label: cat.name, value: cat.name, _id: cat._id }));
        if (presetData && !formatted.find(c => c.value === 'caixinha')) {
          formatted.push({ label: 'Caixinha', value: 'caixinha' });
        }
        setCategories(formatted);
        setCards(Array.isArray(cardResponse.data) ? cardResponse.data : []);
      } catch (err) { console.error(err); }
    };
    if (isOpen) fetchData();
  }, [isOpen, presetData]);

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        setFormData({ ...transactionToEdit, cardId: transactionToEdit.card?._id || '', installments: 1, date: transactionToEdit.date?.split('T')[0] || getTodayString() });
      } else if (presetData) {
        const goalId = presetData._id || (typeof presetData.goal === 'string' ? presetData.goal : presetData.goal?._id);
        setFormData({
          ...initialState,
          title: presetData.title || '',
          type: presetData.type || 'saida',
          category: 'caixinha',
          goal: goalId,
          cardId: '',
          installments: 1,
        });
      } else {
        setFormData(initialState);
      }
    }
  }, [isOpen, transactionToEdit, presetData]);

  useEffect(() => {
    if (transactionToEdit) return;
    if (!selectedCard) return;

    if (selectedCard.type === 'credito') {
      setFormData((prev) => ({ ...prev, type: 'saida' }));
    }

    if (selectedCard.type === 'vale_alimentacao') {
      setFormData((prev) => ({ ...prev, type: 'saida', category: 'vale_alimentacao' }));
    }
  }, [selectedCard, transactionToEdit]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const finalAmount = totalAmount;
    if (presetData && formData.type === 'entrada' && finalAmount > getAvailableBalance()) {
        return showAlert(`Saldo insuficiente: R$ ${getAvailableBalance().toLocaleString('pt-BR')}`, "error");
    }
    if (finalAmount <= 0) return showAlert("Insira um valor válido", "error");
    if (!transactionToEdit && isCreditCardFlow && (installmentCount < 1 || installmentCount > 12)) {
      return showAlert("Parcelamento inválido. Escolha entre 1x e 12x.", "error");
    }
    if (!transactionToEdit && isCreditCardFlow && finalAmount > Number(creditAvailable || 0)) {
      return showAlert(`Limite insuficiente. Disponível: R$ ${Number(creditAvailable || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, "error");
    }

    setLoading(true);
    try {
      if (transactionToEdit) {
        const payload = {
          title: formData.title,
          amount: finalAmount,
          type: formData.type,
          category: formData.category,
          date: formData.date,
          goal: formData.goal || null,
          cardId: formData.cardId || null,
          isPaid: true,
        };
        await api.put(`/transactions/${transactionToEdit._id}`, payload);
      } else if (isCreditCardFlow) {
        const recurrencePayload = {
          title: formData.title,
          amount: installmentAmount,
          type: 'saida',
          category: formData.category,
          cardId: selectedCard._id,
          isInstallment: true,
          totalInstallments: installmentCount,
          frequency: 'monthly',
          dayOfMonth: [new Date().getDate()],
          dayOfWeek: [],
          monthOfYear: [],
          isActive: true,
        };
        await api.post('/recurrences', recurrencePayload);
      } else {
        const payload = {
          title: formData.title,
          amount: finalAmount,
          type: formData.type,
          category: formData.category,
          date: formData.date,
          goal: formData.goal || null,
          cardId: formData.cardId || null,
          isPaid: true,
        };
        await api.post('/transactions', payload);
      }
      onTransactionAdded(); 
      onClose();
      showAlert(isCreditCardFlow ? "Compra no crédito parcelada com sucesso!" : "Operação realizada!", "success");
    } catch (err) {
      showAlert(err.response?.data?.message || "Erro ao salvar", "error");
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="bg-bg-card rounded-[2rem] shadow-2xl border border-border-ui relative max-h-[88vh] overflow-y-auto custom-scrollbar">
          
          <div className="flex justify-between items-center p-4 border-b border-border-ui/50 bg-bg-main/20 rounded-t-[2rem]">
            <h2 className="text-lg font-black text-text-primary italic uppercase tracking-tighter">
              {presetData ? (isExpense ? 'Depositar' : 'Resgatar') : 'Lançamento'} <span className={themeText}>MAX</span>
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all cursor-pointer">
              <X size={18} strokeWidth={3} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            
            {!presetData && (
              <div className="flex p-1 bg-bg-main rounded-xl border border-border-ui gap-1">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'entrada'})}
                  disabled={isCreditCardFlow || isVaCardFlow}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-black uppercase text-[8px] tracking-widest transition-all cursor-pointer ${
                    formData.type === 'entrada' ? 'bg-green-600 text-white shadow-lg' : 'text-text-secondary hover:bg-border-ui/50'
                  } ${(isCreditCardFlow || isVaCardFlow) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <ArrowUpCircle size={13} /> Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'saida'})}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-black uppercase text-[8px] tracking-widest transition-all cursor-pointer ${
                    formData.type === 'saida' ? 'bg-red-600 text-white shadow-lg' : 'text-text-secondary hover:bg-border-ui/50'
                  }`}
                >
                  <ArrowDownCircle size={13} /> Saída
                </button>
              </div>
            )}

            {!presetData && !transactionToEdit && (
              <div className="relative z-[120]">
                <SelectStyle
                  label="Cartão (opcional)"
                  icon={CreditCard}
                  value={formData.cardId || 'no_card'}
                  onChange={(e) => setFormData({ ...formData, cardId: e.target.value === 'no_card' ? '' : e.target.value, installments: 1 })}
                  options={[
                    { label: 'Sem cartão (conta corrente)', value: 'no_card' },
                    ...cards.map((card) => ({
                      label: `${card.name} • ${card.type === 'vale_alimentacao' ? 'vale alimentação' : card.type}`,
                      value: card._id,
                    })),
                  ]}
                />
              </div>
            )}

            {isCreditCardFlow && (
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-2.5 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 text-blue-500" size={14} />
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={formData.installments}
                      onChange={(e) => setFormData((prev) => ({ ...prev, installments: Math.min(12, Math.max(1, Number(e.target.value) || 1)) }))}
                      className="w-full pl-10 pr-4 py-2.5 bg-bg-main border border-blue-500/20 rounded-lg text-sm font-black outline-none"
                    />
                  </div>
                  <div className="px-3 py-2.5 rounded-lg bg-bg-main border border-border-ui text-[9px] font-black text-text-secondary uppercase tracking-wide break-words">
                    Limite: R$ {Number(creditAvailable || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <p className="text-[9px] font-bold text-text-secondary">
                  Parcela estimada: <span className="text-blue-500">R$ {Number(installmentAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span> ({installmentCount}x)
                </p>
                <p className={`text-[9px] font-black ${totalAmount > Number(creditAvailable || 0) ? 'text-red-500' : 'text-green-500'}`}>
                  Total da compra: R$ {Number(totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}

            <div className="space-y-3 text-left">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest">{isCreditCardFlow ? 'Valor total da compra' : 'Valor'}</label>
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
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-black text-xl italic ${themeText}`}>R$</span>
                <input
                  type="number" step="0.01" placeholder="0,00"
                  className={`w-full pl-12 pr-4 py-3.5 bg-bg-main border border-border-ui rounded-xl text-text-primary font-black text-2xl outline-none transition-all shadow-inner ${themeBorder}`}
                  value={formData.amount} 
                  onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                  required autoFocus
                />
              </div>
            </div>

            {/* CATEGORIA MOVIDA PARA CIMA */}
            <div className={`relative z-[100] ${presetData ? 'opacity-50 pointer-events-none' : ''} ${isVaCardFlow ? 'opacity-60 pointer-events-none' : ''}`}> 
              <SelectStyle
                label="Categoria" 
                icon={Tag} 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={categories} 
                required
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest ml-1">Descrição</label>
              <div className="relative">
                <FileText className={`absolute left-5 top-1/2 -translate-y-1/2 opacity-40 ${themeText}`} size={16} />
                <input
                  type="text"
                  placeholder="Ex: Pagamento"
                  className={`w-full pl-11 pr-4 py-3 bg-bg-main border border-border-ui rounded-xl text-text-primary font-bold italic outline-none text-sm transition-all ${presetData ? 'opacity-60 cursor-not-allowed' : themeBorder}`}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required readOnly={!!presetData}
                />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest ml-1">Data</label>
              <input
                type="date"
                className={`w-full px-4 py-3 bg-bg-main border border-border-ui rounded-xl text-text-primary text-xs font-black outline-none transition-all ${themeBorder}`}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <button
              type="submit" 
              disabled={loading}
              className={`w-full text-white py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 mt-1 cursor-pointer ${themeBg} ${themeShadow} hover:scale-[1.01] active:scale-95`}
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