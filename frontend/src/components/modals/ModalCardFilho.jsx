import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Check } from 'lucide-react';
import api from '@/services/api';
import { useTheme } from "@/components/ThemeContext";

const ModalCardFilho = ({ isOpen, onClose, parentId, categories, onSuccess, editingChild }) => {
  const { isDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // Agora categorias é um array de IDs
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    if (isOpen && editingChild) {
      setName(editingChild.name || '');
      setDescription(editingChild.description || '');
      // Mapeia para pegar apenas os IDs, tratando se vier objeto ou ID puro
      setSelectedCategories(editingChild.category?.map(c => c._id || c) || []);
    } else {
      setName('');
      setDescription('');
      setSelectedCategories([]);
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
      const payload = { name, description, category: selectedCategories };
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
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">
            {editingChild ? 'Editar Item' : 'Novo Item'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <input 
            placeholder="Nome do item" 
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-brand transition-colors text-sm" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
          />
          <input 
            placeholder="Descrição curta" 
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-brand transition-colors text-sm" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
          />
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Categorias</label>
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
                        : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400'
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

          <button 
            type="submit" 
            className="w-full bg-brand p-3.5 rounded-xl font-bold uppercase text-xs text-white hover:opacity-90 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-brand/20"
          >
            {editingChild ? <Save size={16} /> : <Plus size={16} />} 
            {editingChild ? 'Salvar Alterações' : 'Adicionar Item'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModalCardFilho;