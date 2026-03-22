import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = ({ message = "Sincronizando financemax...", minHeight = "60vh" }) => {
  return (
    <div 
      className="flex flex-col items-center justify-center w-full text-brand p-6 transition-all duration-500"
      style={{ minHeight }}
    >
      <div className="relative flex items-center justify-center mb-6">
        {/* Círculo de brilho externo (Glow) */}
        <div className="absolute inset-0 bg-brand/20 blur-2xl rounded-full animate-pulse" />
        
        {/* Ícone principal com animação suave */}
        <Loader2 className="animate-spin relative z-10" size={42} strokeWidth={2.5} />
      </div>

      <div className="space-y-2 text-center relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] italic text-text-primary animate-pulse">
          {message}
        </p>
        <div className="w-12 h-[2px] bg-brand/30 mx-auto rounded-full overflow-hidden">
          <div className="w-full h-full bg-brand animate-[loading-bar_1.5s_infinite_ease-in-out]" />
        </div>
      </div>
    </div>
  );
};

export default LoadingState;