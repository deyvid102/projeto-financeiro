import React, { useState, useEffect } from 'react';
import { BrainCircuit, RefreshCcw, Maximize2, Sparkles, Loader2, Send, Lock } from 'lucide-react';
import AiFullReportModal from './AiFullReportModal';
import AiAnswerModal from './AiAnswerModal';
import api from '@/services/api';
import { getStoredPlan, isPlanAtLeast } from '../../../utils/planUtils';

const AiMentorReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const userPlan = getStoredPlan();
  const isProEligible = isPlanAtLeast(userPlan, 'PRO');
  const isMaxEligible = isPlanAtLeast(userPlan, 'MAX');

  // Estados para a Feature de Pergunta Direta e Modal de Resposta
  const [question, setQuestion] = useState("");
  const [activeQuestion, setActiveQuestion] = useState(""); // Guarda a pergunta enviada para o modal
  const [aiAnswer, setAiAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [cooldownMsg, setCooldownMsg] = useState("");
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);

  const fetchAiReport = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ai/report');
      
      setCooldownMsg("");
      if (data && data.insight) {
        setReportData(data.insight);
        localStorage.setItem('last_ai_insight_v2', JSON.stringify({
          objectData: data.insight,
          date: new Date().toISOString()
        }));
      }
    } catch (error) {
      if (error.response?.status === 403 && error.response.data.message.includes('minuto')) {
        setCooldownMsg(error.response.data.message);
      }
      console.error("Erro ao chamar Mentor IA:", error);
      setReportData({
        conselhoCurto: "O motor de auditoria está recalibrando os parâmetros. Tente novamente em instantes.",
        eficienciaRetencao: 0,
        alertas: [],
        estrategias: [],
        pontosPositivos: [],
        pontosNegativos: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isProEligible) {
      return;
    }

    const cached = localStorage.getItem('last_ai_insight_v2');
    if (cached) {
      const { objectData, date } = JSON.parse(cached);
      const isToday = new Date(date).toDateString() === new Date().toDateString();
      if (isToday) {
        setReportData(objectData);
      } else {
        fetchAiReport();
      }
    } else {
      fetchAiReport();
    }
  }, [isProEligible]);

  // Enviar pergunta customizada para o novo endpoint
  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim() || asking) return;

    const currentQuestion = question;
    setActiveQuestion(currentQuestion);
    setAsking(true);
    setAiAnswer(""); 
    
    try {
      const { data } = await api.post('/ai/ask', { question: currentQuestion });
      setAiAnswer(data.answer);
      setQuestion(""); // Limpa o input após o envio com sucesso
      setIsAnswerModalOpen(true); // Abre o modal de resposta imediatamente
    } catch (error) {
      setAiAnswer("Não consegui processar sua dúvida financeira no momento. Tente novamente.");
      setIsAnswerModalOpen(true); // Abre o modal mesmo com erro para alertar o usuário
    } finally {
      setAsking(false);
    }
  };

  const previewText = reportData?.conselhoCurto;

  if (!isProEligible) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-[#0D0D12] border border-gray-200 dark:border-white/5 p-6 shadow-xl text-center">
        <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-3xl bg-brand/10 text-brand mx-auto">
          <BrainCircuit size={20} />
        </div>
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-text-primary mb-2">Auditor IA</h3>
        <p className="text-[11px] text-text-secondary leading-relaxed mb-6">
          O Auditor IA está disponível apenas para os planos <span className="font-black">Pro</span> e <span className="font-black">Max</span>.
        </p>
        <div className="inline-flex flex-col gap-3">
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-secondary">Faça upgrade para liberar:</span>
          <ul className="text-[11px] text-text-primary space-y-2 text-left">
            <li>• Relatórios financeiros avançados</li>
            <li>• Sugestões inteligentes</li>
            <li>• Assistente de perguntas financeiras</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-[#0D0D12] border border-gray-200 dark:border-white/5 p-6 group hover:border-brand/20 transition-all duration-500 shadow-xl">
        
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-brand/5 dark:bg-brand/10 blur-[40px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand/10 rounded-xl border border-brand/20">
              <BrainCircuit size={16} className="text-brand" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white italic block leading-none">Auditor IA</span>
              <span className="text-[8px] text-brand font-bold uppercase tracking-tighter mt-1 block animate-pulse">Análise Ativa</span>
            </div>
          </div>
          
          {isMaxEligible && (
            <button 
              onClick={fetchAiReport}
              disabled={loading}
              className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-full text-gray-400 hover:text-brand transition-all disabled:opacity-30"
            >
              {loading ? <Loader2 size={13} className="animate-spin text-brand" /> : <RefreshCcw size={13} />}
            </button>
          )}
        </div>

        {/* Diagnóstico clicável para abrir o relatório completo */}
        <div 
          className="cursor-pointer relative z-10 mb-4" 
          onClick={() => reportData && !loading && setIsModalOpen(true)}
        >
          {loading && !reportData ? (
            <div className="space-y-2.5 py-1 animate-pulse">
              <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full w-full" />
              <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full w-[92%]" />
            </div>
          ) : (
            <div>
              {cooldownMsg && (
                <p className="text-[9px] font-bold text-amber-500 uppercase mb-2 animate-pulse">
                  {cooldownMsg}
                </p>
              )}
              <p className="text-[12px] leading-relaxed text-gray-600 dark:text-gray-400 font-medium italic line-clamp-3">
                {previewText ? `"${previewText}"` : "Avaliando e cruzando o histórico de movimentações com suas metas ativas..."}
              </p>
              
              {previewText && (
                <div className="mt-3 pt-2 flex items-center justify-between border-t border-gray-50 dark:border-white/[0.02]">
                  <div className="flex items-center gap-1.5 text-brand">
                    <Sparkles size={10} />
                    <span className="text-[9px] font-black uppercase tracking-wider">Ver Prós e Contras</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                    Expandir Auditoria <Maximize2 size={10} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Seção Interativa de Perguntas (Chat Direto) */}
        <div className="pt-3 border-t border-gray-100 dark:border-white/5 relative z-10 overflow-hidden">
          {!isMaxEligible ? (
            <div className="flex items-center justify-center py-2 gap-2 bg-gray-50 dark:bg-white/[0.02] rounded-xl opacity-60">
              <Lock size={10} className="text-brand" />
              <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary">
                Chat exclusivo para <span className="text-brand">MAX</span>
              </span>
            </div>
          ) : (
            <form onSubmit={handleAskQuestion} className="relative flex items-center">
              <input 
                type="text" 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Pergunte algo sobre sua conta..."
                className="w-full text-[11px] bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-xl pl-3 pr-8 py-2 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:border-brand/40 transition-colors"
              />
              <button 
                type="submit" 
                disabled={asking || !question.trim()}
                className="absolute right-1.5 p-1.5 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-20"
              >
                {asking ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
              </button>
            </form>
          )}
        </div>

      </div>

      {/* Modal 1: Relatório Completo Automatizado */}
      <AiFullReportModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        reportData={reportData}
      />

      {/* Modal 2: Resposta Direta da Pergunta do Chat */}
      <AiAnswerModal 
        isOpen={isAnswerModalOpen}
        onClose={() => setIsAnswerModalOpen(false)}
        question={activeQuestion}
        answer={aiAnswer}
      />
    </>
  );
};

export default AiMentorReport;