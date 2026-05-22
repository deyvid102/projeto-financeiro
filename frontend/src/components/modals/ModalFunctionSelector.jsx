import React, { useState, useEffect } from 'react';
import { X, Target, TrendingUp, Repeat, ShoppingBag, CreditCard, Loader2 } from 'lucide-react';
import api from '@/services/api';

const ModalFunctionSelector = ({ isOpen, onClose, onSelect }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const types = [
    { value: 'goal', label: 'Caixinha', icon: Target, color: 'bg-blue-500/10 text-blue-500' },
    { value: 'investment', label: 'Investimento', icon: TrendingUp, color: 'bg-green-500/10 text-green-500' },
    { value: 'recurrence', label: 'Recorrência', icon: Repeat, color: 'bg-orange-500/10 text-orange-500' },
    { value: 'shoppingcart', label: 'Lista de Desejos', icon: ShoppingBag, color: 'bg-pink-500/10 text-pink-500' },
    { value: 'card', label: 'Cartão', icon: CreditCard, color: 'bg-purple-500/10 text-purple-500' },
  ];

  const fetchItems = async (type) => {
    setLoading(true);
    try {
      let endpoint = '';
      switch (type) {
        case 'goal':
          endpoint = '/goals';
          break;
        case 'investment':
          endpoint = '/investments';
          break;
        case 'recurrence':
          endpoint = '/recurrences';
          break;
        case 'shoppingcart':
          endpoint = '/shopping-cart?itemStatus=pending';
          break;
        case 'card':
          endpoint = '/cards';
          break;
        default:
          endpoint = '';
      }

      if (endpoint) {
        const res = await api.get(endpoint);
        setItems(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Erro ao buscar items:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedType) {
      fetchItems(selectedType);
      setSelectedItem(null);
    }
  }, [selectedType]);

  const getItemLabel = (item, type) => {
    switch (type) {
      case 'goal':
        return `${item.name} (R$ ${item.currentAmount}/${item.targetAmount})`;
      case 'investment':
        return `${item.name} (${item.type}) - R$ ${item.amountInvested}`;
      case 'recurrence':
        return `${item.title} - R$ ${item.amount}`;
      case 'shoppingcart':
        return `${item.itemName} - R$ ${item.estimatedPrice}`;
      case 'card':
        return item.type === 'credito' 
          ? `${item.name} - R$ ${item.usedLimit}/${item.creditLimit}`
          : `${item.name} (VA) - R$ ${item.vaBalance}`;
      default:
        return item.name || item.title;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-bg-card w-full max-w-2xl rounded-3xl border border-border-ui shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 border-b border-border-ui flex justify-between items-center">
          <h2 className="text-lg font-black text-text-primary uppercase tracking-tighter">
            Adicionar Função
          </h2>
          <button onClick={onClose} className="p-2 text-text-secondary hover:bg-bg-main rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Seleção de Tipo */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
              Tipo de Função
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {types.map(type => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      selectedType === type.value
                        ? `${type.color} border-current`
                        : 'border-border-ui hover:border-border-ui text-text-secondary'
                    }`}
                  >
                    <IconComponent size={20} />
                    <span className="text-[9px] font-bold uppercase text-center">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seleção de Item */}
          {selectedType && (
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                Escolher Item
              </label>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-brand" size={24} />
                </div>
              ) : items.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {items.map(item => (
                    <button
                      key={item._id}
                      onClick={() => setSelectedItem(item)}
                      className={`w-full p-3 rounded-xl text-left border-2 transition-all ${
                        selectedItem?._id === item._id
                          ? 'border-brand bg-brand/5 text-text-primary'
                          : 'border-border-ui text-text-secondary hover:border-brand'
                      }`}
                    >
                      <p className="text-[11px] font-bold uppercase">{getItemLabel(item, selectedType)}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-text-secondary opacity-60 py-4">Nenhum item encontrado</p>
              )}
            </div>
          )}

          {/* Botão de Confirmar */}
          <button
            onClick={() => {
              if (selectedItem && selectedType) {
                onSelect({ type: selectedType, item: selectedItem });
                setSelectedType(null);
                setSelectedItem(null);
              }
            }}
            disabled={!selectedItem}
            className="w-full bg-brand text-white p-3.5 rounded-xl font-bold uppercase text-xs hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Confirmar Seleção
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalFunctionSelector;
