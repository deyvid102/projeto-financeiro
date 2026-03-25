import React, { useState, useEffect } from 'react';
import { Lock, Delete, Hash } from 'lucide-react';

const PinLock = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const usePin = localStorage.getItem('usePin') === 'true';
    const savedPin = localStorage.getItem('appPin');
    
    if (usePin && savedPin) {
      setIsLocked(true);
    }
  }, []);

  const handleNumberClick = (num) => {
    if (pinInput.length < 4) {
      const newPin = pinInput + num;
      setPinInput(newPin);
      setError(false);

      if (newPin.length === 4) {
        const savedPin = localStorage.getItem('appPin');
        if (newPin === savedPin) {
          setIsLocked(false);
        } else {
          setError(true);
          setTimeout(() => setPinInput(''), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPinInput(pinInput.slice(0, -1));
    setError(false);
  };

  if (!isLocked) return children;

  return (
    // Troquei text-white por text-text-primary para respeitar o tema
    <div className="fixed inset-0 z-[99999] bg-bg-main flex flex-col items-center justify-center p-6 text-text-primary font-sans overflow-hidden transition-colors duration-300">
      
      {/* Background Decorativo - Opacidade ajustada para não sumir no claro */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-xs flex flex-col items-center">
        {/* Header */}
        <div className="mb-12 text-center space-y-2">
          <div className={`w-16 h-16 bg-bg-card border ${error ? 'border-red-500 animate-shake' : 'border-border-ui'} rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl transition-all`}>
            <Lock className={error ? 'text-red-500' : 'text-brand'} size={28} />
          </div>
          <h2 className="text-xl font-black italic uppercase tracking-tighter">
            Finance<span className="text-brand">MAX</span>
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-secondary opacity-60">Segurança Ativa</p>
        </div>

        {/* Indicadores de PIN (Bolinhas) */}
        <div className="flex gap-4 mb-16">
          {[1, 2, 3, 4].map((dot) => (
            <div
              key={dot}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                pinInput.length >= dot 
                  ? 'bg-brand border-brand scale-125 shadow-[0_0_15px_rgba(var(--brand-rgb),0.3)]' 
                  : 'border-border-ui bg-transparent'
              } ${error ? 'border-red-500 bg-red-500' : ''}`}
            />
          ))}
        </div>

        {/* Teclado Numérico */}
        <div className="grid grid-cols-3 gap-5 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              // bg-bg-card garante que o botão se destaque do fundo
              className="w-full aspect-square rounded-2xl bg-bg-card border border-border-ui/50 flex items-center justify-center text-xl font-black text-text-primary hover:bg-brand/5 active:scale-90 active:bg-brand/10 transition-all shadow-sm"
            >
              {num}
            </button>
          ))}
          
          <div className="flex items-center justify-center text-text-secondary opacity-30">
            <Hash size={20} />
          </div>

          <button
            onClick={() => handleNumberClick('0')}
            className="w-full aspect-square rounded-2xl bg-bg-card border border-border-ui/50 flex items-center justify-center text-xl font-black text-text-primary active:scale-90 transition-all shadow-sm"
          >
            0
          </button>

          <button
            onClick={handleDelete}
            className="w-full aspect-square rounded-2xl flex items-center justify-center text-text-secondary hover:text-red-500 active:scale-90 transition-all"
          >
            <Delete size={24} />
          </button>
        </div>

        {error && (
          <p className="absolute -bottom-12 text-[10px] font-black uppercase tracking-widest text-red-500 animate-bounce">
            PIN Incorreto
          </p>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}} />
    </div>
  );
};

export default PinLock;