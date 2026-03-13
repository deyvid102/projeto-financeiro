import React, { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api';

const UserLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-bg-main p-4">
      <div className="text-center mb-8">
        <h1 className="text-brand text-4xl font-bold mb-1">FinanceApp</h1>
        <p className="text-text-secondary text-sm">Entre na sua conta</p>
      </div>

      <div className="bg-bg-card w-full max-w-md p-8 rounded-3xl shadow-xl shadow-blue-500/5 border border-border-ui">
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl text-xs text-center mb-6 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary ml-1 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={20} />
              <input
                type="email"
                placeholder="seu@email.com"
                className="w-full pl-12 pr-4 py-3 bg-bg-main border border-border-ui rounded-xl focus:outline-none focus:border-brand transition-all text-text-primary"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary ml-1 uppercase tracking-wider">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={20} />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 bg-bg-main border border-border-ui rounded-xl focus:outline-none focus:border-brand transition-all text-text-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-brand to-blue-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-brand/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
          >
            {loading ? 'Entrando...' : (
              <>
                <LogIn size={20} />
                <span>Entrar</span>
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-text-secondary">
          Não tem uma conta?{' '}
          <Link to="/register" className="text-brand font-bold hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
};

export default UserLogin;