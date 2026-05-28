import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp, ArrowRight, Mail, Lock, Eye, EyeOff, ArrowLeft, ShieldCheck, Key
} from 'lucide-react';
import api from '/src/services/api.js';
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

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: Código, 3: Nova Senha
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/users/forgot-password', { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao processar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/users/reset-password', { email, code, newPassword });
      setSuccess('Senha atualizada com sucesso!');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao resetar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page-container min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => step === 1 ? navigate('/login') : setStep(step - 1)} className="flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary/80 transition">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <Logo />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-[400px]">
          <div className="bg-card rounded-3xl shadow-card border border-border p-8 text-center animate-fade-up">
            {success ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-2xl font-black">Sucesso!</h2>
                <p className="text-sm text-muted-foreground">{success}</p>
                <p className="text-xs text-muted-foreground">Redirecionando para o login...</p>
              </div>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand mb-4 shadow-glow">
                  <Key className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl font-black mb-2">Recuperar senha</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {step === 1 && "Informe seu e-mail para receber um código de recuperação."}
                  {step === 2 && `Enviamos um código para ${email}`}
                  {step === 3 && "Crie uma nova senha segura para sua conta."}
                </p>

                {error && <div className="bg-destructive/10 text-destructive p-3 rounded-xl text-xs font-bold mb-4 border border-destructive/20">{error}</div>}

                {step === 1 && (
                  <form onSubmit={handleRequestReset} className="space-y-4">
                    <div className="relative text-left">
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">E-mail</label>
                      <Mail className="absolute left-3.5 top-[38px] w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full rounded-xl bg-muted/50 border border-border pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition"
                      />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3.5 rounded-full bg-brand text-white font-bold shadow-glow hover:opacity-90 transition disabled:opacity-50">
                      {loading ? 'Enviando...' : 'Enviar Código'}
                    </button>
                  </form>
                )}

                {step === 2 && (
                  <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-4">
                    <div className="relative text-left">
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">Código de 6 dígitos</label>
                      <input
                        type="text"
                        maxLength="6"
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-full text-center text-3xl font-black tracking-[0.5em] py-4 rounded-2xl bg-muted/50 border border-border outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>
                    <button type="submit" disabled={code.length < 6} className="w-full py-3.5 rounded-full bg-brand text-white font-bold shadow-glow hover:opacity-90 transition disabled:opacity-50">
                      Próxima etapa
                    </button>
                  </form>
                )}

                {step === 3 && (
                  <form onSubmit={handleVerifyAndReset} className="space-y-4 text-left">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Nova Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl bg-muted/50 border border-border pl-10 pr-11 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition"
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
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Confirmar Nova Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl bg-muted/50 border border-border pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary transition"
                        />
                      </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3.5 rounded-full bg-brand text-white font-bold shadow-glow hover:opacity-90 transition disabled:opacity-50 mt-2">
                      {loading ? 'Atualizando...' : 'Redefinir Senha'}
                    </button>
                  </form>
                )}
              </>
            )}

            {!success && (
              <div className="mt-8 pt-6 border-t border-border">
                <Link to="/login" className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-2">
                  Lembrou a senha? Fazer login
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ForgotPassword;