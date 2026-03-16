import { useEffect, useState } from "react";
import { 
  FiCheckCircle, 
  FiAlertCircle, 
  FiInfo, 
  FiAlertTriangle,
  FiZap,
  FiX
} from "react-icons/fi";

export default function AlertStyle({ message, type = "success", onClose }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (message) {
      setMounted(true);
      // Pequeno delay para disparar a animação de entrada
      const timer = setTimeout(() => setVisible(true), 50);
      
      const closeTimer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setMounted(false);
          if (onClose) onClose();
        }, 500); // Tempo da animação de saída
      }, 4000);

      return () => {
        clearTimeout(timer);
        clearTimeout(closeTimer);
      };
    }
  }, [message, onClose]);

  if (!mounted) return null;

  // Mapeamento de cores adaptável (Light/Dark via classes do Tailwind)
  const config = {
    success: {
      bg: "bg-white/80 dark:bg-[#0a0a0a]/90 border-emerald-500/20 dark:border-emerald-500/30",
      text: "text-slate-800 dark:text-white/90",
      icon: <FiCheckCircle className="text-emerald-500 dark:text-emerald-400" />,
      bar: "bg-emerald-500",
      glow: "shadow-emerald-500/10 dark:shadow-emerald-500/20",
      label: "status: ok"
    },
    error: {
      bg: "bg-white/80 dark:bg-[#0a0a0a]/90 border-red-500/20 dark:border-red-500/30",
      text: "text-slate-800 dark:text-white/90",
      icon: <FiAlertCircle className="text-red-500 dark:text-red-400" />,
      bar: "bg-red-500",
      glow: "shadow-red-500/10 dark:shadow-red-500/20",
      label: "critical_error"
    },
    warning: {
      bg: "bg-white/80 dark:bg-[#0a0a0a]/90 border-amber-500/20 dark:border-amber-500/30",
      text: "text-slate-800 dark:text-white/90",
      icon: <FiAlertTriangle className="text-amber-500 dark:text-amber-400" />,
      bar: "bg-amber-500",
      glow: "shadow-amber-500/10 dark:shadow-amber-500/20",
      label: "warning"
    },
    info: {
      bg: "bg-white/80 dark:bg-[#0a0a0a]/90 border-blue-500/20 dark:border-blue-500/30",
      text: "text-slate-800 dark:text-white/90",
      icon: <FiInfo className="text-blue-500 dark:text-blue-400" />,
      bar: "bg-blue-500",
      glow: "shadow-blue-500/10 dark:shadow-blue-500/20",
      label: "info"
    },
  };

  const current = config[type] || config.success;

  return (
    <div
      className={`fixed top-6 right-6 z-[99999] flex items-center gap-4 px-5 py-4 rounded-[1.5rem] border backdrop-blur-xl min-w-[280px] max-w-[380px] shadow-2xl transition-all duration-500 ${current.bg} ${current.glow}`}
      style={{
        // Animação Spring (efeito de mola) na entrada
        transform: visible 
          ? "translateX(0) scale(1) rotate(0deg)" 
          : "translateX(100px) scale(0.7) rotate(5deg)",
        opacity: visible ? 1 : 0,
        transitionTimingFunction: visible 
          ? "cubic-bezier(0.34, 1.56, 0.64, 1)" 
          : "cubic-bezier(0.4, 0, 1, 1)",
      }}
    >
      {/* Ícone com Glow dinâmico */}
      <div className="relative flex-shrink-0">
        <div className={`absolute inset-0 blur-lg opacity-30 animate-pulse ${current.bar}`}></div>
        <div className="relative text-2xl filter drop-shadow-md">
          {current.icon}
        </div>
      </div>

      {/* Conteúdo do Texto */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <span className="text-[7px] font-black uppercase tracking-[0.3em] opacity-50 dark:opacity-40 font-mono mb-1">
          {current.label}
        </span>
        <p className={`text-[11px] font-black uppercase italic leading-tight tracking-tight ${current.text}`}>
          {message}
        </p>
      </div>

      {/* Zap decorativo (Marca registrada do BarberMAX) */}
      <div className="flex-shrink-0 ml-1 opacity-20 dark:opacity-10 text-slate-900 dark:text-white">
        <FiZap size={14} />
      </div>

      {/* Botão de Fechar */}
      <button 
        onClick={() => setVisible(false)}
        className="absolute top-3 right-3 p-1 text-slate-400 dark:text-white/20 hover:text-brand transition-colors active:scale-90"
      >
        <FiX size={14} strokeWidth={3} />
      </button>

      {/* Barra de Progresso Inversa (Consumindo) */}
      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-slate-200 dark:bg-white/5 overflow-hidden rounded-b-[1.5rem]">
        <div 
          className={`h-full transition-all duration-[4000ms] ease-linear ${current.bar}`}
          style={{ width: visible ? "0%" : "100%" }}
        />
      </div>
    </div>
  );
}