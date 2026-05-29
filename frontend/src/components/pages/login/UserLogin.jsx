import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp, ArrowRight, Mail, Lock, Eye, EyeOff, ShieldCheck, Sparkles,
  BarChart3, Wallet, Target, Brain, ArrowLeft,
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
  const [step, setStep] = useState(1); // 1: Login, 2: Verificação de Código
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Efeito para o countdown do reenvio de código
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleGoogleLoginSuccess = async (response) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/users/google-login', { idToken: response.credential });
      localStorage.setItem('token', res.data.token);
      const userName = res.data.name;
      if (userName) localStorage.setItem('user_name', userName);
      await fetchAndStoreUserPlan(api);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao fazer login com Google.');
    } finally {
      setLoading(false);
    }
  };

  // Google Login Integration
  useEffect(() => {
    if (step !== 1) return; // Só tenta renderizar se estiver na tela de login

    const scriptId = 'google-gsi-client';
    let script = document.getElementById(scriptId);

    const renderGoogleButton = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const buttonDiv = document.getElementById('google-sign-in-button');

      if (!clientId) {
        // Se o clientId ainda não carregou, não faz nada para não poluir o console
        return;
      }

      if (window.google?.accounts?.id && buttonDiv) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleLoginSuccess,
          auto_select: false,
          locale: 'pt_BR' // Garante que o texto do Google venha em Português
        });
        window.google.accounts.id.renderButton(buttonDiv, {
          theme: 'outline', size: 'large', text: 'signin_with', width: '100%', shape: 'pill'
        });
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = renderGoogleButton;
      document.body.appendChild(script);
    } else {
      // Se o script já existe, aguarda um instante para o React montar a div e renderiza
      const timeout = setTimeout(renderGoogleButton, 100);
      return () => clearTimeout(timeout);
    }
  }, [step]); // Adicionado step como dependência para renderizar o botão ao voltar para o login

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/users/login', { email, password });
      localStorage.setItem('token', response.data.token);
      const userName = response.data.name;
      if (userName) localStorage.setItem('user_name', userName);
      await fetchAndStoreUserPlan(api);
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || '';
      
      // Captura tanto 401 quanto 403 para o fluxo de verificação
      if ((err.response?.status === 401 || err.response?.status === 403) && (message.includes('verificado') || message.includes('expirou'))) {
        setStep(2);
        setResendTimer(60);
      } else {
        setError(message || 'E-mail ou senha incorretos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const verifyRes = await api.post('/users/verify-email', {
        email,
        code: verificationCode,
      });
      
      localStorage.setItem('token', verifyRes.data.token);
      const userName = verifyRes.data.name;
      if (userName) localStorage.setItem('user_name', userName);
      
      await fetchAndStoreUserPlan(api);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || loading) return;
    await handleSubmit();
  };

  // Renderização do passo de verificação (similar ao UserRegister)
  if (step === 2) {
    return (
      <div className="home-page-container min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/">
              <Logo />
            </Link>
            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary/80 transition">
              <ArrowLeft className="w-4 h-4" /> Voltar ao login
            </button>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-[380px]">
            <div className="bg-card rounded-3xl shadow-card border border-border p-7 text-center animate-fade-up">
              <h2 className="text-2xl font-black mb-2">Verifique seu e-mail</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Enviamos um código de verificação para <strong>{email}</strong>
              </p>

              {error && <div className="bg-destructive/10 text-destructive p-3 rounded-xl text-xs font-bold mb-4">{error}</div>}

              <form onSubmit={handleVerification} className="space-y-4">
                <input
                  type="text"
                  maxLength="6"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center text-3xl font-black tracking-[0.5em] py-4 rounded-2xl bg-muted/50 border border-border outline-none focus:ring-2 focus:ring-brand"
                  required
                />
                <button
                  type="submit"
                  disabled={loading || verificationCode.length < 6}
                  className="w-full py-4 rounded-full bg-brand text-white font-black shadow-glow disabled:opacity-50"
                >
                  {loading ? 'Verificando...' : 'Confirmar e Entrar'}
                </button>
              </form>

              <div className="mt-6">
                <button 
                  onClick={handleResendCode}
                  disabled={resendTimer > 0 || loading}
                  className="text-xs font-bold text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                >
                  {resendTimer > 0 ? `Reenviar código em ${resendTimer}s` : 'Reenviar código'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-10 items-center">
          {/* Left — Marketing */}
          <div className="hidden lg:block animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold tracking-widest uppercase text-primary mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Bem-vindo de volta
            </div>
            <h1 className="text-4xl font-black leading-[0.95] tracking-tight">
              SEU <span className="text-gradient italic-display">PATRIMÔNIO</span>
              <br /> ESPERA POR VOCÊ.
            </h1>
            <p className="mt-6 text-base text-muted-foreground max-w-xs">
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
            <div className="bg-card rounded-3xl shadow-card border border-border p-7 md:p-9">
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
                  <Link 
                    to="/forgot-password" 
                    className={`text-sm font-bold text-primary hover:underline ${loading ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    Esqueceu a senha?
                  </Link>
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

                <div id="google-sign-in-button" className="w-full"></div>
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
