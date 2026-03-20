import React from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { navItems } from '../navItems';

const MobileDrawer = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-label="Fechar menu"
      />

      <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-bg-card border-r border-border-ui shadow-2xl overflow-y-auto">
        <div className="p-6 flex items-center justify-between border-b border-border-ui/50">
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
                    'flex items-center gap-4 px-4 py-3 rounded-2xl border transition-all';

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
    </div>
  );
};

export default MobileDrawer;

