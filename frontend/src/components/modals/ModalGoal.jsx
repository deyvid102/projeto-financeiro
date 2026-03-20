import React, { useState, useEffect } from 'react';
import { X, Target, Check, Loader2, PiggyBank, Palette } from 'lucide-react';
import api from '@/services/api';
import { useAlert } from '../../context/AlertContext';
import SelectStyle from '../SelectStyle';

const ModalGoal = ({ isOpen, onClose, onRefresh }) => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  const categories = [
    { name: 'Emergência', value: 'emergencia' },
    { name: 'Carro', value: 'carro' },
    { name: 'Viagem', value: 'viagem' },
    { name: 'Casa', value: 'casa' },
    { name: 'Educação', value: 'educacao' },
    { name: 'Lazer', value: 'lazer' },
    { name: 'Outros', value: 'outros' }
  ];

  const colors = [
    { name: 'Ciano', value: '#06b6d4' },
    { name: 'Verde', value: '#10b981' },
    { name: 'Roxo', value: '#8b5cf6' },
    { name: 'Laranja', value: '#f59e0b' },
    { name: 'Rosa', value: '#ec4899' },
    { name: 'Vermelho', value: '#ef4444' }
  ];

  const initialState = {
    name: '',
    categoryGoal: 'outros',
    targetAmount: '',
    color: '#06b6d4', // Cor inicial
    icon: 'PiggyBank'
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialState);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Garantindo que todos os campos, incluindo a cor selecionada, sejam enviados
      const payload = {
        name: formData.name,
        categoryGoal: formData.categoryGoal,
        targetAmount: Number(formData.targetAmount),
        color: formData.color, // A cor selecionada no estado
        icon: formData.icon
      };

      await api.post('/goals', payload);
      
      showAlert('Cofre configurado com sucesso!', 'success');
      onRefresh();
      onClose();
    } catch (err) {
      console.error("Erro ao salvar:", err);
      showAlert('Erro ao criar caixinha', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-bg-card w-full max-w-md rounded-[3rem] border border-border-ui shadow-2xl relative overflow-visible">
        
        <div className="flex justify-between items-center p-8 border-b border-border-ui/50">
          <div className="text-left">
            <h2 className="text-2xl font-black text-text-primary italic uppercase tracking-tighter">
              Novo Cofre <span className="text-brand">MAX</span>
            </h2>
            <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.2em] mt-1 opacity-60">Configuração de Objetivo</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all text-text-secondary cursor-pointer">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-visible">
          
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1 block">Nome do Objetivo</label>
            <div className="relative group">
              <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-brand" size={18} />
              <input 
                required type="text" value={formData.name} placeholder="Ex: Viagem Japão"
                className="w-full bg-bg-main border border-border-ui rounded-2xl py-4 pl-12 pr-4 text-sm font-bold italic outline-none focus:border-brand transition-all text-text-primary shadow-inner"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 overflow-visible">
            <div className="relative z-50">
              <SelectStyle 
                label="Categoria"
                value={formData.categoryGoal}
                options={categories}
                onChange={(e) => setFormData({...formData, categoryGoal: e.target.value})}
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary ml-1 block">Meta (R$)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-brand italic">R$</span>
                <input 
                  required type="number" step="0.01" value={formData.targetAmount}
                  className="w-full bg-bg-main border border-border-ui rounded-2xl py-4 pl-10 pr-4 text-sm font-black italic outline-none focus:border-brand transition-all text-text-primary shadow-inner"
                  onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 text-left">
            <div className="flex items-center gap-2 ml-1">
              <Palette size={14} className="text-brand" />
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary block">Identidade Visual</label>
            </div>
            {/* Seletor de Cores */}
            <div className="flex justify-between items-center p-5 bg-bg-main rounded-[2rem] border border-border-ui shadow-inner">
              <div className="flex gap-2.5">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFormData({...formData, color: c.value})}
                    className={`w-7 h-7 rounded-full transition-all hover:scale-125 cursor-pointer ${
                      formData.color === c.value 
                        ? 'ring-4 ring-white/20 scale-110 shadow-lg border-2 border-white' 
                        : 'opacity-40 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
              <div className="p-3 bg-bg-card rounded-2xl border border-border-ui">
                <PiggyBank size={20} style={{ color: formData.color }} strokeWidth={2.5} className="transition-colors duration-200" />
              </div>
            </div>
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full bg-brand text-white py-5 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-brand/20 hover:shadow-brand/40 transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} strokeWidth={3} /> : <><Check size={18} strokeWidth={3} /> Ativar Caixinha</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModalGoal;