import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Wallet, Target, Sparkles, ShieldCheck, BarChart3,
  ArrowRight, Check, Brain, PiggyBank, CreditCard, Network,
  Bell, Zap, LineChart, Star,
} from 'lucide-react';
import './Home.css';
import logoImg from '../../assets/logo.png';

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

function Nav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#funcionalidades" className="hover:text-foreground transition">Funcionalidades</a>
          <a href="#auditor" className="hover:text-foreground transition">Auditor IA</a>
          <a href="#planos" className="hover:text-foreground transition">Planos</a>
          <a href="#depoimentos" className="hover:text-foreground transition">Depoimentos</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden sm:inline text-sm font-semibold text-foreground hover:text-primary transition">Entrar</Link>
          <Link to="/register" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand text-white text-sm font-bold shadow-glow hover:opacity-90 transition">
            Começar grátis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero">
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold tracking-widest uppercase text-primary mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Powered by IA
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tight">
            SEU <span className="text-gradient italic-display">PATRIMÔNIO</span>
            <br /> SOB CONTROLE
            <br /> TOTAL.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-lg">
            Dashboard estratégico, gestão de investimentos, metas inteligentes e um auditor IA que analisa cada decisão financeira sua em tempo real.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-brand text-white font-bold shadow-glow hover:scale-105 transition">
              Criar conta gratuita <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#funcionalidades" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border-2 border-foreground/10 font-bold hover:border-primary hover:text-primary transition">
              Ver funcionalidades
            </a>
          </div>
          <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Dados criptografados</div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Sem cartão</div>
          </div>
        </div>

        <HeroDashboard />
      </div>
    </section>
  );
}

