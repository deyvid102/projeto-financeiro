import React, { useState } from 'react';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from "../../../services/api";
// Importação da logo
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
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'E-mail ou senha incorretos.');
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
          Acesse sua conta no sistema
        </p>
      </div>

      <div className="bg-bg-card w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl shadow-brand/5 border border-border-ui">
        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl text-[11px] font-black uppercase tracking-wider text-center mb-6 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Campo Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-secondary ml-1 uppercase tracking-widest">E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 group-focus-within:text-brand transition-colors" size={18} />
              <input
                type="email"
                placeholder="seu@email.com"
                className="w-full pl-12 pr-4 py-3.5 bg-bg-main border border-border-ui rounded-2xl focus:outline-none focus:border-brand transition-all text-text-primary font-bold text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Campo Senha com Olhinho */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-secondary ml-1 uppercase tracking-widest">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 group-focus-within:text-brand transition-colors" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3.5 bg-bg-main border border-border-ui rounded-2xl focus:outline-none focus:border-brand transition-all text-text-primary font-bold text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-white font-black uppercase text-[11px] tracking-[0.2em] py-4 rounded-2xl hover:shadow-2xl hover:shadow-brand/30 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 mt-6 active:scale-95"
          >
            {loading ? 'Entrando...' : (
              <>
                <LogIn size={18} strokeWidth={3} />
                <span>Entrar no sistema</span>
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-[11px] font-bold text-text-secondary uppercase tracking-widest">
          Não tem uma conta?{' '}
          <Link to="/register" className="text-brand font-black hover:underline underline-offset-4 transition-all">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
};

export default UserLogin;