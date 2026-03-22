import React, { useState } from 'react';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from "@/services/api.js";
// Importação da logo
import logoImg from '../../../assets/logo.png';

const UserRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('As senhas não coincidem.');
    }

    setLoading(true);
    try {
      const { name, email, password } = formData;
      await api.post('/users/register', { name, email, password });
      localStorage.setItem('user_name', name);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-bg-main font-sans relative overflow-hidden">
      
      {/* BACKGROUND EFEITOS MOBILE (Glows e Imagem) */}
      <div className="absolute inset-0 z-0 lg:hidden">
        <img 
          src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2022&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-15"
          alt="background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg-main via-bg-main/90 to-brand/10" />
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 right-[-10%] w-80 h-80 bg-brand/5 rounded-full blur-[120px]" />
      </div>

      {/* LADO ESQUERDO / FORMULÁRIO */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 overflow-y-auto custom-scrollbar">
        
        {/* Header com Logo (PNG Solto) */}
        <div className="text-center mb-8 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-20 h-20 md:w-24 md:h-24 mb-4 drop-shadow-[0_10px_15px_rgba(0,0,0,0.3)]">
            <img 
              src={logoImg} 
              alt="FinanceMAX Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <h1 className="text-brand text-3xl md:text-4xl font-black mb-1 italic tracking-tighter uppercase">
            Finance <span className="text-text-primary">MAX</span>
          </h1>
          <div className="flex items-center gap-2 opacity-60">
            <div className="h-[1px] w-4 bg-brand" />
            <p className="text-[9px] font-black text-text-secondary uppercase tracking-[0.3em]">
              Sistema Privado
            </p>
            <div className="h-[1px] w-4 bg-brand" />
          </div>
        </div>

        {/* Card de Registro Glassmorphism */}
        <div className="w-full max-w-md p-6 md:p-10 rounded-[2.5rem] 
                        bg-bg-card/70 backdrop-blur-2xl border border-white/5 
                        shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]
                        lg:bg-bg-card lg:backdrop-blur-none lg:border-border-ui
                        animate-in fade-in zoom-in-95 duration-500">
          
          {error && (
            <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl text-[10px] font-black uppercase tracking-wider text-center mb-6 border border-red-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome Completo */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-secondary ml-1 uppercase tracking-widest">Nome Completo</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 group-focus-within:text-brand transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Seu nome"
                  className="w-full pl-12 pr-4 py-3.5 bg-bg-main/40 border border-white/5 rounded-2xl focus:outline-none focus:border-brand/50 focus:bg-bg-main/80 transition-all text-text-primary font-bold text-sm"
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-secondary ml-1 uppercase tracking-widest">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 group-focus-within:text-brand transition-colors" size={18} />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-bg-main/40 border border-white/5 rounded-2xl focus:outline-none focus:border-brand/50 focus:bg-bg-main/80 transition-all text-text-primary font-bold text-sm"
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Grid de Senhas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-secondary ml-1 uppercase tracking-widest truncate">Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 group-focus-within:text-brand transition-colors" size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••"
                    className="w-full pl-10 pr-9 py-3 bg-bg-main/40 border border-white/5 rounded-xl focus:outline-none focus:border-brand/50 focus:bg-bg-main/80 transition-all text-text-primary font-bold text-sm"
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary opacity-40">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-secondary ml-1 uppercase tracking-widest truncate">Confirmar</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 group-focus-within:text-brand transition-colors" size={16} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••"
                    className="w-full pl-10 pr-9 py-3 bg-bg-main/40 border border-white/5 rounded-xl focus:outline-none focus:border-brand/50 focus:bg-bg-main/80 transition-all text-text-primary font-bold text-sm"
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary opacity-40">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-white font-black uppercase text-[11px] tracking-[0.2em] py-4 rounded-2xl shadow-xl shadow-brand/20 hover:shadow-brand/40 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 mt-4"
            >
              {loading ? <span className="animate-pulse">Criando...</span> : (
                <>
                  <UserPlus size={18} strokeWidth={3} />
                  <span>Cadastrar</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[10px] md:text-[11px] font-bold text-text-secondary uppercase tracking-widest">
            Já faz parte?{' '}
            <Link to="/login" className="text-brand font-black hover:underline underline-offset-4 transition-all">
              Fazer Login
            </Link>
          </p>
        </div>
      </div>

      {/* LADO DIREITO (Desktop) */}
      <div className="hidden lg:flex flex-1 relative bg-brand overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/90 to-black/70 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2022&auto=format&fit=crop" 
          alt="Gestão de Ativos Privados" 
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative z-20 p-12 text-white max-w-lg text-left">
          <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[3rem] border border-white/20 shadow-2xl">
            <ShieldCheck size={48} className="mb-6 text-white" />
            <h2 className="text-4xl font-black uppercase leading-[0.9] tracking-tighter mb-4 italic">
              Ambiente <br/> <span className="text-white/60">Privado</span>
            </h2>
            <p className="text-lg font-medium opacity-90 leading-relaxed text-white">
              Acesso exclusivo para convidados e administradores do FinanceMAX. Organize e monitore seu patrimônio com segurança.
            </p>
          </div>
        </div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default UserRegister;