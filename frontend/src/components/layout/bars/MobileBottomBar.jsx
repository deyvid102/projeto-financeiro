import React from 'react';
import { NavLink } from 'react-router-dom';
import { navItems } from '../navItems';

const MobileBottomBar = () => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border-ui bg-bg-main/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegação principal"
    >
      <div className="h-14 flex items-center justify-around px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => {
                const base =
                  'flex flex-col items-center justify-center flex-1 gap-0 transition-colors select-none py-1';

                const active = isActive
                  ? 'text-brand'
                  : 'text-text-secondary hover:text-brand';

                return `${base} ${active}`;
              }}
              aria-label={item.label}
            >
              <Icon
                size={18}
                strokeWidth={2}
                className="shrink-0"
              />
              <span className="text-[8px] font-black uppercase tracking-[0.14em] mt-1 leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-[64px]">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomBar;

