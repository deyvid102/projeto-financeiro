import React, { useState } from 'react';
import { Sun, Moon, User, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { useNavigate } from 'react-router-dom';

const Topbar = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="h-20 flex items-center justify-between px-8 bg-transparent relative z-40">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
          Bem-vindo de volta, <span className="text-brand italic">Deyvid</span>
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Toggle Theme */}
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-text-secondary hover:bg-bg-card hover:text-brand transition-all cursor-pointer border border-transparent hover:border-border-ui/50"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Menu Container */}
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex items-center gap-3 p-1.5 pr-4 rounded-2xl transition-all cursor-pointer ${isMenuOpen ? 'bg-bg-card shadow-sm' : 'hover:bg-bg-card/50'}`}
          >
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white shadow-lg shadow-brand/20">
              <User size={18} />
            </div>
            <ChevronDown size={14} className={`text-text-secondary transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <>
              {/* Overlay invisível para fechar ao clicar fora */}
              <div 
                className="fixed inset-0 z-[-1]" 
                onClick={() => setIsMenuOpen(false)}
              />
              
              <div className="absolute right-0 mt-3 w-48 bg-bg-card border border-border-ui rounded-2xl shadow-2xl shadow-black/10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="p-4 border-b border-border-ui/50">
                  <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest">Usuário</p>
                  <p className="text-xs font-bold text-text-primary truncate">Deyvid Wellington</p>
                </div>
                
                <div className="p-2">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                  >
                    <LogOut size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sair do Sistema</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;