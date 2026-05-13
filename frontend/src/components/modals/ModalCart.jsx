import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, ShoppingCart as CartIcon, Loader2, Edit2, Check, Tag, CreditCard } from 'lucide-react';
import api from '@/services/api';
import { useAlert } from '@/context/AlertContext';
import SelectStyle from '@/components/SelectStyle';
import ModalConfirm from './ModalConfirm';

const ModalCart = ({ isOpen, onClose }) => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { showAlert } = useAlert();

  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [confirmTransaction, setConfirmTransaction] = useState({ open: false, item: null });
  const [loadingAction, setLoadingAction] = useState(false);

  const initialForm = { itemName: '', category: '', estimatedPrice: '', notes: '' };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (isOpen) {
      fetchCart();
      fetchCategories();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.map(cat => ({ label: cat.name, value: cat.name, color: cat.color })));
    } catch (err) { console.error("Erro categorias:", err); }
  };

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cart');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) { showAlert("Erro ao carregar lista", "error"); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        const res = await api.put(`/cart/${editingId}`, formData);
        setItems(items.map(item => item._id === editingId ? res.data : item));
        showAlert("Desejo atualizado!", "success");
      } else {
        const res = await api.post('/cart', formData);
        setItems([res.data, ...items]);
        showAlert("Adicionado à Wishlist!", "success");
      }
      handleCancelEdit();
    } catch (err) { showAlert("Erro ao processar", "error"); }
    finally { setIsSubmitting(false); }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(initialForm);
  };

  const handleDeleteConfirm = async () => {
    setLoadingAction(true);
    try {
      await api.delete(`/cart/${confirmDelete.id}`);
      setItems(items.filter(item => item._id !== confirmDelete.id));
      showAlert("Item removido", "success");
      setConfirmDelete({ open: false, id: null });
    } catch (err) { showAlert("Erro ao remover", "error"); }
    finally { setLoadingAction(false); }
  };

  const handleConvertToTransaction = async () => {
    setLoadingAction(true);
    const item = confirmTransaction.item;
    try {
      await api.post('/transactions', {
        title: `Wishlist: ${item.itemName}`,
        amount: Number(item.estimatedPrice),
        type: 'saida',
        category: item.category,
        date: new Date(),
        transactionOrigin: 'manual'
      });
      await api.delete(`/cart/${item._id}`);
      setItems(items.filter(i => i._id !== item._id));
      showAlert("Compra registrada com sucesso!", "success");
      setConfirmTransaction({ open: false, item: null });
    } catch (err) { showAlert("Erro ao registrar transação", "error"); }
    finally { setLoadingAction(false); }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-portal-container">
      {/* 
          MODAL CART PRINCIPAL
          z-index menor (8000) e relative para criar contexto próprio 
      */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ zIndex: 8000 }}>
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
        
        <div className="relative bg-bg-card w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] border-t border-border-ui overflow-hidden animate-in slide-in-from-bottom duration-300">
          <div className="p-5 border-b border-border-ui/50 flex justify-between items-center bg-bg-main/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand/10 rounded-xl text-brand">
                <CartIcon size={20} />
              </div>
              <h2 className="text-[12px] font-black uppercase tracking-widest text-text-primary italic">
                Wishlist <span className="text-brand">MAX</span>
              </h2>
            </div>
            <button onClick={onClose} className="p-2 text-text-secondary hover:text-white transition-colors">
              <X size={24} strokeWidth={3} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-text-secondary uppercase ml-1">O que deseja?</label>
                <input 
                  type="text" required
                  className="w-full bg-bg-main border border-border-ui rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-brand"
                  value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})}
                />
              </div>
              <div className="relative z-[8001]">
                <SelectStyle
                  label="Categoria"
                  icon={Tag}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  options={categories}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-[9px] font-black text-text-secondary uppercase ml-1">Preço Est.</label>
                <input 
                  type="number" step="0.01" required
                  className="w-full bg-bg-main border border-border-ui rounded-xl px-4 py-3 text-sm text-brand font-black outline-none"
                  value={formData.estimatedPrice} onChange={e => setFormData({...formData, estimatedPrice: e.target.value})}
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`px-6 h-[48px] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${editingId ? 'bg-green-600' : 'bg-brand'} text-white active:scale-95 transition-all min-w-[120px]`}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (editingId ? 'Salvar' : 'Adicionar')}
              </button>
            </div>
          </form>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-bg-main/10 pb-[env(safe-area-inset-bottom)]">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-brand" /></div>
            ) : (
              items.map(item => (
                <div key={item._id} className="flex justify-between items-center p-4 bg-bg-card rounded-2xl border border-border-ui/30">
                  <div className="flex-1 text-left">
                    <p className="text-sm font-black text-text-primary uppercase tracking-tight">{item.itemName}</p>
                    <p className="text-xs text-brand font-black italic mt-0.5">
                      R$ {Number(item.estimatedPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setConfirmTransaction({ open: true, item })} className="p-2.5 text-text-secondary hover:text-green-500 bg-bg-main/50 rounded-xl">
                      <CreditCard size={18}/>
                    </button>
                    <button onClick={() => {setEditingId(item._id); setFormData(item)}} className="p-2.5 text-text-secondary hover:text-brand bg-bg-main/50 rounded-xl">
                      <Edit2 size={18}/>
                    </button>
                    <button onClick={() => setConfirmDelete({ open: true, id: item._id })} className="p-2.5 text-text-secondary hover:text-red-500 bg-bg-main/50 rounded-xl">
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 
          ZONA DE CONFIRMAÇÃO (LAYER SUPREMA)
          Envolvido em uma div com z-index manual forçado para garantir que 
          fique à frente do ModalCart injetado no Portal.
      */}
      {(confirmDelete.open || confirmTransaction.open) && (
        <div className="confirm-overlay-wrapper" style={{ position: 'relative', zIndex: 10000 }}>
          <ModalConfirm 
            isOpen={confirmDelete.open}
            onClose={() => setConfirmDelete({ open: false, id: null })}
            onConfirm={handleDeleteConfirm}
            loading={loadingAction}
            title="Remover Desejo"
            message="Deseja mesmo retirar este item da sua lista?"
            variant="danger"
          />

          <ModalConfirm 
            isOpen={confirmTransaction.open}
            onClose={() => setConfirmTransaction({ open: false, item: null })}
            onConfirm={handleConvertToTransaction}
            loading={loadingAction}
            title="Efetuar Compra"
            message={`Deseja registrar a compra de "${confirmTransaction.item?.itemName}" como uma transação de saída?`}
            variant="success"
          />
        </div>
      )}
    </div>,
    document.body
  );
};

export default ModalCart;