function HeroDashboard() {
  const bars = [40, 65, 35, 80, 55, 90, 70, 95, 60, 85, 75, 100];
  return (
    <div className="relative animate-fade-up" style={{ animationDelay: '0.2s' }}>
      <div className="relative bg-card rounded-3xl shadow-card border border-border p-6 backdrop-blur">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Patrimônio total</p>
            <p className="text-3xl font-black mt-1">R$ <span className="text-gradient">127.483,20</span></p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/15 text-[oklch(0.45_0.15_155)] text-xs font-bold">
            <TrendingUp className="w-3 h-3" /> +12.4%
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Receitas', value: 'R$ 18.2k', color: 'text-[oklch(0.55_0.18_155)]' },
            { label: 'Despesas', value: 'R$ 9.4k', color: 'text-destructive' },
            { label: 'Invest.', value: '+R$ 2.8k', color: 'text-primary' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-muted/50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className={`text-sm font-black italic mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-muted/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider">Fluxo de caixa</p>
            <span className="text-[10px] font-bold text-primary">ANUAL</span>
          </div>
          <div className="flex items-end justify-between gap-1.5 h-32">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md animate-bar"
                style={{
                  height: `${h}%`,
                  background: i === bars.length - 1
                    ? 'var(--gradient-brand)'
                    : 'oklch(0.78 0.16 215 / 0.35)',
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating auditor IA card */}
      <div className="absolute -left-6 -bottom-8 w-64 bg-card rounded-2xl shadow-card border border-border p-4 animate-float hidden md:block">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="absolute inset-0 rounded-full animate-pulse-ring" />
          </div>
          <div>
            <p className="text-xs font-black">AUDITOR IA</p>
            <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Análise ativa</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground italic leading-relaxed">
          "Seus investimentos cresceram 12%. Considere realocar para renda fixa."
        </p>
      </div>

      {/* Floating meta card */}
      <div className="absolute -right-4 -top-6 w-48 bg-card rounded-2xl shadow-card border border-border p-4 animate-float hidden md:block" style={{ animationDelay: '1s' }}>
        <div className="flex items-center gap-2 mb-2">
          <PiggyBank className="w-5 h-5 text-primary" />
          <p className="text-xs font-black">VIAGEM JAPÃO</p>
        </div>
        <p className="text-lg font-black italic text-gradient">71.43%</p>
        <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
          <div className="h-full bg-brand rounded-full" style={{ width: '71.43%' }} />
        </div>
      </div>
    </div>
  );
}

function Stats() {
  const stats = [
    { value: '+50k', label: 'Usuários ativos' },
    { value: 'R$ 2.4B', label: 'Patrimônio monitorado' },
    { value: '98%', label: 'Satisfação' },
    { value: '24/7', label: 'Auditoria IA' },
  ];
  return (
    <section className="border-y border-border bg-card/50">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl md:text-4xl font-black italic text-gradient">{s.value}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: BarChart3, title: 'DASHBOARD ESTRATÉGICO', desc: 'Visão consolidada de receitas, despesas, cartões e investimentos em uma única tela.', color: 'from-[oklch(0.78_0.16_215)] to-[oklch(0.55_0.18_255)]' },
    { icon: Wallet, title: 'TRANSAÇÕES INTELIGENTES', desc: 'Categorização automática, recorrências e filtros avançados. Encontre tudo em segundos.', color: 'from-[oklch(0.7_0.18_155)] to-[oklch(0.78_0.16_215)]' },
    { icon: LineChart, title: 'GESTÃO DE PATRIMÔNIO', desc: 'Acompanhe ações, renda fixa e ativos em tempo real com gráficos de evolução.', color: 'from-[oklch(0.65_0.2_300)] to-[oklch(0.55_0.18_255)]' },
    { icon: Target, title: 'CAIXINHAS & METAS', desc: 'Crie objetivos, acompanhe progresso e guarde dinheiro de forma organizada.', color: 'from-[oklch(0.78_0.16_215)] to-[oklch(0.7_0.18_155)]' },
    { icon: Network, title: 'UML STRATEGY', desc: 'Mapeie suas fontes de renda, custos e metas em um fluxo visual conectado.', color: 'from-[oklch(0.55_0.18_255)] to-[oklch(0.65_0.2_300)]' },
    { icon: Brain, title: 'AUDITOR IA', desc: 'Análise contínua das suas finanças com sugestões personalizadas e prós/contras.', color: 'from-[oklch(0.78_0.16_215)] to-[oklch(0.62_0.22_25)]' },
  ];
  return (
    <section id="funcionalidades" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mb-14">
          <p className="text-xs font-bold tracking-widest uppercase text-primary mb-3">Funcionalidades</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">
            TUDO QUE VOCÊ PRECISA PARA <span className="text-gradient italic-display">DOMINAR</span> SUAS FINANÇAS.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="group relative bg-card rounded-2xl border border-border p-6 hover:shadow-card hover:-translate-y-1 transition-all">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-glow`}>
                <f.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-black text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AuditorSection() {
  return (
    <section id="auditor" className="py-24 bg-card/40 border-y border-border">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-primary mb-3">Auditor IA</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            UMA <span className="text-gradient italic-display">INTELIGÊNCIA</span> CUIDANDO DO SEU DINHEIRO.
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            O Auditor IA analisa cada transação, identifica padrões de gasto e sugere ajustes para você atingir suas metas mais rápido.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              'Análise de prós e contras a cada decisão',
              'Sugestões personalizadas de economia',
              'Alertas inteligentes em tempo real',
              'Recomendações de produtos e ofertas',
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
                </div>
                <span className="font-medium">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="bg-card rounded-3xl shadow-card border border-border p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="absolute inset-0 rounded-2xl animate-pulse-ring" />
              </div>
              <div>
                <p className="font-black">AUDITOR IA</p>
                <p className="text-xs text-primary font-bold uppercase tracking-wider">Análise ativa</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { icon: Zap, t: 'Você gastou 23% a mais em delivery este mês.', c: 'bg-destructive/10 border-destructive/30' },
                { icon: TrendingUp, t: 'PETR3 valorizou 2.37%. Bom momento para realizar lucro.', c: 'bg-success/10 border-success/30' },
                { icon: Bell, t: "Sua meta 'Viagem Japão' está em 71%. Continue assim!", c: 'bg-primary/10 border-primary/30' },
              ].map((m, i) => (
                <div key={i} className={`flex gap-3 p-3 rounded-xl border ${m.c}`}>
                  <m.icon className="w-5 h-5 mt-0.5 text-primary shrink-0" />
                  <p className="text-sm font-medium italic">"{m.t}"</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <input
                className="flex-1 rounded-full bg-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                placeholder="Pergunte algo sobre sua conta..."
              />
              <button className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center shadow-glow">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Modules() {
  const modules = [
    { icon: Wallet, t: 'Carteira' }, { icon: CreditCard, t: 'Cartões' },
    { icon: LineChart, t: 'Investimentos' }, { icon: Target, t: 'Metas' },
    { icon: Network, t: 'Strategy' }, { icon: Brain, t: 'Auditor IA' },
    { icon: Bell, t: 'Alertas' }, { icon: BarChart3, t: 'Relatórios' },
  ];
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-black mb-3">
          MÓDULOS <span className="text-gradient italic-display">INTEGRADOS</span>
        </h2>
        <p className="text-muted-foreground mb-12">Tudo conversa entre si. Uma única plataforma, infinitas possibilidades.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {modules.map((m) => (
            <div key={m.t} className="group flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-glow transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-brand group-hover:scale-110 transition-all">
                <m.icon className="w-6 h-6 text-primary group-hover:text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">{m.t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { n: 'Marina S.', r: 'Investidora', t: 'Mudou minha forma de enxergar dinheiro. O Auditor IA é tipo ter um consultor 24/7.' },
    { n: 'Carlos R.', r: 'Empreendedor', t: 'Consegui organizar receitas e despesas da empresa e pessoais em um só lugar. Sensacional.' },
    { n: 'Ana P.', r: 'Designer', t: 'As caixinhas me ajudaram a juntar pra viagem dos sonhos. Em 8 meses bati a meta!' },
  ];
  return (
    <section id="depoimentos" className="py-24 bg-card/40 border-y border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-widest uppercase text-primary mb-3">Depoimentos</p>
          <h2 className="text-4xl md:text-5xl font-black">QUEM USA, <span className="text-gradient italic-display">RECOMENDA</span>.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {items.map((i) => (
            <div key={i.n} className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, k) => <Star key={k} className="w-4 h-4 fill-primary text-primary" />)}
              </div>
              <p className="text-foreground mb-5 italic leading-relaxed">"{i.t}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-black">{i.n[0]}</div>
                <div>
                  <p className="font-black text-sm">{i.n}</p>
                  <p className="text-xs text-muted-foreground">{i.r}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    { n: 'STARTER', p: 'R$ 0', d: 'Para começar', f: ['Dashboard simplificado', 'Até 50 transações/mês', '3 caixinhas', 'Suporte por e-mail'], h: false },
    { n: 'PRO', p: 'R$ 29,90', d: 'Mais popular', f: ['Tudo do Starter', 'Transações ilimitadas', 'Gráficos de gastos', 'Alocação de ativos', 'Relatório IA (5 min)', 'Cotações em tempo real', 'Gestão de patrimônio', 'UML Strategy'], h: true },
    { n: 'MAX', p: 'R$ 59.9', d: 'Para investidores', f: ['Tudo do Pro', 'Auditor IA (Chat)', 'IA Instantânea', 'Relatórios avançados', 'Consultor dedicado', 'Acesso antecipado'], h: false },
  ];
  return (
    <section id="planos" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-widest uppercase text-primary mb-3">Planos</p>
          <h2 className="text-4xl md:text-5xl font-black">ESCOLHA SEU <span className="text-gradient italic-display">NÍVEL</span>.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {plans.map((p) => (
            <div key={p.n} className={`relative rounded-3xl border p-8 ${p.h ? 'bg-brand text-white border-transparent shadow-glow scale-105' : 'bg-card border-border'}`}>
              {p.h && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-foreground text-background text-[10px] font-black tracking-widest">MAIS POPULAR</span>}
              <p className={`text-xs font-bold tracking-widest uppercase ${p.h ? 'text-white/80' : 'text-muted-foreground'}`}>{p.d}</p>
              <p className="text-3xl font-black italic mt-2">{p.n}</p>
              <p className="text-5xl font-black mt-4">{p.p}<span className={`text-base font-medium ${p.h ? 'text-white/80' : 'text-muted-foreground'}`}>/mês</span></p>
              <ul className={`mt-6 space-y-2.5 text-sm ${p.h ? 'text-white' : ''}`}>
                {p.f.map((feat) => (
                  <li key={feat} className="flex items-center gap-2">
                    <Check className={`w-4 h-4 ${p.h ? 'text-white' : 'text-primary'}`} strokeWidth={3} />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link to="/register" className={`mt-8 block w-full py-3 rounded-full font-black text-center ${p.h ? 'bg-white text-primary hover:scale-105' : 'bg-foreground text-background hover:scale-105'} transition`}>
                Começar agora
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24 bg-hero">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-[1]">
          PRONTO PARA <span className="text-gradient italic-display">MAXIMIZAR</span> SUAS FINANÇAS?
        </h2>
        <p className="mt-6 text-lg text-muted-foreground">
          Junte-se a milhares de pessoas que já transformaram a forma de gerir dinheiro.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-brand text-white font-black shadow-glow hover:scale-105 transition">
            Criar conta gratuita <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#planos" className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-foreground/15 font-black hover:border-primary hover:text-primary transition">
            Ver planos
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between gap-6">
        <div>
          <Logo />
          <p className="text-sm text-muted-foreground mt-3 max-w-xs">
            Sua plataforma de gestão financeira inteligente com IA.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-10 text-sm">
          <div>
            <p className="font-black text-xs uppercase tracking-widest mb-3">Produto</p>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#funcionalidades" className="hover:text-foreground transition">Funcionalidades</a></li>
              <li><a href="#planos" className="hover:text-foreground transition">Planos</a></li>
              <li><a href="#auditor" className="hover:text-foreground transition">Auditor IA</a></li>
            </ul>
          </div>
          <div>
            <p className="font-black text-xs uppercase tracking-widest mb-3">Empresa</p>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition">Sobre</a></li>
              <li><a href="#" className="hover:text-foreground transition">Blog</a></li>
              <li><a href="#" className="hover:text-foreground transition">Contato</a></li>
            </ul>
          </div>
          <div>
            <p className="font-black text-xs uppercase tracking-widest mb-3">Legal</p>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition">Privacidade</a></li>
              <li><a href="#" className="hover:text-foreground transition">Termos</a></li>
              <li><a href="#" className="hover:text-foreground transition">Cookies</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-10 pt-6 border-t border-border text-xs text-muted-foreground text-center">
        © 2026 FinanceMAX. Todos os direitos reservados.
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="home-page-container min-h-screen bg-background">
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Features />
        <AuditorSection />
        <Modules />
        <Testimonials />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
