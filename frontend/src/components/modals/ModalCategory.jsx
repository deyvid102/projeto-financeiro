import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Loader2, Edit2, Check, X, RotateCcw } from "lucide-react";
import api from '@/services/api';
import { useAlert } from "../../context/AlertContext";
import ModalConfirm from "../modals/ModalConfirm";

const ModalCategory = ({ isOpen, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState(''); // Único input para Adicionar e Editar
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // Define se estamos editando ou adicionando

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  
  const { showAlert } = useAlert();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      showAlert("Erro ao buscar categorias", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchCategories();
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    try {
      if (editingId) {
        // Lógica de Atualização
        await api.put(`/categories/${editingId}`, { name: categoryName });
        showAlert("Atualizada com sucesso!", "success");
      } else {
        // Lógica de Adição
        await api.post('/categories', { name: categoryName });
        showAlert("Adicionada!", "success");
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      showAlert("Erro na operação", "error");
    }
  };

  const resetForm = () => {
    setCategoryName('');
    setEditingId(null);
  };

  const startEdit = (cat) => {
    setEditingId(cat._id);
    setCategoryName(cat.name);
    // No mobile, foca no input automaticamente ao clicar em editar
    document.getElementById('category-input').focus();
  };

  const triggerDelete = (cat) => {
    setCategoryToDelete(cat);
    setIsConfirmOpen(true);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Z-INDEX 1000 */}
      <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-md">
        <div className="absolute inset-0" onClick={onClose} />

        <div className="bg-bg-card w-full max-w-lg rounded-t-[2.5rem] md:rounded-[3rem] border border-border-ui shadow-2xl relative overflow-hidden">
          
          <div className="p-6 border-b border-border-ui/50 flex justify-between items-center">
             <h2 className="text-xl font-black text-text-primary italic uppercase tracking-tighter">
               {editingId ? 'Editando' : 'Categorias'} <span className="text-brand">MAX</span>
             </h2>
             <button onClick={onClose} className="p-2 text-text-secondary"><X size={20} /></button>
          </div>

          <div className="p-6">
            {/* INPUT PRINCIPAL: Agora serve para ambos */}
            <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <input 
                  id="category-input"
                  type="text" 
                  placeholder="Nome da categoria..."
                  className={`w-full px-5 py-3.5 bg-bg-main border ${editingId ? 'border-brand shadow-[0_0_15px_rgba(var(--brand-rgb),0.2)]' : 'border-border-ui'} rounded-xl outline-none text-sm font-bold italic text-text-primary transition-all`}
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
                {editingId && (
                  <button 
                    type="button" 
                    onClick={resetForm}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-red-500"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
              </div>
              <button type="submit" className={`px-5 py-3.5 rounded-xl text-white transition-all ${editingId ? 'bg-emerald-500' : 'bg-brand'}`}>
                {editingId ? <Check size={22} /> : <Plus size={22} />}
              </button>
            </form>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-brand" /></div>
              ) : (
                categories.map(cat => (
                  <div key={cat._id} className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${editingId === cat._id ? 'bg-brand/10 border-brand/50 scale-[0.98]' : 'bg-bg-main/40 border-border-ui/40'}`}>
                    <span className="text-xs font-black text-text-primary uppercase italic">{cat.name}</span>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => startEdit(cat)} className="p-2 text-text-secondary hover:text-brand"><Edit2 size={16} /></button>
                      <button onClick={() => triggerDelete(cat)} className="p-2 text-text-secondary hover:text-red-500"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <ModalConfirm
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={async () => {
          try {
            await api.delete(`/categories/${categoryToDelete._id}`);
            setCategories(categories.filter(c => c._id !== categoryToDelete._id));
            showAlert("Removida!", "success");
          } catch (err) { showAlert("Erro ao deletar", "error"); }
          setIsConfirmOpen(false);
        }}
        title="Excluir"
        message={`Apagar "${categoryToDelete?.name}"?`}
      />
    </>
  );
};

export default ModalCategory;