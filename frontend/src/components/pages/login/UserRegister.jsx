import React, { useState } from 'react';
import { UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from "../../../services/api";
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

    // Validação de Senhas Iguais
    if (formData.password !== formData.confirmPassword) {
      return setError('As senhas não coincidem.');
    }

    setLoading(true);
    try {
      const { name, email, password } = formData;
      await api.post('/users/register', { name, email, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-bg-main p-4 font-sans">
      {/* Header com Logo Image */}
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="w-20 h-20 mb-4">
          <img 
            src={logoImg} 
            alt="FinanceMAX Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-brand text-4xl font-black mb-1 italic tracking-tighter uppercase">
          Finance <span className="text-text-primary">MAX</span>
        </h1>
        <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.3em] opacity-70">
          Crie sua conta no sistema
        </p>
      </div>

      <div className="bg-bg-card w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl shadow-brand/5 border border-border-ui">
        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl text-[11px] font-black uppercase tracking-wider text-center mb-6 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-secondary ml-1 uppercase tracking-widest">Nome Completo</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 group-focus-within:text-brand transition-colors" size={18} />
              <input
                type="text"
                placeholder="Ex: Deyvid Wellington"
                className="w-full pl-12 pr-4 py-3.5 bg-bg-main border border-border-ui rounded-2xl focus:outline-none focus:border-brand transition-all text-text-primary font-bold text-sm"
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
                className="w-full pl-12 pr-4 py-3.5 bg-bg-main border border-border-ui rounded-2xl focus:outline-none focus:border-brand transition-all text-text-primary font-bold text-sm"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-secondary ml-1 uppercase tracking-widest">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 group-focus-within:text-brand transition-colors" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3.5 bg-bg-main border border-border-ui rounded-2xl focus:outline-none focus:border-brand transition-all text-text-primary font-bold text-sm"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Repetir Senha */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-secondary ml-1 uppercase tracking-widest">Confirmar Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 group-focus-within:text-brand transition-colors" size={18} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3.5 bg-bg-main border border-border-ui rounded-2xl focus:outline-none focus:border-brand transition-all text-text-primary font-bold text-sm"
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 hover:opacity-100 transition-opacity cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white font-black uppercase text-[11px] tracking-[0.2em] py-4 rounded-2xl hover:shadow-2xl hover:shadow-brand/30 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 mt-6 active:scale-95"
          >
            {loading ? 'Processando...' : (
              <>
                <UserPlus size={18} strokeWidth={3} />
                <span>Criar minha conta</span>
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-[11px] font-bold text-text-secondary uppercase tracking-widest">
          Já faz parte?{' '}
          <Link to="/login" className="text-brand font-black hover:underline underline-offset-4 transition-all">
            Fazer Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default UserRegister;