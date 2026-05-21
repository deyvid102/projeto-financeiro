import React, { useState, useEffect } from 'react';
import { X, Tag, Plus, Edit2, Trash2, ArrowLeft, Save, Check } from 'lucide-react';
import api from '@/services/api';
import { useTheme } from "@/components/ThemeContext";
import ModalConfirm from '@/components/modals/ModalConfirm';

const ModalCategoriaStrategy = ({ isOpen, onClose, onSuccess, categories }) => {
  const { isDarkMode } = useTheme();
  
  const [view, setView] = useState('list');
  const [editingCategory, setEditingCategory] = useState(null);
  
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const colorPalette = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#f97316', '#64748b', '#06b6d4', '#8b5cf6'];

  useEffect(() => {
    if (isOpen) setView('list');
  }, [isOpen]);

  const startEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setColor(cat.color);
    setView('form');
  };

  const startCreate = () => {
    setEditingCategory(null);
    setName('');
    setColor('#3b82f6');
    setView('form');
  };

  const openDeleteModal = (id) => {
    setCategoryToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/strategy/categories/${categoryToDelete}`);
      onSuccess();
      setIsConfirmOpen(false);
      setCategoryToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/strategy/categories/${editingCategory._id}`, { name, color });
      } else {
        await api.post('/strategy/categories', { name, color });
      }
      onSuccess();
      setView('list');
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md">
        <div className="absolute inset-0" onClick={onClose} />
        <div className="bg-bg-card w-full max-w-sm rounded-t-[2.5rem] md:rounded-[3rem] border border-border-ui shadow-2xl relative overflow-hidden">
          
          <div className="p-6 border-b border-border-ui/50 flex justify-between items-center">
            <h2 className="text-xl font-black text-text-primary italic uppercase tracking-tighter flex items-center gap-2">
              {view === 'form' ? (editingCategory ? 'Editar' : 'Nova Categoria') : 'Categorias'}
            </h2>
            <button onClick={onClose} className="p-2 text-text-secondary hover:text-text-primary"><X size={20} /></button>
          </div>

          {view === 'list' ? (
            <div className="p-6 flex flex-col gap-3">
              <button onClick={startCreate} className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-border-ui rounded-xl text-xs font-bold uppercase text-text-secondary hover:border-brand hover:text-brand transition-all">
                <Plus size={16} /> Adicionar Categoria
              </button>
              <div className="max-h-[300px] overflow-y-auto flex flex-col gap-2">
                {categories.map(cat => (
                  <div key={cat._id} className="flex items-center justify-between p-3 bg-bg-main rounded-xl border border-border-ui">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm font-bold text-text-primary">{cat.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(cat)} className="p-1.5 hover:bg-black/5 rounded"><Edit2 size={14} /></button>
                      <button onClick={() => openDeleteModal(cat._id)} className="p-1.5 hover:bg-red-500/10 text-red-500 rounded"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <button type="button" onClick={() => setView('list')} className="text-xs text-text-secondary flex items-center gap-1 mb-2 hover:underline">
                <ArrowLeft size={14} /> Voltar
              </button>
              <input 
                placeholder="Nome da categoria..." 
                className="w-full px-5 py-3.5 bg-bg-main border border-border-ui rounded-xl outline-none text-sm font-bold italic text-text-primary focus:border-brand transition-all"
                value={name} onChange={(e) => setName(e.target.value)} required
              />
              
              <div className="flex flex-col gap-2 bg-bg-main p-4 rounded-xl border border-border-ui">
                <label className="text-xs uppercase font-bold text-text-secondary mb-1">Selecione a cor:</label>
                <div className="flex flex-wrap gap-2">
                  {colorPalette.map((c) => (
                    <button
                      key={c} 
                      type="button" 
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-all hover:scale-110 flex items-center justify-center border-2 ${
                        color === c 
                          ? 'border-white ring-2 ring-brand shadow-lg' 
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check size={16} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-brand p-4 rounded-xl font-bold uppercase text-xs text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <Save size={16} /> Salvar Alterações
              </button>
            </form>
          )}
        </div>
      </div>

      <ModalConfirm 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title="Excluir Categoria" 
        message="Tem certeza que deseja deletar esta categoria? Cards usando esta categoria ficarão sem cor."
        variant="danger"
      />
    </>
  );
};

export default ModalCategoriaStrategy;