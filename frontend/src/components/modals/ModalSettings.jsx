import React, { useState, useEffect } from 'react';
import { 
  X, User, Shield, Moon, Sun, Save, Loader2, 
  Lock, Eye, EyeOff, AlertCircle, Smartphone, Download
} from 'lucide-react';
import { useTheme } from '@/components/ThemeContext';
import api from '@/services/api';
import AlertStyle from '@/components/AlertStyle';

const ModalSettings = ({ isOpen, onClose }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estado para armazenar o prompt do PWA
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  const [alertConfig, setAlertConfig] = useState({ 
    show: false, 
    type: 'info', 
    message: '' 
  });

  const [formData, setFormData] = useState(() => {
    const rawUser = localStorage.getItem('user');
    try {
      const parsed = JSON.parse(rawUser) || {};
      return {
        name: parsed.name || '',
        email: parsed.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
    } catch {
      return { name: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' };
    }
  });

  // --- LÓGICA COMPLETA PWA ---
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('PWA: Evento beforeinstallprompt capturado.');
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      console.log('PWA: Aplicativo instalado com sucesso.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Verifica se já está rodando como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // --- TRAVA DE SEGURANÇA BOTTOM BAR ---
  useEffect(() => {
    const bottomBar = document.querySelector('nav[aria-label="Navegação principal"]');
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (bottomBar) bottomBar.style.display = 'none';
    } else {
      document.body.style.overflow = 'unset';
      if (bottomBar) bottomBar.style.display = 'block';
    }
    return () => {
      document.body.style.overflow = 'unset';
      if (bottomBar) bottomBar.style.display = 'block';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const showAlert = (message, type = 'error') => {
    setAlertConfig({ show: true, message, type });
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    const words = value.trim().split(/\s+/);
    if (words.length <= 3) {
      setFormData({ ...formData, name: value });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const finalName = formData.name.trim().replace(/\s+/g, ' ');
    
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) return showAlert("A nova senha deve ter 6+ caracteres.");
      if (formData.newPassword !== formData.confirmPassword) return showAlert("As senhas não coincidem.");
      if (!formData.currentPassword) return showAlert("Senha atual necessária.");
    }

    setLoading(true);
    try {
      const response = await api.put('/users/profile', {
        name: finalName,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword || undefined
      });

      localStorage.setItem('user_name', response.data.name);
      localStorage.setItem('user', JSON.stringify(response.data));
      
      showAlert("Configurações atualizadas!", "success");
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (err) {
      showAlert(err.response?.data?.message || "Senha atual incorreta", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black backdrop-blur-xl md:p-4 text-left">
      
      <AlertStyle 
        show={alertConfig.show} 
        type={alertConfig.type} 
        message={alertConfig.message} 
        onClose={() => setAlertConfig({ ...alertConfig, show: false })}
      />

      <div className="absolute inset-0 hidden md:block" onClick={onClose} />
      
      <div className="relative w-full h-full md:h-[620px] md:max-w-2xl bg-bg-card md:rounded-[2.5rem] shadow-2xl border-border-ui overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
        
        {/* HEADER MOBILE */}
        <div className="md:hidden flex items-center justify-between p-6 border-b border-border-ui bg-bg-main/20 shrink-0">
          <h2 className="text-sm font-black text-text-primary uppercase italic">Config<span className="text-brand">MAX</span></h2>
          <button onClick={onClose} className="p-2 text-text-secondary"><X size={24} /></button>
        </div>

        {/* ABAS LATERAIS */}
        <div className="w-full md:w-48 bg-bg-main/30 border-r border-border-ui/50 p-4 md:p-6 flex flex-row md:flex-col gap-2 shrink-0">
          <button 
            type="button"
            onClick={() => setActiveTab('perfil')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'perfil' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-text-secondary hover:bg-bg-main'
            }`}
          >
            <User size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Perfil</span>
          </button>
          
          <button 
            type="button"
            onClick={() => setActiveTab('geral')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'geral' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-text-secondary hover:bg-bg-main'
            }`}
          >
            <Shield size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Geral</span>
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="flex-1 flex flex-col bg-bg-card overflow-hidden">
          <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
              
              {activeTab === 'perfil' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 md:slide-in-from-right-4 duration-300">
                  <header>
                    <h3 className="text-lg font-black text-text-primary italic uppercase tracking-tighter">Dados de Acesso</h3>
                    <p className="text-[9px] text-text-secondary uppercase font-bold tracking-widest italic">Nome e Sobrenome (Máx 3 palavras)</p>
                  </header>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest ml-1">Nome Completo</label>
                      <input 
                        type="text" 
                        placeholder="Nome Sobrenome"
                        className="w-full px-5 py-4 bg-bg-main border border-border-ui rounded-2xl text-text-primary font-bold outline-none focus:border-brand transition-all"
                        value={formData.name}
                        onChange={handleNameChange}
                      />
                    </div>

                    <div className="h-px bg-border-ui/50" />

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Lock size={14} className="text-brand" />
                        <h4 className="text-[10px] font-black text-text-primary uppercase tracking-widest">Segurança</h4>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest ml-1">Senha Atual</label>
                        <input 
                          type="password" 
                          className="w-full px-5 py-4 bg-bg-main border border-border-ui rounded-xl text-text-primary font-bold outline-none focus:border-brand text-sm"
                          value={formData.currentPassword}
                          onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest ml-1">Nova Senha</label>
                          <div className="relative">
                            <input 
                              type={showPassword ? "text" : "password"} 
                              className="w-full px-5 py-3.5 bg-bg-main border border-border-ui rounded-xl text-text-primary font-bold outline-none focus:border-brand text-sm"
                              value={formData.newPassword}
                              onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest ml-1">Confirmar Nova</label>
                          <input 
                            type={showPassword ? "text" : "password"} 
                            className="w-full px-5 py-3.5 bg-bg-main border border-border-ui rounded-xl text-text-primary font-bold outline-none focus:border-brand text-sm"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'geral' && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 md:slide-in-from-right-4 duration-300">
                  <header>
                    <h3 className="text-lg font-black text-text-primary italic uppercase tracking-tighter">Personalização</h3>
                  </header>

                  {/* TEMA */}
                  <div 
                    onClick={toggleTheme}
                    className="flex items-center justify-between p-6 bg-bg-main/40 border border-border-ui/50 rounded-3xl cursor-pointer hover:bg-bg-main/60 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-indigo-500/10 text-indigo-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                      </div>
                      <p className="text-[11px] font-black text-text-primary uppercase tracking-tight">Modo Escuro</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${isDarkMode ? 'bg-brand' : 'bg-border-ui'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${isDarkMode ? 'left-7' : 'left-1'}`} />
                    </div>
                  </div>

                  {/* INSTALAÇÃO PWA */}
                  {!isInstalled && deferredPrompt && (
                    <div 
                      onClick={handleInstallApp}
                      className="flex items-center justify-between p-6 bg-brand/10 border border-brand/20 rounded-3xl cursor-pointer hover:bg-brand/20 transition-all border-dashed"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-brand text-white shadow-lg shadow-brand/30">
                          <Smartphone size={20} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-brand uppercase tracking-tight">Instalar Aplicativo</p>
                          <p className="text-[9px] text-text-secondary font-bold uppercase italic">Acesse mais rápido pela tela inicial</p>
                        </div>
                      </div>
                      <Download size={18} className="text-brand animate-bounce" />
                    </div>
                  )}

                  {isInstalled && (
                    <div className="p-4 bg-bg-main/20 border border-border-ui/30 rounded-2xl flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest">Aplicativo já instalado ou em modo Nativo</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RODAPÉ FIXO */}
            <footer className="p-6 border-t border-border-ui/50 bg-bg-main/10 flex flex-col md:flex-row gap-3 shrink-0">
              <button 
                type="submit" 
                disabled={loading} 
                className="order-1 md:order-2 flex-1 md:flex-none px-8 py-4 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Salvar Dados
              </button>
            </footer>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalSettings;