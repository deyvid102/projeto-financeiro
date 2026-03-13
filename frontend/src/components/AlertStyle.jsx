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
        }, 500);
      }, 3500);

      return () => {
        clearTimeout(timer);
        clearTimeout(closeTimer);
      };
    }
  }, [message, onClose]);

  if (!mounted) return null;

  const config = {
    success: {
      bg: "bg-[#0a0a0a]/90 border-emerald-500/30",
      icon: <FiCheckCircle className="text-emerald-400" />,
      bar: "bg-emerald-500",
      glow: "shadow-emerald-500/20",
      label: "status: ok"
    },
    error: {
      bg: "bg-[#0a0a0a]/90 border-red-500/30",
      icon: <FiAlertCircle className="text-red-400" />,
      bar: "bg-red-500",
      glow: "shadow-red-500/20",
      label: "critical_error"
    },
    warning: {
      bg: "bg-[#0a0a0a]/90 border-amber-500/30",
      icon: <FiAlertTriangle className="text-amber-400" />,
      bar: "bg-amber-500",
      glow: "shadow-amber-500/20",
      label: "warning"
    },
    info: {
      bg: "bg-[#0a0a0a]/90 border-blue-500/30",
      icon: <FiInfo className="text-blue-400" />,
      bar: "bg-blue-500",
      glow: "shadow-blue-500/20",
      label: "info"
    },
  };

  const current = config[type] || config.success;

  return (
    <div
      // Ajustado: top-6 right-6, padding menor (px-4 py-3) e largura menor
      className={`fixed top-6 right-6 z-[99999] flex items-center gap-4 px-4 py-3 rounded-xl border backdrop-blur-2xl min-w-[260px] max-w-[340px] shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.2,1,0.2,1)] ${current.bg} ${current.glow}`}
      style={{
        // Agora ele entra vindo 40px da direita (positivo)
        transform: visible ? "translateX(0) scale(1)" : "translateX(40px) scale(0.9)",
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Ícone Estilizado - Levemente reduzido */}
      <div className="relative flex-shrink-0">
        <div className={`absolute inset-0 blur-md opacity-40 ${current.bar}`}></div>
        <div className="relative text-xl filter drop-shadow-sm">
          {current.icon}
        </div>
      </div>

      {/* Texto - Fonte compacta */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40 font-mono mb-0.5">
          {current.label}
        </span>
        <p className="text-[12px] font-bold text-white/90 leading-tight tracking-tight uppercase italic">
          {message}
        </p>
      </div>

      {/* Ícone Decorativo lateral */}
      <div className="flex-shrink-0 ml-1 opacity-10 text-white">
        <FiZap size={12} />
      </div>

      {/* Botão de fechar */}
      <button 
        onClick={() => setVisible(false)}
        className="absolute top-1.5 right-1.5 p-1 text-white/20 hover:text-white/60 transition-colors"
      >
        <FiX size={12} />
      </button>

      {/* Barra de Progresso */}
      <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white/5 overflow-hidden rounded-b-xl">
        <div 
          className={`h-full transition-all duration-[3500ms] ease-linear ${current.bar}`}
          style={{ width: visible ? "0%" : "100%" }}
        />
      </div>
    </div>
  );
}