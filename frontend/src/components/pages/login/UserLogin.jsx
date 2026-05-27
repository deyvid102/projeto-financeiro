import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp, ArrowRight, Mail, Lock, Eye, EyeOff, ShieldCheck, Sparkles,
  BarChart3, Wallet, Target, Brain,
} from 'lucide-react';
import api from '/src/services/api.js';
import { fetchAndStoreUserPlan } from '../../../utils/planUtils';
import '../Home.css';

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center shadow-glow">
          <TrendingUp className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
      </div>
      <span className="text-xl font-black tracking-tight">
        FINANCE<span className="text-gradient italic-display">MAX</span>
      </span>
    </div>
  );
}

function UserLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/users/login', { email, password });
      localStorage.setItem('token', response.data.token);
      const userName = response.data.user?.name || response.data.name;
      if (userName) localStorage.setItem('user_name', userName);
      await fetchAndStoreUserPlan(api);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page-container min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-muted-foreground">Não tem conta?</span>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand text-white text-sm font-bold shadow-glow hover:opacity-90 transition"
            >
              Criar conta <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Marketing */}
          <div className="hidden lg:block animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold tracking-widest uppercase text-primary mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Bem-vindo de volta
            </div>
            <h1 className="text-5xl font-black leading-[0.95] tracking-tight">
              SEU <span className="text-gradient italic-display">PATRIMÔNIO</span>
              <br /> ESPERA POR VOCÊ.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-md">
              Acesse seu dashboard, acompanhe investimentos, metas e deixe o Auditor IA guiar suas decisões financeiras.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {[
                { icon: BarChart3, t: 'Dashboard em tempo real' },
                { icon: Wallet, t: 'Carteira e transações' },
                { icon: Target, t: 'Metas inteligentes' },
                { icon: Brain, t: 'Auditor IA 24/7' },
              ].map((item) => (
                <div key={item.t} className="flex items-center gap-3 rounded-xl bg-card/60 border border-border p-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-bold">{item.t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Form */}
          <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <div className="bg-card rounded-3xl shadow-card border border-border p-8 md:p-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand mb-4 shadow-glow">
                  <TrendingUp className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-black tracking-tight">Entrar na conta</h2>
                <p className="text-sm text-muted-foreground mt-1">Digite seus dados para acessar o FinanceMAX.</p>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-2xl text-sm font-bold mb-6 border border-destructive/20 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full rounded-xl bg-muted/50 border border-border pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition placeholder:text-muted-foreground/60"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl bg-muted/50 border border-border pl-10 pr-11 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition placeholder:text-muted-foreground/60"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-border accent-primary" />
                    <span className="text-sm text-muted-foreground">Lembrar de mim</span>
                  </label>
                  <a href="#" className="text-sm font-bold text-primary hover:underline">
                    Esqueceu a senha?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-brand text-white font-bold shadow-glow hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50"
                >
                  {loading ? 'Autenticando...' : (
                    <>
                      Entrar <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground font-bold tracking-wider">ou</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-foreground/10 font-bold hover:border-primary hover:text-primary transition"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l2.85 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Entrar com Google
                </button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Ainda não tem conta?{' '}
                <Link to="/register" className="font-bold text-primary hover:underline">
                  Criar conta
                </Link>
              </p>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>Conexão criptografada com TLS 1.3</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default UserLogin;
