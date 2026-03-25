import React, { useState } from 'react';
import { Sun, Moon, LogOut, ChevronDown, Settings } from 'lucide-react';
import { useTheme } from '@/components/ThemeContext';
import { useNavigate } from 'react-router-dom';
import NotificationCenter from '@/components/NotificationCenter';
import ModalSettings from '@/components/modals/ModalSettings'; 

const Topbar = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 

  const [userData] = useState(() => {
    const rawName = localStorage.getItem('user_name');
    const rawUser = localStorage.getItem('user');
    let finalName = 'Usuário';

    if (rawName) finalName = rawName;
    else if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        finalName = parsed.name || parsed.username || 'Usuário';
      } catch (e) { finalName = 'Usuário'; }
    }
    return { name: finalName, initial: finalName.charAt(0).toUpperCase() };
  });

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 bg-transparent relative z-50 text-left">
      <div className="flex items-center gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">
          Bem-vindo de volta, <span className="text-brand italic">{userData.name.split(' ')[0]}</span>
        </p>
      </div>

      <div className="flex items-center gap-1.5 md:gap-3">
        {/* Componente Isolado */}
        <NotificationCenter />

        <button onClick={toggleTheme} className="p-2.5 rounded-xl text-text-secondary hover:bg-bg-card hover:text-brand transition-all border border-transparent">
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex items-center gap-2 p-1.5 rounded-2xl transition-all border ${isMenuOpen ? 'bg-bg-card border-border-ui shadow-sm' : 'border-transparent'}`}
          >
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center text-white shadow-lg shadow-brand/20 font-black italic">
              {userData.initial}
            </div>
            <ChevronDown size={14} className={`hidden md:block text-text-secondary transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-black/5 md:bg-transparent" onClick={() => setIsMenuOpen(false)} />
              <div className="fixed md:absolute top-16 md:top-full right-4 md:right-0 mt-2 w-64 bg-bg-card border border-border-ui rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden text-left">
                <div className="p-5 border-b border-border-ui/50 bg-bg-main/10">
                  <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest mb-1">Usuário</p>
                  <p className="text-xs font-bold text-text-primary truncate">{userData.name}</p>
                </div>
                <div className="p-2 space-y-1">
                  <button 
                    onClick={() => { setIsSettingsOpen(true); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-bg-main/60 hover:text-brand transition-all group"
                  >
                    <Settings size={16} className="group-hover:rotate-45 transition-transform duration-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Configurações</span>
                  </button>

                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all">
                    <LogOut size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ModalSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </header>
  );
};

export default Topbar;