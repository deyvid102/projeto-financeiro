import React from 'react';
import { Sun, Moon, User } from 'lucide-react';
import { useTheme } from '../../ThemeContext';

const Topbar = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header className="h-20 flex items-center justify-between px-8 bg-transparent">
      <div>
        <p className="text-sm text-text-secondary">
          Bem-vindo de volta, <span className="text-text-primary font-bold">Deyvid</span>
        </p>
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg text-text-secondary hover:bg-bg-card hover:text-brand transition-all cursor-pointer"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white shadow-lg shadow-brand/20">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;