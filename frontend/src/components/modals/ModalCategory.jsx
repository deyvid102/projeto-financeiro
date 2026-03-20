import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Loader2, Edit2, Check, X } from "lucide-react";
import api from "../../services/api"; 
import { useAlert } from "../../context/AlertContext";

const ModalCategory = ({ isOpen, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Estados para Edição
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  
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

  // Carrega os dados e limpa estados internos ao abrir/fechar
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    } else {
      setEditingId(null);
      setEditName('');
      setNewCategory('');
    }
  }, [isOpen]);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await api.post('/categories', { name: newCategory });
      setNewCategory('');
      fetchCategories();
      showAlert("Categoria adicionada!", "success");
    } catch (err) {
      showAlert("Erro ao adicionar categoria", "error");
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      setCategories(categories.filter(cat => cat._id !== id));
      showAlert("Categoria removida", "success");
    } catch (err) {
      showAlert("Erro ao excluir. Verifique se há transações vinculadas.", "error");
    }
  };

  const handleUpdateCategory = async (id) => {
    if (!editName.trim()) return setEditingId(null);
    try {
      await api.put(`/categories/${id}`, { name: editName });
      setEditingId(null);
      fetchCategories();
      showAlert("Categoria atualizada!", "success");
    } catch (err) {
      showAlert("Erro ao atualizar categoria", "error");
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat._id);
    setEditName(cat.name);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-bg-card w-full max-w-lg rounded-[3rem] border border-border-ui shadow-2xl relative overflow-hidden">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-8 border-b border-border-ui/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand/10 rounded-2xl text-brand">
              <Tag size={22} strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-black text-text-primary italic uppercase tracking-tighter">
                Categorias <span className="text-brand">MAX</span>
              </h2>
              <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.2em] mt-1 opacity-60">Personalização de Sistema</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all text-text-secondary cursor-pointer">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="p-8">
          {/* INPUT PARA ADICIONAR */}
          <form onSubmit={handleAddCategory} className="flex gap-3 mb-8">
            <input 
              type="text" 
              placeholder="Nova categoria..."
              className="flex-1 px-6 py-4 bg-bg-main border border-border-ui rounded-2xl outline-none focus:border-brand text-sm font-bold italic transition-all text-text-primary placeholder:opacity-30 shadow-inner"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button type="submit" className="bg-brand text-white p-4 rounded-2xl hover:shadow-xl hover:shadow-brand/40 transition-all active:scale-90 cursor-pointer">
              <Plus size={24} strokeWidth={4} />
            </button>
          </form>

          {/* LISTA DE CATEGORIAS */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand" size={32} strokeWidth={3} /></div>
            ) : (
              categories.map(cat => (
                <div key={cat._id} className="group flex justify-between items-center p-5 bg-bg-main/40 hover:bg-bg-main rounded-[2rem] border border-border-ui/50 transition-all hover:border-brand/30">
                  
                  {editingId === cat._id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input 
                        autoFocus
                        className="flex-1 bg-bg-card border-2 border-brand px-4 py-2 rounded-xl text-sm font-black text-text-primary outline-none italic"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory(cat._id)}
                      />
                      <button onClick={() => handleUpdateCategory(cat._id)} className="text-green-500 p-2 hover:bg-green-500/10 rounded-xl transition-colors">
                        <Check size={20} strokeWidth={3} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-red-500 p-2 hover:bg-red-500/10 rounded-xl transition-colors">
                        <X size={20} strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-black text-text-primary ml-2 uppercase tracking-tight italic group-hover:text-brand transition-colors">
                        {cat.name}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <button 
                          onClick={() => startEdit(cat)}
                          className="p-2.5 text-text-secondary hover:text-brand hover:bg-brand/10 rounded-xl transition-all"
                        >
                          <Edit2 size={16} strokeWidth={2.5} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(cat._id)}
                          className="p-2.5 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
            
            {!loading && categories.length === 0 && (
              <div className="py-10 text-center text-text-secondary opacity-40 italic text-xs font-black uppercase tracking-[0.2em]">
                Nenhuma categoria ativa
              </div>
            )}
          </div>
        </div>

        {/* RODAPÉ */}
        <div className="p-6 bg-bg-main/30 border-t border-border-ui/50 text-center">
          <button 
            onClick={onClose}
            className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary hover:text-brand transition-all cursor-pointer opacity-50 hover:opacity-100"
          >
            Sair do Gerenciador
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalCategory;