import React, { useState, useEffect } from 'react';
import { X, Target, Check, Loader2, PiggyBank, Palette } from 'lucide-react';
import api from '../../services/api';
import { useAlert } from '../../context/AlertContext';
import SelectStyle from '../SelectStyle';

const ModalGoal = ({ isOpen, onClose, onRefresh }) => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  // LOGICA DE ANIMAÇÃO
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animating, setAnimating] = useState(false);

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
    category: 'outros',
    targetAmount: '',
    color: '#06b6d4',
    icon: 'PiggyBank'
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    let timeoutId;
    if (isOpen) {
      setShouldRender(true);
      timeoutId = setTimeout(() => setAnimating(true), 50);
    } else {
      setAnimating(false);
      timeoutId = setTimeout(() => {
        setShouldRender(false);
        setFormData(initialState); // Reseta o form ao terminar de fechar
      }, 400);
    }
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/goals', {
        ...formData,
        targetAmount: Number(formData.targetAmount),
      });
      showAlert('Cofre configurado com sucesso!', 'success');
      onRefresh();
      onClose();
    } catch (err) {
      showAlert('Erro ao criar caixinha', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-400 ease-in-out ${
        animating ? 'bg-black/80 backdrop-blur-md opacity-100' : 'bg-transparent backdrop-blur-none opacity-0 pointer-events-none'
      }`}
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div 
        className={`bg-bg-card w-full max-w-md rounded-[3rem] border border-border-ui shadow-2xl relative overflow-visible transition-all duration-500 transform ${
          animating 
            ? 'scale-100 translate-y-0 opacity-100' 
            : 'scale-90 translate-y-12 opacity-0'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        
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
                value={formData.category}
                options={categories}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
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
            <div className="flex justify-between items-center p-5 bg-bg-main rounded-[2rem] border border-border-ui shadow-inner">
              <div className="flex gap-2.5">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFormData({...formData, color: c.value})}
                    className={`w-7 h-7 rounded-full transition-all hover:scale-125 cursor-pointer ${formData.color === c.value ? 'ring-4 ring-brand/20 scale-110 shadow-lg' : 'opacity-40 hover:opacity-100'}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
              <div className="p-3 bg-bg-card rounded-2xl border border-border-ui">
                <PiggyBank size={20} style={{ color: formData.color }} strokeWidth={2.5} className="transition-colors duration-500" />
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