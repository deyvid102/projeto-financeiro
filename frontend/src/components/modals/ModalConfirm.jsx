import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ModalConfirm = ({ isOpen, onClose, onConfirm, title, message, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-bg-card w-full max-w-sm rounded-3xl shadow-2xl border border-border-ui overflow-hidden">
        <div className="p-6 text-center">
          <div className="mx-auto w-14 h-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={30} />
          </div>
          
          <h3 className="text-xl font-bold text-text-primary mb-2">{title || "Confirmar Exclusão"}</h3>
          <p className="text-sm text-text-secondary leading-relaxed mb-8">
            {message || "Você tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."}
          </p>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-text-secondary bg-bg-main hover:bg-border-ui transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Excluindo..." : "Excluir"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirm;