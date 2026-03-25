import React, { useState, useEffect } from 'react';
import { Fingerprint, Lock, Loader2, ShieldCheck } from 'lucide-react';

const BiometricLock = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    // Verifica se a biometria está ativa no sistema
    const useBiometry = localStorage.getItem('useBiometry') === 'true';
    if (useBiometry) {
      setIsLocked(true);
      // Removi a chamada automática daqui para evitar o bloqueio do navegador
    }
  }, []);

  const handleAuthenticate = async () => {
    if (authenticating) return;
    
    setAuthenticating(true);
    try {
      // 1. Criar um desafio (Challenge)
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // 2. Solicitar a biometria (Agora disparado pelo CLIQUE do usuário)
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required",
        }
      });

      if (credential) {
        setIsLocked(false); // Libera o app
      }
    } catch (err) {
      console.error("Erro na biometria:", err);
      // Caso o usuário cancele ou dê erro, ele permanece na tela de bloqueio
    } finally {
      setAuthenticating(false);
    }
  };

  // Se não estiver bloqueado, mostra o App normal
  if (!isLocked) return children;

  return (
    <div className="fixed inset-0 z-[20000] bg-bg-main flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Background com efeito de Glassmorphism pesado para esconder o saldo atrás */}
      <div className="absolute inset-0 bg-bg-main/80 backdrop-blur-2xl" />
      
      <div className="relative z-10 flex flex-col items-center max-w-xs w-full space-y-12">
        
        {/* Logo/Ícone de Status */}
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto bg-brand/10 border border-brand/20 rounded-[2rem] flex items-center justify-center text-brand shadow-2xl shadow-brand/20">
            <Lock size={32} />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-text-primary italic uppercase tracking-tighter">
              Finance<span className="text-brand">MAX</span>
            </h2>
            <div className="flex items-center justify-center gap-2 text-brand/60">
              <ShieldCheck size={12} />
              <p className="text-[9px] font-black uppercase tracking-[0.2em]">Acesso Protegido</p>
            </div>
          </div>
        </div>

        {/* BOTÃO QUE DISPARA A BIOMETRIA */}
        <button 
          onClick={handleAuthenticate}
          disabled={authenticating}
          className="group relative flex flex-col items-center gap-6 w-full py-10 rounded-[3rem] transition-all active:scale-95 bg-bg-card border border-border-ui/50 shadow-xl"
        >
          <div className={`p-6 rounded-full transition-all duration-500 ${
            authenticating ? 'bg-brand/20 text-brand' : 'bg-brand text-white shadow-lg shadow-brand/40'
          }`}>
            {authenticating ? (
              <Loader2 size={40} className="animate-spin" />
            ) : (
              <Fingerprint size={40} className="group-hover:scale-110 transition-transform" />
            )}
          </div>
          
          <div className="space-y-1">
            <span className="text-[11px] font-black text-text-primary uppercase tracking-widest">
              {authenticating ? 'Validando...' : 'Tocar para Entrar'}
            </span>
            <p className="text-[9px] text-text-secondary font-medium uppercase tracking-tighter opacity-70">
              Use sua Digital ou FaceID
            </p>
          </div>
        </button>

        <p className="text-[8px] text-text-secondary font-bold uppercase tracking-widest opacity-40">
          Versão 1.0.4 • PWA Secure Mode
        </p>
      </div>
    </div>
  );
};

export default BiometricLock;