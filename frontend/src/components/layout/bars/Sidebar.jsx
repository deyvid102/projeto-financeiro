import React from 'react';
import { LayoutDashboard, ReceiptText, TrendingUp, WalletMinimal, LogOut, Settings } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ReceiptText, label: 'Transações', path: '/transactions' },
    { icon: WalletMinimal, label: 'Despesas', path: '/expenses' },
    { icon: TrendingUp, label: 'Investimentos', path: '/investments' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <aside className="w-20 min-h-screen bg-bg-sidebar border-r border-border-ui flex flex-col items-center py-8 transition-all duration-300 ease-in-out">
      {/* Logo Compacta */}
      <div className="mb-12 flex flex-col items-center">
        <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/20">
          <span className="text-white font-black text-xl">F</span>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 flex flex-col gap-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              relative group flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300
              ${isActive 
                ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                : 'text-text-secondary hover:bg-bg-main hover:text-brand'}
            `}
          >
            {/* O PULO DO GATO: Usar função no children para capturar o isActive */}
            {({ isActive }) => (
              <>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                
                {/* Tooltip Lateral */}
                <span className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-text-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button 
        onClick={handleLogout}
        className="relative group flex items-center justify-center w-12 h-12 text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all cursor-pointer mt-auto"
      >
        <LogOut size={22} />
        <span className="absolute left-16 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg pointer-events-none whitespace-nowrap z-50">
          Sair
        </span>
      </button>
    </aside>
  );
};

export default Sidebar;