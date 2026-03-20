import React from 'react';
import { LayoutDashboard, ReceiptText, TrendingUp, WalletMinimal, Target } from 'lucide-react';
import { NavLink } from 'react-router-dom';
// Importação da logo
import logoImg from '../../../assets/logo.png'; 

const Sidebar = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ReceiptText, label: 'Transações', path: '/transactions' },
    { icon: WalletMinimal, label: 'Despesas', path: '/expenses' },
    { icon: TrendingUp, label: 'Investimentos', path: '/investments' },
    { icon: Target, label: 'Caixinhas', path: '/goals' },
  ];

  return (
    <aside className="hidden md:flex w-20 h-screen sticky top-0 bg-bg-sidebar border-r border-border-ui flex-col items-center py-8 transition-all duration-300 ease-in-out z-50">
      
      {/* Área da Logo */}
      <div className="mb-12 flex flex-col items-center">
        <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
          <img 
            src={logoImg} 
            alt="FinanceMAX Logo" 
            className="w-full h-full object-contain hover:scale-110 transition-transform duration-300"
          />
        </div>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 flex flex-col gap-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              relative group flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300
              ${isActive 
                ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                : 'text-text-secondary hover:bg-white/5 hover:text-brand'} 
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                
                {/* Tooltip Lateral */}
                <span className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-white text-black text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg pointer-events-none whitespace-nowrap z-50 shadow-xl border border-border-ui/20">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;