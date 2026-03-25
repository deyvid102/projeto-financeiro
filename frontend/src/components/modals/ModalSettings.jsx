import React, { useState, useEffect } from 'react';
import { 
  X, User, Shield, Moon, Sun, Save, Loader2, 
  Lock, Eye, EyeOff, Smartphone, Download, RefreshCw, Share,
  Hash, CheckCircle2
} from 'lucide-react';
import { useTheme } from '@/components/ThemeContext';
import api from '@/services/api';
import AlertStyle from '@/components/AlertStyle';

const ModalSettings = ({ isOpen, onClose }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  
  const [pinEnabled, setPinEnabled] = useState(localStorage.getItem('usePin') === 'true');
  const [tempPin, setTempPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);

  const [alertConfig, setAlertConfig] = useState({ show: false, type: 'info', message: '' });

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

  useEffect(() => {
    const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isApple);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      showAlert("Aplicativo instalado com sucesso!", "success");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const showAlert = (message, type = 'error') => {
    setAlertConfig({ show: true, message, type });
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      showAlert("No iOS, clique em Compartilhar e 'Adicionar à Tela de Início'", "info");
    }
  };

  const handleTogglePin = () => {
    if (pinEnabled) {
      localStorage.removeItem('usePin');
      localStorage.removeItem('appPin');
      setPinEnabled(false);
      setTempPin('');
      showAlert("Trava de PIN desativada.", "info");
    } else {
      setIsSettingPin(true);
    }
  };

  const saveNewPin = (e) => {
    e.preventDefault();
    if (tempPin.length === 4) {
      localStorage.setItem('appPin', tempPin);
      localStorage.setItem('usePin', 'true');
      setPinEnabled(true);
      setIsSettingPin(false);
      setTempPin('');
      showAlert("PIN configurado!", "success");
    } else {
      showAlert("O PIN deve ter 4 dígitos.");
    }
  };

  const handleForceUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let reg of registrations) reg.update();
        showAlert("Buscando atualizações...", "success");
        setTimeout(() => window.location.reload(true), 1000);
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSettingPin) return;

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      return showAlert("As novas senhas não coincidem.");
    }

    setLoading(true);
    try {
      const response = await api.put('/users/profile', {
        name: formData.name,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword || undefined
      });
      localStorage.setItem('user', JSON.stringify(response.data));
      showAlert("Configurações salvas!", "success");
      setTimeout(() => { onClose(); window.location.reload(); }, 1500);
    } catch (err) {
      showAlert(err.response?.data?.message || "Erro ao salvar", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xl md:p-4 text-left">
      <AlertStyle 
        show={alertConfig.show} 
        type={alertConfig.type} 
        message={alertConfig.message} 
        onClose={() => setAlertConfig({ ...alertConfig, show: false })}
      />

      <div className="relative w-full h-full md:h-[650px] md:max-w-2xl bg-bg-card md:rounded-[2.5rem] shadow-2xl border border-border-ui/50 overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200">
        
        <button 
          onClick={onClose}
          className="hidden md:flex absolute top-6 right-6 z-50 p-2 bg-bg-main/50 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-all text-text-secondary"
        >
          <X size={20} />
        </button>

        <div className="md:hidden flex items-center justify-between p-6 border-b border-border-ui bg-bg-main/20 shrink-0">
          <h2 className="text-sm font-black text-text-primary uppercase italic">Config<span className="text-brand">MAX</span></h2>
          <button onClick={onClose} className="p-2 text-text-secondary"><X size={24} /></button>
        </div>

        <div className="w-full md:w-48 bg-bg-main/30 border-r border-border-ui/50 p-4 md:p-6 flex flex-row md:flex-col gap-2 shrink-0">
          <button 
            type="button"
            onClick={() => { setActiveTab('perfil'); setIsSettingPin(false); }}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'perfil' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-text-secondary hover:bg-bg-main'}`}
          >
            <User size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Perfil</span>
          </button>
          
          <button 
            type="button"
            onClick={() => { setActiveTab('geral'); setIsSettingPin(false); }}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'geral' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-text-secondary hover:bg-bg-main'}`}
          >
            <Shield size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Geral</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col bg-bg-card overflow-hidden">
          <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
              
              {activeTab === 'perfil' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                  <header>
                    <h3 className="text-lg font-black text-text-primary italic uppercase tracking-tighter">Dados de Acesso</h3>
                  </header>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest ml-1">Nome Completo</label>
                      <input 
                        type="text" 
                        className="w-full px-5 py-4 bg-bg-main border border-border-ui rounded-2xl text-text-primary font-bold outline-none focus:border-brand"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="h-px bg-border-ui/50" />

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest ml-1">Senha Atual</label>
                      <div className="relative">
                        <input 
                          type={showCurrentPassword ? "text" : "password"} 
                          className="w-full px-5 py-4 bg-bg-main border border-border-ui rounded-xl text-text-primary font-bold outline-none focus:border-brand"
                          value={formData.currentPassword}
                          onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                        />
                        <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">
                          {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest ml-1">Nova Senha</label>
                        <div className="relative">
                          <input 
                            type={showNewPassword ? "text" : "password"} 
                            className="w-full px-5 py-3.5 bg-bg-main border border-border-ui rounded-xl text-text-primary font-bold outline-none focus:border-brand"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                          />
                          <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">
                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-text-secondary uppercase tracking-widest ml-1">Confirmar</label>
                        <input 
                          type={showNewPassword ? "text" : "password"} 
                          className="w-full px-5 py-3.5 bg-bg-main border border-border-ui rounded-xl text-text-primary font-bold outline-none focus:border-brand"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'geral' && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                  <header>
                    <h3 className="text-lg font-black text-text-primary italic uppercase tracking-tighter">Sistema</h3>
                  </header>

                  {/* MODO ESCURO */}
                  <div onClick={toggleTheme} className="flex items-center justify-between p-6 bg-bg-main/40 border border-border-ui/50 rounded-3xl cursor-pointer hover:bg-bg-main/60 transition-all">
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
                  <div 
                    onClick={!isInstalled ? handleInstallApp : undefined}
                    className={`flex items-center justify-between p-6 bg-bg-main/40 border border-border-ui/50 rounded-3xl transition-all ${!isInstalled ? 'cursor-pointer hover:bg-bg-main/60 border-brand/20' : 'opacity-80'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${isInstalled ? 'bg-green-500/10 text-green-500' : 'bg-brand/10 text-brand'}`}>
                        {isInstalled ? <Smartphone size={20} /> : <Download size={20} />}
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-black text-text-primary uppercase tracking-tight">
                          {isInstalled ? "App Instalado" : "Instalar Aplicativo"}
                        </p>
                        <p className="text-[9px] text-text-secondary font-bold uppercase italic leading-tight">
                          {isInstalled ? "Versão Nativa Ativa" : isIOS ? "Adicionar à tela inicial" : "Acesso rápido e offline"}
                        </p>
                      </div>
                    </div>
                    {!isInstalled && (
                      <div className="p-2 bg-brand/10 rounded-lg text-brand">
                        {isIOS ? <Share size={16} /> : <Download size={16} />}
                      </div>
                    )}
                    {isInstalled && <CheckCircle2 size={18} className="text-green-500" />}
                  </div>

                  {/* PIN */}
                  <div className={`p-6 border rounded-3xl transition-all ${isSettingPin ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-bg-main/40 border-border-ui/50'}`}>
                    {!isSettingPin ? (
                      <div onClick={handleTogglePin} className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${pinEnabled ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-bg-card text-text-secondary'}`}><Hash size={20} /></div>
                          <div className="text-left">
                            <p className={`text-[11px] font-black uppercase tracking-tight ${pinEnabled ? 'text-indigo-500' : 'text-text-primary'}`}>Proteção por PIN</p>
                            <p className="text-[9px] text-text-secondary font-bold uppercase italic leading-tight">{pinEnabled ? "Ativado" : "Desativado"}</p>
                          </div>
                        </div>
                        {pinEnabled && <CheckCircle2 size={18} className="text-indigo-500" />}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest text-center">Digite o novo PIN (4 dígitos)</p>
                        <input 
                          autoFocus
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="0000"
                          className="w-full bg-bg-card border-2 border-brand/30 rounded-2xl py-4 text-center text-2xl font-black tracking-[1em] outline-none focus:border-brand"
                          value={tempPin}
                          onChange={(e) => setTempPin(e.target.value.replace(/\D/g, ''))}
                        />
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setIsSettingPin(false)} className="flex-1 py-3 text-[10px] font-black uppercase text-text-secondary">Cancelar</button>
                          <button type="button" onClick={saveNewPin} className="flex-1 py-3 bg-brand text-white text-[10px] font-black uppercase rounded-xl">Confirmar</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ATUALIZAÇÃO */}
                  <button type="button" onClick={handleForceUpdate} className="w-full flex items-center justify-between p-6 bg-bg-main/40 border border-border-ui/50 rounded-3xl hover:border-brand/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-bg-card text-text-primary border border-border-ui/50 group-hover:text-brand transition-colors"><RefreshCw size={20} /></div>
                      <p className="text-[11px] font-black text-text-primary uppercase tracking-tight">Atualizar Versão</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <footer className="p-6 border-t border-border-ui/50 bg-bg-main/10 shrink-0">
              <button 
                type="submit" 
                disabled={loading || isSettingPin} 
                className="w-full py-4 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Salvar Configurações
              </button>
            </footer>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalSettings;