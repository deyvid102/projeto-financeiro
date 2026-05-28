import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp, ArrowRight, Mail, Lock, Eye, EyeOff, ShieldCheck, Sparkles, Check, User, Zap,
  BarChart3, Wallet, Target, Brain, ArrowLeft,
} from 'lucide-react';
import api from '/src/services/api.js';
import { setStoredPlan } from '../../../utils/planUtils';
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

const PLANS = [
  {
    key: 'STARTER',
    name: 'Starter',
    price: 'R$ 0',
    period: 'Gratuito',
    popular: false,
    features: [
      'Dashboard simplificado',
      'Até 50 transações/mês',
      '3 caixinhas',
    ],
  },
  {
    key: 'PRO',
    name: 'Pro',
    price: 'R$ 29,90',
    period: '/mês',
    popular: true,
    features: [
      'Tudo do Starter',
      'Transações ilimitadas',
      'Gráficos de gastos',
      'Alocação de ativos',
      'Relatório IA (5 min)',
      'Cotações em tempo real',
      'Gestão de patrimônio',
      'UML Strategy',
    ],
  },
  {
    key: 'MAX',
    name: 'Max',
    price: 'R$ 59,90',
    period: '/mês',
    popular: false,
    features: [
      'Tudo do Pro',
      'Auditor IA (Chat)',
      'IA Instantânea',
      'Relatórios avançados',
      'Consultor dedicado',
      'Acesso antecipado',
    ],
  },
];

function UserRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: dados, 2: plano, 3: confirmação, 4: código
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [verificationCode, setVerificationCode] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('PRO');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Efeito para o countdown do reenvio
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Step 1: Validar dados
  const handleStepOne = (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Todos os campos são obrigatórios.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setStep(2);
  };

  // Step 2: Confirmar plano
  const handleStepTwo = (e) => {
    e.preventDefault();
    setStep(3);
  };

  // Step 3: Solicitar criação e enviar e-mail
  const requestRegistration = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/users/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      setStep(4);
      setResendTimer(60); // Inicia o timer ao mudar para o step 4
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao processar registro.');
    } finally {
      setLoading(false);
    }
  };

  // Função para reenviar o código
  const handleResendCode = async () => {
    if (resendTimer > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/users/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao reenviar código.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Validar código e concluir
  const handleVerification = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Verificar e-mail
      const verifyRes = await api.post('/users/verify-email', {
        email: formData.email,
        code: verificationCode,
      });
      localStorage.setItem('token', verifyRes.data.token);
      localStorage.setItem('user_name', formData.name);

      // 3. Criar subscription (com token autenticado)
      const subRes = await api.post('/subscriptions', {
        plan: selectedPlan,
        dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      });
      setStoredPlan(selectedPlan);

      // 4. Redirecionar ao dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar baseado no step
  if (step === 1) {
    return (
      <div className="home-page-container min-h-screen bg-background flex flex-col">
        {/* Nav */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/">
              <Logo />
            </Link>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-muted-foreground">Já tem conta?</span>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand text-white text-sm font-bold shadow-glow hover:opacity-90 transition"
              >
                Entrar <ArrowRight className="w-4 h-4" />
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
                <Sparkles className="w-3.5 h-3.5" /> Comece grátis agora
              </div>
              <h1 className="text-4xl font-black leading-[0.95] tracking-tight">
                CONTROLE SEU <span className="text-gradient italic-display">PATRIMÔNIO</span>
                <br /> COM INTELIGÊNCIA.
              </h1>
              <p className="mt-6 text-base text-muted-foreground max-w-xs">
                Crie sua conta gratuita e tenha acesso ao dashboard básico. Atualize para Pro ou Max a qualquer momento.
              </p>

              <div className="mt-10 grid grid-cols-2 gap-4">
                {[
                  { icon: BarChart3, t: 'Dashboard intuitivo' },
                  { icon: Wallet, t: 'Gestão de carteira' },
                  { icon: Target, t: 'Metas personalizadas' },
                  { icon: Brain, t: 'Inteligência artificial' },
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
                    <User className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">Criar conta</h2>
                  <p className="text-sm text-muted-foreground mt-1">Preencha seus dados para começar. Etapa 1 de 3</p>
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive p-4 rounded-2xl text-sm font-bold mb-6 border border-destructive/20 text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleStepOne} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Nome completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Seu nome"
                        className="w-full rounded-xl bg-muted/50 border border-border pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition placeholder:text-muted-foreground/60"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      E-mail
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Confirmar senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full rounded-xl bg-muted/50 border border-border pl-10 pr-11 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition placeholder:text-muted-foreground/60"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-brand text-white font-bold shadow-glow hover:scale-[1.02] active:scale-[0.98] transition"
                  >
                    Próxima etapa <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Já tem conta?{' '}
                  <Link to="/login" className="font-bold text-primary hover:underline">
                    Entrar
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="home-page-container min-h-screen bg-background flex flex-col">
        {/* Nav */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/">
              <Logo />
            </Link>
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary/80 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-4xl">
            <div className="animate-fade-up text-center mb-8">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                ESCOLHA SEU <span className="text-gradient italic-display">PLANO</span>
              </h2>
              <p className="text-base text-muted-foreground max-w-xl mx-auto">
                Comece com o Starter grátis ou escolha Pro/Max para desbloquear mais funcionalidades. Você pode trocar de plano a qualquer momento.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto">
              {PLANS.map((plan) => (
                <div
                  key={plan.key}
                  onClick={() => setSelectedPlan(plan.key)}
                  className={`relative rounded-3xl border p-8 cursor-pointer transition-all ${
                    selectedPlan === plan.key
                      ? 'bg-brand text-white border-transparent shadow-glow scale-105'
                      : 'bg-card border-border hover:border-primary hover:shadow-card'
                  }`}
                >
                  {plan.popular && selectedPlan === plan.key && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-foreground text-background text-[10px] font-black tracking-widest">
                      MAIS POPULAR
                    </span>
                  )}

                  <p className={`text-xs font-bold tracking-widest uppercase mb-2 ${selectedPlan === plan.key ? 'text-white/80' : 'text-muted-foreground'}`}>
                    {plan.period === 'Gratuito' ? 'Comece aqui' : 'Mais escolhido'}
                  </p>
                  <p className="text-3xl font-black italic mb-1">{plan.name}</p>
                  <p className="text-5xl font-black mb-1">{plan.price}</p>
                  <p className={`text-sm mb-6 ${selectedPlan === plan.key ? 'text-white/80' : 'text-muted-foreground'}`}>
                    {plan.period}
                  </p>

                  <ul className={`space-y-3 mb-8 ${selectedPlan === plan.key ? 'text-white' : ''}`}>
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-medium">
                        <Check className={`w-4 h-4 ${selectedPlan === plan.key ? 'text-white' : 'text-primary'}`} />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => setStep(3)}
                    className={`w-full py-3 rounded-full font-black transition ${
                      selectedPlan === plan.key
                        ? 'bg-white text-primary hover:scale-105'
                        : 'bg-foreground text-background hover:scale-105'
                    }`}
                  >
                    Continuar com {plan.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Step 3: Confirmação
  if (step === 3) return (
    <div className="home-page-container min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <button
            onClick={() => setStep(2)}
            className="flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary/80 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg">
          <div className="animate-fade-up">
            <div className="bg-card rounded-3xl shadow-card border border-border p-7 md:p-10 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand mb-6 shadow-glow mx-auto">
                <Zap className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-3xl font-black tracking-tight mb-3">Pronto para começar?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Você está criando uma conta com o plano <span className="font-bold text-foreground">{PLANS.find(p => p.key === selectedPlan)?.name}</span>.
              </p>

              {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-2xl text-sm font-bold mb-6 border border-destructive/20">
                  {error}
                </div>
              )}

              <form onSubmit={requestRegistration} className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-brand text-white font-black shadow-glow hover:scale-105 active:scale-[0.98] transition disabled:opacity-50"
                >
                  {loading ? 'Processando...' : (
                    <>
                      Confirmar e Enviar Código <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-sm text-muted-foreground mt-8">
                Já tem conta?{' '}
                <Link to="/login" className="font-bold text-primary hover:underline">
                  Entrar aqui
                </Link>
              </p>

              <div className="mt-8 pt-8 border-t border-border">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-4">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>Sua conta é protegida com encriptação TLS 1.3</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ao criar uma conta, você concorda com nossos{' '}
                  <a href="#" className="text-primary hover:underline">
                    Termos de Serviço
                  </a>{' '}
                  e{' '}
                  <a href="#" className="text-primary hover:underline">
                    Política de Privacidade
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  // Caso padrão (não deve ocorrer se o fluxo for seguido)
  if (step !== 4) return null;

  // Step 4: Código de Verificação
  return (
    <div className="home-page-container min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-[380px]">
          <div className="bg-card rounded-3xl shadow-card border border-border p-8 text-center">
            <h2 className="text-2xl font-black mb-2">Verifique seu e-mail</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Enviamos um código de 6 dígitos para <strong>{formData.email}</strong>
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
                {loading ? 'Verificando...' : 'Finalizar Cadastro'}
              </button>
            </form>

            <div className="mt-6 space-y-2">
              <button 
                onClick={handleResendCode}
                disabled={resendTimer > 0 || loading}
                className="text-xs font-bold text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
              >
                {resendTimer > 0 ? `Reenviar código em ${resendTimer}s` : 'Reenviar código'}
              </button>
              <br />
              <button 
                onClick={() => setStep(1)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground transition underline decoration-dotted"
              >
                Mudar e-mail ou dados
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default UserRegister;
