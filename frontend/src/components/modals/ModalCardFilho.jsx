import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Check, Zap } from 'lucide-react';
import api from '@/services/api';
import { useTheme } from "@/components/ThemeContext";
import ModalFunctionSelector from './ModalFunctionSelector';
import CardChildFunction from '@/components/CardChildFunction';

const ModalCardFilho = ({ isOpen, onClose, parentId, categories, onSuccess, editingChild }) => {
  const { isDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // Agora categorias é um array de IDs
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [linkedFunction, setLinkedFunction] = useState(null);
  const [isFunctionModalOpen, setIsFunctionModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && editingChild) {
      setName(editingChild.name || '');
      setDescription(editingChild.description || '');
      // Mapeia para pegar apenas os IDs, tratando se vier objeto ou ID puro
      setSelectedCategories(editingChild.category?.map(c => c._id || c) || []);
      setLinkedFunction(editingChild.linkedFunction || null);
    } else {
      setName('');
      setDescription('');
      setSelectedCategories([]);
      setLinkedFunction(null);
    }
  }, [isOpen, editingChild]);

  const toggleCategory = (catId) => {
    setSelectedCategories(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        name, 
        description, 
        category: selectedCategories,
        linkedFunction: linkedFunction ? {
          type: linkedFunction.type,
          referenceId: linkedFunction.item._id
        } : null
      };
      if (editingChild) {
        await api.put(`/strategy/cards/${parentId}/children/${editingChild._id}`, payload);
      } else {
        await api.post(`/strategy/cards/${parentId}/children`, payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert("Erro ao salvar. Verifique a conexão.");
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-bg-card w-full max-w-md rounded-3xl border border-border-ui shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 border-b border-border-ui flex justify-between items-center">
          <h2 className="text-lg font-black text-text-primary uppercase tracking-tighter">
            {editingChild ? 'Editar Item' : 'Novo Item'}
          </h2>
          <button onClick={onClose} className="p-2 text-text-secondary hover:bg-bg-main rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <input 
            placeholder="Nome do item" 
            className="w-full px-4 py-3 bg-bg-main border border-border-ui rounded-xl outline-none focus:border-brand transition-colors text-sm text-text-primary placeholder:text-text-secondary" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
          <input 
            placeholder="Descrição curta" 
            className="w-full px-4 py-3 bg-bg-main border border-border-ui rounded-xl outline-none focus:border-brand transition-colors text-sm text-text-primary placeholder:text-text-secondary" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
          />
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Categorias</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => {
                const isSelected = selectedCategories.includes(cat._id);
                return (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => toggleCategory(cat._id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5
                      ${isSelected 
                        ? 'text-white border-transparent' 
                        : 'bg-transparent border-border-ui text-text-secondary hover:border-brand'
                      }`}
                    style={{ backgroundColor: isSelected ? cat.color : 'transparent' }}
                  >
                    {isSelected && <Check size={12} />}
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção de Função */}
          <div className="border-t border-border-ui pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                <Zap size={12} className="text-brand" /> Função
              </label>
              {linkedFunction && (
                <button
                  type="button"
                  onClick={() => setLinkedFunction(null)}
                  className="text-[9px] font-bold text-red-500 hover:underline"
                >
                  Remover
                </button>
              )}
            </div>

            {linkedFunction ? (
              <div className="space-y-2">
                <CardChildFunction linkedFunction={linkedFunction} />
                <button
                  type="button"
                  onClick={() => setIsFunctionModalOpen(true)}
                  className="w-full text-blue-500 hover:text-brand p-2 rounded-xl transition-all text-[10px] font-bold uppercase border border-blue-500/30 hover:border-brand"
                >
                  Editar Função
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsFunctionModalOpen(true)}
                className="w-full border-2 border-dashed border-border-ui hover:border-brand text-text-secondary hover:text-brand p-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm font-bold"
              >
                <Plus size={16} /> Adicionar Função
              </button>
            )}
          </div>

          <button 
            type="submit" 
            className="w-full bg-brand p-3.5 rounded-xl font-bold uppercase text-xs text-white hover:opacity-90 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-brand/20"
          >
            {editingChild ? <Save size={16} /> : <Plus size={16} />} 
            {editingChild ? 'Salvar Alterações' : 'Adicionar Item'}
          </button>
        </form>
      </div>

      <ModalFunctionSelector 
        isOpen={isFunctionModalOpen}
        onClose={() => setIsFunctionModalOpen(false)}
        onSelect={(selected) => {
          setLinkedFunction(selected);
          setIsFunctionModalOpen(false);
        }}
      />
    </div>
  );
};

export default ModalCardFilho;