import React, { useState, useEffect } from 'react';
import { X, Calendar, FileText, Tag, AlertCircle, ArrowUpCircle, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import api from '../../services/api';
import SelectStyle from '../SelectStyle'; 
import { useAlert } from '../../context/AlertContext'; 

const ModalTransactions = ({ isOpen, onClose, onTransactionAdded, transactionToEdit, presetData }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]); 
  const { showAlert } = useAlert();
  
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animating, setAnimating] = useState(false);

  // 1. PEGA A DATA LOCAL REAL (Hoje no calendário do usuário)
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 2. FORMATA A DATA QUE VEM DO BANCO PARA O INPUT
  const formatDateForInput = (dateValue) => {
    console.log("=== LOG: DATA RECEBIDA (Edit/Props) ===", dateValue);
    if (!dateValue) return getTodayString();

    // Se vier uma string ISO (com T e Z), cortamos apenas a data
    const dateOnly = typeof dateValue === 'string' ? dateValue.split('T')[0] : getTodayString();
    
    console.log("=== LOG: DATA FORMATADA PARA O INPUT ===", dateOnly);
    return dateOnly;
  };

  const initialState = {
    title: '',
    amount: '',
    type: 'saida',
    category: '',
    date: getTodayString(),
    goal: null 
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const timer = setTimeout(() => setAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        const formatted = response.data.map(cat => ({
          label: cat.name,
          value: cat.name,
          _id: cat._id
        }));
        if (presetData && !formatted.find(c => c.value === 'caixinha')) {
          formatted.push({ label: 'Caixinha', value: 'caixinha' });
        }
        setCategories(formatted);
      } catch (err) {
        console.error("Erro ao carregar categorias:", err);
      }
    };
    if (shouldRender) fetchCategories();
  }, [shouldRender, presetData]);

  useEffect(() => {
    if (isOpen) {
      if (transactionToEdit) {
        console.log("=== MODO EDIÇÃO ATIVADO ===");
        setFormData({
          ...transactionToEdit,
          date: formatDateForInput(transactionToEdit.date),
        });
      } else if (presetData) {
        setFormData({
          ...initialState,
          title: presetData.title || '',
          type: presetData.type === 'entrada' ? 'entrada' : 'saida',
          category: 'caixinha',
          date: getTodayString(),
          goal: presetData.goal 
        });
      } else {
        setFormData(initialState);
      }
    }
  }, [transactionToEdit, isOpen, presetData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(formData.amount);

    if (presetData && formData.type === 'entrada') {
        const saldoDisponivel = Number(presetData.currentAmount) || 0;
        if (amountNum > saldoDisponivel) {
            return showAlert(`Operação negada: Saldo insuficiente na caixinha`, "error");
        }
    }

    if (amountNum <= 0) return showAlert("Insira um valor maior que zero.", "error");

    setLoading(true);
    
    // LOG ANTES DE ENVIAR
    console.log("=== LOG: ENVIANDO DADOS PARA API ===");
    console.log("Data Selecionada (formData.date):", formData.date);

    try {
      const dataToSend = { 
        ...formData, 
        amount: amountNum, 
        isPaid: true 
      };
      
      console.log("Payload Final:", dataToSend);

      if (transactionToEdit) {
        await api.put(`/transactions/${transactionToEdit._id}`, dataToSend);
        showAlert("Transação atualizada!", "success");
      } else {
        await api.post('/transactions', dataToSend);
        showAlert(presetData ? "Cofre atualizado!" : "Nova transação registrada!", "success");
      }
      onTransactionAdded(); 
      onClose();
    } catch (err) {
      console.error("Erro na API:", err);
      showAlert(err.response?.data?.message || "Erro ao salvar transação.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-[999] flex items-center justify-center p-4 transition-all duration-400 ease-in-out ${
      animating ? 'bg-black/80 backdrop-blur-md opacity-100' : 'bg-transparent backdrop-blur-none opacity-0'
    }`}>
      
      <div className="absolute inset-0" onClick={onClose} />

      <div 
        className={`relative bg-bg-card w-full max-w-lg rounded-[3.5rem] shadow-2xl border border-border-ui overflow-visible transition-all duration-500 transform ${
          animating ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-20 opacity-0'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        
        <div className="flex justify-between items-center p-8 border-b border-border-ui/50">
          <h2 className="text-2xl font-black text-text-primary tracking-tighter italic uppercase">
            {presetData ? (formData.type === 'saida' ? 'Depositar' : 'Resgatar') : 'Lançamento'} <span className="text-brand">MAX</span>
          </h2>
          <button onClick={onClose} className="p-3 hover:bg-red-500/10 hover:text-red-500 rounded-2xl text-text-secondary transition-all cursor-pointer">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {!presetData && (
            <div className="grid grid-cols-2 gap-3 p-1 bg-bg-main border border-border-ui rounded-[1.8rem]">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'entrada' })}
                className={`flex items-center justify-center gap-2 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                  formData.type === 'entrada' ? 'bg-green-500 text-white italic scale-[1.02]' : 'text-text-secondary'
                }`}
              >
                <ArrowUp size={14} strokeWidth={3} /> Entrada
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'saida' })}
                className={`flex items-center justify-center gap-2 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                  formData.type === 'saida' ? 'bg-red-500 text-white italic scale-[1.02]' : 'text-text-secondary'
                }`}
              >
                <ArrowDown size={14} strokeWidth={3} /> Saída
              </button>
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Valor da Operação</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-brand italic text-lg">R$</span>
                <input
                  type="number" step="0.01" placeholder="0,00"
                  className="w-full pl-16 pr-6 py-6 bg-bg-main border border-border-ui rounded-[2rem] focus:border-brand text-text-primary font-black text-2xl outline-none transition-all"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required autoFocus
                />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Descrição</label>
              <div className="relative">
                <FileText className="absolute left-6 top-1/2 -translate-y-1/2 text-brand opacity-40" size={18} />
                <input
                  type="text"
                  className={`w-full pl-16 pr-6 py-5 bg-bg-main border border-border-ui rounded-[2rem] text-text-primary font-black italic outline-none transition-all ${presetData ? 'opacity-60 cursor-not-allowed' : 'focus:border-brand'}`}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required readOnly={!!presetData}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative z-[60]"> 
                <SelectStyle
                  label="Categoria" icon={Tag} value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  options={categories} required disabled={!!presetData}
                />
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Data</label>
                <div className="relative">
                  <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-brand opacity-40" size={18} />
                  <input
                    type="date"
                    className="w-full pl-16 pr-5 py-5 bg-bg-main border border-border-ui rounded-[2rem] focus:border-brand text-text-primary text-[13px] font-black outline-none transition-all uppercase"
                    value={formData.date}
                    onChange={(e) => {
                      console.log("=== LOG: DATA ALTERADA NO INPUT ===", e.target.value);
                      setFormData({ ...formData, date: e.target.value });
                    }}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-5 rounded-[1.8rem] font-black uppercase text-[10px] text-text-secondary bg-bg-main hover:bg-border-ui transition-all">
              Cancelar
            </button>
            <button
              type="submit" disabled={loading}
              className={`flex-[1.5] text-white py-5 rounded-[1.8rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl transition-all ${
                formData.type === 'entrada' ? 'bg-green-600 shadow-green-600/30' : 'bg-brand shadow-brand/30'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (presetData ? (formData.type === 'entrada' ? 'Confirmar Resgate' : 'Confirmar Depósito') : 'Salvar Registro')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalTransactions;