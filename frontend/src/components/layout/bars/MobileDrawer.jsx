import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { navItems } from '../navItems';

const MobileDrawer = ({ isOpen, onClose }) => {
  // Bloqueia o scroll do body quando o menu está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Usamos Portal para garantir que o Drawer fique no topo de tudo no DOM
  return createPortal(
    <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true">
      
      {/* Backdrop (Fundo escurecido com animação) */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Painel Lateral (Drawer) */}
      <aside 
        className="fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-bg-card border-r border-border-ui shadow-2xl overflow-y-auto 
                   animate-in slide-in-from-left duration-300 ease-out z-[101]"
      >
        <div className="sticky top-0 bg-bg-card/80 backdrop-blur-md p-6 flex items-center justify-between border-b border-border-ui/50 z-10">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
            Navegação
          </p>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-border-ui/50 text-text-secondary hover:text-text-primary hover:bg-bg-main/50 transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="p-6 flex flex-col gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => {
                  const base =
                    'flex items-center gap-4 px-4 py-3 rounded-2xl border transition-all duration-200';

                  const active = 'bg-brand text-white border-brand shadow-lg shadow-brand/20';
                  const inactive =
                    'bg-bg-main/20 text-text-secondary border-border-ui/50 hover:bg-bg-main/40 hover:text-brand';

                  return `${base} ${isActive ? active : inactive}`;
                }}
              >
                <Icon size={20} strokeWidth={2.5} className="shrink-0" />
                <span className="text-[12px] font-black uppercase tracking-widest">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </div>,
    document.body // Renderiza no final do <body>
  );
};

export default MobileDrawer;