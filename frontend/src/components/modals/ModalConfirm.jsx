import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const ModalConfirm = ({ isOpen, onClose, onConfirm, title, message, loading, variant = 'danger' }) => {
  
  // Configuração dinâmica de cores e ícones
  const isSuccess = variant === 'success';
  const isWarning = variant === 'warning';
  
  const styles = {
    iconBg: isSuccess 
      ? 'bg-green-500/10 text-green-500' 
      : isWarning ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500',
    btnConfirm: isSuccess 
      ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20' 
      : isWarning ? 'bg-yellow-600 hover:bg-yellow-700 shadow-yellow-600/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
    icon: isSuccess 
      ? <CheckCircle2 size={30} strokeWidth={2.5} /> 
      : <AlertCircle size={30} strokeWidth={2.5} />
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-bg-card w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-border-ui overflow-hidden relative">
        <div className="p-8 text-center">
          
          {/* Ícone Dinâmico */}
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5 ${styles.iconBg}`}>
            {styles.icon}
          </div>
          
          <h3 className="text-xl font-black text-text-primary mb-2 uppercase italic tracking-tighter">
            {title}
          </h3>
          <p className="text-xs font-bold text-text-secondary leading-relaxed mb-8 opacity-80 uppercase tracking-wide">
            {message}
          </p>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] text-text-secondary bg-bg-main hover:bg-border-ui transition-all cursor-pointer active:scale-95"
            >
              Cancelar
            </button>
            <button 
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] text-white shadow-lg transition-all cursor-pointer disabled:opacity-50 active:scale-95 ${styles.btnConfirm}`}
            >
              {loading ? "Aguarde..." : (isSuccess ? "Confirmar" : isWarning ? "Confirmar" : "Excluir")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirm;