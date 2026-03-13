import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, Tag } from 'lucide-react';
import api from '../../services/api';
import SelectStyle from '../SelectStyle'; 
import { useAlert } from '../../context/AlertContext'; 

const ModalTransactions = ({ isOpen, onClose, onTransactionAdded, transactionToEdit }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]); 
  const { showAlert } = useAlert();
  
  const initialState = {
    title: '',
    amount: '',
    type: 'saida',
    category: '',
    date: new Date().toISOString().split('T')[0],
  };

  const [formData, setFormData] = useState(initialState);

  // 1. Busca categorias do backend ao abrir o modal
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        // Transformamos os dados para o formato que o SelectStyle espera
        const formatted = response.data.map(cat => ({
          label: cat.name,
          value: cat.name, // Usando o nome como valor para salvar na transação
          _id: cat._id
        }));
        setCategories(formatted);
      } catch (err) {
        console.error("Erro ao carregar categorias:", err);
        showAlert("Erro ao carregar categorias.", "error");
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, showAlert]);

  // 2. Preenchimento Automático (Edição vs Nova)
  useEffect(() => {
    if (transactionToEdit && isOpen) {
      setFormData({
        title: transactionToEdit.title || '',
        amount: transactionToEdit.amount || '',
        type: transactionToEdit.type || 'saida',
        category: transactionToEdit.category || '',
        date: transactionToEdit.date ? new Date(transactionToEdit.date).toISOString().split('T')[0] : initialState.date,
      });
    } else {
      setFormData(initialState);
    }
  }, [transactionToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSend = { 
        ...formData, 
        amount: Number(formData.amount),
        isPaid: true 
      };
      
      if (transactionToEdit) {
        await api.put(`/transactions/${transactionToEdit._id}`, dataToSend);
        showAlert("Transação atualizada com sucesso!", "success");
      } else {
        await api.post('/transactions', dataToSend);
        showAlert("Nova transação registrada!", "success");
      }
      
      onTransactionAdded(); 
      onClose();
    } catch (err) {
      console.error("Erro ao salvar:", err);
      showAlert("Falha ao salvar transação.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-bg-card w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-border-ui overflow-hidden font-sans animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border-ui/50">
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight">
            {transactionToEdit ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-bg-main rounded-xl text-text-secondary transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Seletor de Tipo (Botões customizados) */}
          <div className="flex bg-bg-main p-1.5 rounded-2xl border border-border-ui/50">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'entrada' })}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all ${formData.type === 'entrada' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'text-text-secondary opacity-60'}`}
            >
              <DollarSign size={14} /> ENTRADA
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'saida' })}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all ${formData.type === 'saida' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-text-secondary opacity-60'}`}
            >
              <DollarSign size={14} /> SAÍDA
            </button>
          </div>

          <div className="space-y-4">
            {/* Campo Valor */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Valor</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-text-secondary opacity-40 text-sm group-focus-within:text-brand group-focus-within:opacity-100 transition-all">R$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  className="w-full pl-12 pr-4 py-4 bg-bg-main/50 border border-border-ui/50 rounded-2xl focus:border-brand text-text-primary font-bold text-lg outline-none transition-all focus:ring-4 focus:ring-brand/5"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Campo Título */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Título</label>
              <div className="relative group">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-30 group-focus-within:text-brand group-focus-within:opacity-100 transition-all" size={18} />
                <input
                  type="text"
                  placeholder="Ex: Supermercado, Aluguel..."
                  className="w-full pl-12 pr-4 py-4 bg-bg-main/50 border border-border-ui/50 rounded-2xl focus:border-brand text-text-primary font-medium outline-none transition-all focus:ring-4 focus:ring-brand/5"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Uso do SelectStyle para Categoria */}
              <SelectStyle
                label="Categoria"
                icon={Tag}
                placeholder="Selecione..."
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                options={categories} 
                required
              />

              {/* Campo Data */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-1">Data</label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-30 group-focus-within:text-brand group-focus-within:opacity-100 transition-all" size={18} />
                  <input
                    type="date"
                    className="w-full pl-12 pr-4 py-4 bg-bg-main/50 border border-border-ui/50 rounded-2xl focus:border-brand text-text-primary text-sm font-medium outline-none transition-all focus:ring-4 focus:ring-brand/5"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-4 rounded-2xl font-bold text-text-secondary bg-bg-main hover:bg-border-ui transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[1.5] bg-brand text-white py-4 rounded-2xl font-bold hover:opacity-90 shadow-xl shadow-brand/20 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {loading ? 'Processando...' : transactionToEdit ? 'Salvar Alterações' : 'Confirmar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalTransactions;