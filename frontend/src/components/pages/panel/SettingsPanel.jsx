import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Loader2 } from 'lucide-react';
import api from '../../../services/api';

const SettingsPanel = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      console.error("Erro ao buscar categorias");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory) return;
    try {
      await api.post('/categories', { name: newCategory });
      setNewCategory('');
      fetchCategories();
    } catch (err) {
      alert("Erro ao adicionar categoria");
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  return (
    <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4">
      <h1 className="text-2xl font-extrabold text-text-primary mb-2">Configurações</h1>
      <p className="text-sm text-text-secondary mb-8">Gerencie suas categorias e preferências.</p>

      <div className="bg-bg-card border border-border-ui rounded-3xl p-8 shadow-sm">
        <h3 className="flex items-center gap-2 font-bold text-text-primary mb-6">
          <Tag size={20} className="text-brand" />
          Minhas Categorias
        </h3>

        <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
          <input 
            type="text" 
            placeholder="Ex: Assinaturas, Mercado..."
            className="flex-1 px-4 py-3 bg-bg-main border border-border-ui rounded-xl outline-none focus:border-brand text-sm"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button type="submit" className="bg-brand text-white p-3 rounded-xl hover:opacity-90 transition-all">
            <Plus size={20} />
          </button>
        </form>

        <div className="space-y-2">
          {loading ? <Loader2 className="animate-spin mx-auto text-brand" /> : 
            categories.map(cat => (
              <div key={cat._id} className="flex justify-between items-center p-4 bg-bg-main rounded-2xl border border-border-ui/50">
                <span className="text-sm font-semibold text-text-primary">{cat.name}</span>
                <button className="text-text-secondary hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;