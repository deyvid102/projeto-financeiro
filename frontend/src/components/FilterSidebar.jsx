import React, { useState, useEffect } from 'react';
import { X, Calendar, Tag, ArrowUpDown, RotateCcw, ChevronDown, CheckCircle2 } from 'lucide-react';

const FilterSidebar = ({ 
  isOpen, 
  onClose, 
  categories, 
  filters, 
  setFilters,
  onApply 
}) => {
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    let timeoutId;
    if (isOpen) {
      setShouldRender(true);
      timeoutId = setTimeout(() => setAnimating(true), 50);
    } else {
      setAnimating(false);
      setIsSelectOpen(false);
      timeoutId = setTimeout(() => setShouldRender(false), 500);
    }
    return () => clearTimeout(timeoutId);
  }, [isOpen]);

  const handleReset = () => {
    setFilters({
      period: 'all',
      category: 'all',
      order: 'date-desc',
      startDate: '',
      endDate: ''
    });
  };

  const getPeriodLabel = (p) => {
    const labels = { 
      all: 'Tudo', 
      today: 'Hoje', 
      week: '7 Dias', 
      month: 'Mês',
      custom: 'Período'
    };
    return labels[p];
  };

  if (!shouldRender) return null;

  return (
    <>
      {/* Overlay - Adaptado para os dois modos */}
      <div 
        className={`fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-sm z-[1000] transition-opacity duration-500 ${
          animating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Sidebar - Usando variáveis do seu @theme */}
      <div 
        className={`fixed right-0 top-0 h-full w-full max-w-[380px] bg-bg-card border-l border-border-ui z-[1001] shadow-2xl flex flex-col transition-all duration-500 transform ${
          animating ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        
        {/* Header */}
        <div className="p-8 border-b border-border-ui bg-bg-card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-text-primary italic uppercase tracking-tighter">
              Filtros <span className="text-brand">MAX</span>
            </h2>
            <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary transition-colors">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
             <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border transition-colors ${filters.period !== 'all' ? 'bg-brand text-white border-brand' : 'bg-bg-main border-border-ui text-text-secondary'}`}>
               {filters.period === 'custom' ? 'Personalizado' : getPeriodLabel(filters.period)}
             </span>
             <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border transition-colors ${filters.category !== 'all' ? 'bg-brand text-white border-brand' : 'bg-bg-main border-border-ui text-text-secondary'}`}>
               {filters.category === 'all' ? 'Categorias' : filters.category}
             </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-bg-main/30">
          
          {/* Janela de Tempo */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black text-brand uppercase tracking-widest">
              <Calendar size={14} /> Janela de Tempo
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['all', 'today', 'week', 'month', 'custom'].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilters({ ...filters, period: p })}
                  className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase border transition-all ${
                    filters.period === p 
                    ? 'bg-brand text-white border-brand shadow-lg' 
                    : 'bg-bg-card border-border-ui text-text-secondary hover:border-brand hover:text-brand'
                  }`}
                >
                  {getPeriodLabel(p)}
                </button>
              ))}
            </div>

            {filters.period === 'custom' && (
              <div className="grid grid-cols-2 gap-3 pt-2 animate-in slide-in-from-top-4 duration-300">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest ml-1">Início</label>
                  <input 
                    type="date" 
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className="w-full bg-bg-card border border-border-ui rounded-xl p-3 text-[10px] font-bold text-text-primary focus:border-brand outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest ml-1">Fim</label>
                  <input 
                    type="date" 
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className="w-full bg-bg-card border border-border-ui rounded-xl p-3 text-[10px] font-bold text-text-primary focus:border-brand outline-none transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Categorias */}
          <div className="space-y-4 relative z-[60]">
            <label className="flex items-center gap-2 text-[10px] font-black text-brand uppercase tracking-widest">
              <Tag size={14} /> Filtrar Categoria
            </label>
            
            <button 
              onClick={() => setIsSelectOpen(!isSelectOpen)}
              className={`w-full flex items-center justify-between p-5 bg-bg-card border rounded-2xl text-[11px] font-bold uppercase transition-all ${
                isSelectOpen ? 'border-brand text-text-primary' : 'border-border-ui text-text-secondary'
              }`}
            >
              <span className="italic">{filters.category === 'all' ? 'Todas as Categorias' : filters.category}</span>
              <ChevronDown size={18} className={`text-brand transition-transform ${isSelectOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSelectOpen && (
              <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-bg-card border border-border-ui rounded-2xl shadow-2xl z-[100] overflow-hidden">
                <div className="max-h-[200px] overflow-y-auto">
                  {categories.map(cat => (
                    <button 
                      key={cat.value}
                      onClick={() => { setFilters({...filters, category: cat.value}); setIsSelectOpen(false); }}
                      className={`w-full text-left px-6 py-4 text-[10px] font-black uppercase flex items-center justify-between transition-colors ${
                        filters.category === cat.value ? 'bg-brand text-white' : 'text-text-secondary hover:bg-bg-main hover:text-text-primary'
                      }`}
                    >
                      {cat.label}
                      {filters.category === cat.value && <CheckCircle2 size={14} />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hierarquia (Ordenação) */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black text-brand uppercase tracking-widest">
              <ArrowUpDown size={14} /> Hierarquia de Dados
            </label>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Mais Recentes', value: 'date-desc' },
                { label: 'Mais Antigos', value: 'date-asc' },
                { label: 'Maior Valor', value: 'amount-desc' },
                { label: 'Menor Valor', value: 'amount-asc' }
              ].map((o) => (
                <button
                  key={o.value}
                  onClick={() => setFilters({ ...filters, order: o.value })}
                  className={`w-full px-6 py-4 rounded-2xl text-[10px] font-black uppercase border transition-all flex justify-between items-center ${
                    filters.order === o.value 
                    ? 'bg-text-primary text-bg-card border-text-primary' 
                    : 'bg-bg-card border-border-ui text-text-secondary hover:border-brand/50'
                  }`}
                >
                  <span className="italic">{o.label}</span>
                  <div className={`w-2 h-2 rounded-full transition-all ${filters.order === o.value ? 'bg-brand shadow-[0_0_8px_#00d1ff]' : 'bg-border-ui'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-border-ui bg-bg-card">
          <button 
            onClick={() => { onApply(); onClose(); }}
            className="w-full py-5 bg-brand text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all"
          >
            Aplicar Configurações
          </button>
          <button 
            onClick={handleReset}
            className="w-full mt-4 py-2 text-text-secondary hover:text-red-500 font-black uppercase text-[9px] tracking-widest transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} /> Limpar Tudo
          </button>
        </div>
      </div>
    </>
  );
};

export default FilterSidebar;