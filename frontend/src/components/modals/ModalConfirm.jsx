import React from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const ModalConfirm = ({ isOpen, onClose, onConfirm, title, message, loading, variant = 'danger' }) => {
  
  if (!isOpen) return null;

  // Configuração dinâmica de cores e ícones
  const isSuccess = variant === 'success';
  const isWarning = variant === 'warning';
  
  const styles = {
    // Cores de Fundo do Ícone
    iconBg: isSuccess 
      ? 'bg-green-500/10 text-green-500' 
      : isWarning ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500',
    
    // Cores do Botão de Confirmação
    btnConfirm: isSuccess 
      ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20' 
      : isWarning ? 'bg-yellow-600 hover:bg-yellow-700 shadow-yellow-600/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
    
    // Ícones Dinâmicos
    icon: isSuccess 
      ? <CheckCircle2 size={32} strokeWidth={2.5} /> 
      : <AlertCircle size={32} strokeWidth={2.5} />
  };

  return (
    /* Z-INDEX AJUSTADO: 1100 para sobrepor o ModalCategory (1000) */
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-bg-card w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-border-ui overflow-hidden relative animate-in zoom-in-95 duration-200">
        <div className="p-8 text-center">
          
          {/* Ícone Dinâmico com Animação sutil se estiver em perigo */}
          <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${styles.iconBg} ${!isSuccess && 'animate-pulse'}`}>
            {styles.icon}
          </div>
          
          <h3 className="text-xl font-black text-text-primary mb-2 uppercase italic tracking-tighter leading-tight">
            {title}
          </h3>
          <p className="text-[10px] font-black text-text-secondary leading-relaxed mb-8 opacity-60 uppercase tracking-[0.15em] px-4">
            {message}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={onClose}
              disabled={loading}
              className="flex-1 order-2 sm:order-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-text-secondary bg-bg-main hover:bg-border-ui transition-all cursor-pointer active:scale-95 disabled:opacity-30"
            >
              Cancelar
            </button>
            <button 
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 order-1 sm:order-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-white shadow-lg transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2 ${styles.btnConfirm}`}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                isSuccess ? "Confirmar" : isWarning ? "Confirmar" : "Excluir"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirm;