import React, { useState, useEffect } from 'react';
import { Fingerprint, Lock, Loader2 } from 'lucide-react';

const BiometricLock = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    // Verifica se o usuário ativou a biometria no ModalSettings
    const useBiometry = localStorage.getItem('useBiometry') === 'true';
    if (useBiometry) {
      setIsLocked(true);
      handleAuthenticate();
    }
  }, []);

  const handleAuthenticate = async () => {
    setAuthenticating(true);
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Solicita a biometria nativa (FaceID/Digital)
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required",
        }
      });

      if (credential) {
        setIsLocked(false);
      }
    } catch (err) {
      console.error("Erro na biometria:", err);
      // Se o usuário cancelar, ele continua na tela de bloqueio
    } finally {
      setAuthenticating(false);
    }
  };

  if (!isLocked) return children;

  return (
    <div className="fixed inset-0 z-[20000] bg-bg-main flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      {/* Background Decorativo */}
      <div className="absolute inset-0 bg-brand/5 backdrop-blur-3xl" />
      
      <div className="relative space-y-8 flex flex-col items-center">
        <div className="w-20 h-20 bg-brand/10 border border-brand/20 rounded-3xl flex items-center justify-center text-brand shadow-2xl shadow-brand/20">
          <Lock size={40} className="animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-text-primary italic uppercase tracking-tighter">
            Finance<span className="text-brand">MAX</span>
          </h2>
          <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest italic">
            Aplicativo Bloqueado
          </p>
        </div>

        <button 
          onClick={handleAuthenticate}
          disabled={authenticating}
          className="group relative flex flex-col items-center gap-4 p-8 rounded-full transition-all active:scale-95"
        >
          <div className="p-6 bg-brand text-white rounded-full shadow-lg shadow-brand/40 group-hover:shadow-brand/60">
            {authenticating ? <Loader2 size={32} className="animate-spin" /> : <Fingerprint size={32} />}
          </div>
          <span className="text-[10px] font-black text-brand uppercase tracking-widest animate-bounce">
            Tocar para Desbloquear
          </span>
        </button>
      </div>

      <p className="absolute bottom-10 text-[9px] text-text-secondary font-bold uppercase tracking-[0.2em] opacity-50">
        Segurança Biométrica Ativa
      </p>
    </div>
  );
};

export default BiometricLock;