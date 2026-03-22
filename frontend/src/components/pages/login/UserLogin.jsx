import React, { useState } from 'react';
import { Mail, Lock, LogIn, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from "/src/services/api.js";
import logoImg from '../../../assets/logo.png';

const UserLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/users/login', { email, password });
      localStorage.setItem('token', response.data.token);
      const userName = response.data.user?.name || response.data.name;
      if (userName) localStorage.setItem('user_name', userName);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-bg-main font-sans relative overflow-hidden">
      
      {/* BACKGROUND EFEITOS (Glows e Imagem de Fundo) */}
      <div className="absolute inset-0 z-0 lg:hidden">
        <img 
          src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2022&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-15"
          alt="background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg-main via-bg-main/90 to-brand/10" />
        {/* Glows de profundidade */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 right-[-10%] w-80 h-80 bg-brand/5 rounded-full blur-[120px]" />
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
        
        {/* Header com Logo (PNG Solto e Elegante) */}
        <div className="text-center mb-8 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-24 h-24 mb-4 drop-shadow-[0_10px_15px_rgba(0,0,0,0.3)]">
            <img 
              src={logoImg} 
              alt="FinanceMAX Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <h1 className="text-brand text-4xl font-black mb-1 italic tracking-tighter uppercase">
            Finance <span className="text-text-primary">MAX</span>
          </h1>
          <div className="flex items-center gap-2 opacity-60">
            <div className="h-[1px] w-4 bg-brand" />
            <p className="text-[9px] font-black text-text-secondary uppercase tracking-[0.3em]">
              Acesso Privado
            </p>
            <div className="h-[1px] w-4 bg-brand" />
          </div>
        </div>

        {/* Card de Login Glassmorphism */}
        <div className="w-full max-w-md p-8 rounded-[2.5rem] 
                        bg-bg-card/70 backdrop-blur-2xl border border-white/5 
                        shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]
                        lg:bg-bg-card lg:backdrop-blur-none lg:border-border-ui
                        animate-in fade-in zoom-in-95 duration-500">
          
          {error && (
            <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl text-[10px] font-black uppercase tracking-wider text-center mb-6 border border-red-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary ml-1 uppercase tracking-widest">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 group-focus-within:text-brand group-focus-within:opacity-100 transition-all" size={18} />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full pl-12 pr-4 py-4 bg-bg-main/40 border border-white/5 rounded-2xl focus:outline-none focus:border-brand/50 focus:bg-bg-main/80 transition-all text-text-primary font-bold text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-secondary ml-1 uppercase tracking-widest">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 group-focus-within:text-brand group-focus-within:opacity-100 transition-all" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-bg-main/40 border border-white/5 rounded-2xl focus:outline-none focus:border-brand/50 focus:bg-bg-main/80 transition-all text-text-primary font-bold text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 hover:opacity-100 transition-opacity"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-white font-black uppercase text-[11px] tracking-[0.2em] py-5 rounded-2xl shadow-xl shadow-brand/20 hover:shadow-brand/40 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? <span className="animate-pulse">Autenticando...</span> : (
                <>
                  <LogIn size={18} strokeWidth={3} />
                  <span>Entrar</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[10px] font-bold text-text-secondary uppercase tracking-widest">
            Novo por aqui?{' '}
            <Link to="/register" className="text-brand font-black hover:text-brand/80 transition-all">
              Criar Conta
            </Link>
          </p>
        </div>
      </div>

      {/* LADO DIREITO (Desktop) - Mantido para consistência */}
      <div className="hidden lg:flex flex-1 relative bg-brand overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/90 to-black/70 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2022&auto=format&fit=crop" 
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          alt="desktop-bg"
        />
        <div className="relative z-20 p-12 text-white max-w-lg text-left">
          <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[3rem] border border-white/20 shadow-2xl">
            <ShieldCheck size={48} className="mb-6 text-white" />
            <h2 className="text-4xl font-black uppercase leading-[0.9] tracking-tighter mb-4 italic text-white">
              Ambiente <br/> <span className="text-white/60">Privado</span>
            </h2>
            <p className="text-lg font-medium opacity-90 leading-relaxed text-white">
              Acesso exclusivo para administradores. Monitore seu patrimônio com segurança.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;