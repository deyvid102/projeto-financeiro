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
      const timer = setTimeout(() => setVisible(true), 10);
      
      const closeTimer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setMounted(false);
          if (onClose) onClose();
        }, 300); // Tempo de saída reduzido
      }, 4000);

      return () => {
        clearTimeout(timer);
        clearTimeout(closeTimer);
      };
    }
  }, [message, onClose]);

  if (!mounted) return null;

  const config = {
    success: {
      bg: "bg-white dark:bg-[#0d0d0d] border-emerald-500/20",
      text: "text-slate-800 dark:text-white/90",
      icon: <FiCheckCircle className="text-emerald-500" />,
      bar: "bg-emerald-500",
      label: "status: ok"
    },
    error: {
      bg: "bg-white dark:bg-[#0d0d0d] border-red-500/20",
      text: "text-slate-800 dark:text-white/90",
      icon: <FiAlertCircle className="text-red-500" />,
      bar: "bg-red-500",
      label: "critical_error"
    },
    warning: {
      bg: "bg-white dark:bg-[#0d0d0d] border-amber-500/20",
      text: "text-slate-800 dark:text-white/90",
      icon: <FiAlertTriangle className="text-amber-500" />,
      bar: "bg-amber-500",
      label: "warning"
    },
    info: {
      bg: "bg-white dark:bg-[#0d0d0d] border-blue-500/20",
      text: "text-slate-800 dark:text-white/90",
      icon: <FiInfo className="text-blue-500" />,
      bar: "bg-blue-500",
      label: "info"
    },
  };

  const current = config[type] || config.success;

  return (
    <div
      className={`fixed top-6 right-6 z-[99999] flex items-center gap-4 px-5 py-4 rounded-2xl border backdrop-blur-md min-w-[280px] max-w-[380px] shadow-xl transition-all duration-300 ease-out ${current.bg}`}
      style={{
        // Animação linear simples: apenas desliza e opacidade
        transform: visible ? "translateX(0)" : "translateX(20px)",
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Ícone Estático (sem animação pulse ou glow excessivo) */}
      <div className="relative flex-shrink-0 text-xl">
        {current.icon}
      </div>

      {/* Conteúdo do Texto */}
      <div className="flex flex-col flex-1">
        <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40 font-mono mb-0.5">
          {current.label}
        </span>
        <p className={`text-[11px] font-bold uppercase leading-tight tracking-tight ${current.text}`}>
          {message}
        </p>
      </div>

      {/* Zap discreto */}
      <div className="flex-shrink-0 opacity-10 dark:opacity-5 text-text-primary">
        <FiZap size={12} />
      </div>

      {/* Botão de Fechar */}
      <button 
        onClick={() => setVisible(false)}
        className="p-1 text-slate-400 hover:text-brand transition-colors"
      >
        <FiX size={14} />
      </button>

      {/* Barra de Progresso Simples */}
      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-slate-100 dark:bg-white/5 overflow-hidden rounded-b-2xl">
        <div 
          className={`h-full transition-all duration-[4000ms] ease-linear ${current.bar}`}
          style={{ width: visible ? "0%" : "100%" }}
        />
      </div>
    </div>
  );
}