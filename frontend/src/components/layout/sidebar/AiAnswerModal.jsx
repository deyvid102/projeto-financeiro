import React from 'react';
import { X, Sparkles, HelpCircle } from 'lucide-react';

// Função auxiliar para renderizar Markdown simples da IA (Negrito e Listas)
const formatAIResponse = (text) => {
  if (!text) return null;

  return text.split('\n').map((line, lineIndex) => {
    // Linhas em branco viram espaçamento
    if (!line.trim()) return <div key={lineIndex} className="h-1.5" />;

    // Verifica se a linha é um item de lista (começa com traço ou asterisco)
    const isListItem = /^[-*]\s+/.test(line);
    let content = line;
    
    if (isListItem) {
      content = line.replace(/^[-*]\s+/, ''); // Remove o marcador original
    }

    // Processa o negrito (tudo que estiver entre **)
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = content.split(boldRegex);

    const formattedContent = parts.map((part, i) => 
      i % 2 === 1 ? <strong key={i} className="text-gray-900 dark:text-white font-bold">{part}</strong> : part
    );

    // Renderiza como lista estilizada
    if (isListItem) {
      return (
        <div key={lineIndex} className="flex items-start gap-2 mb-2 ml-1">
          <span className="text-brand font-bold text-lg leading-none mt-[-3px]">•</span>
          <span className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">{formattedContent}</span>
        </div>
      );
    }

    // Renderiza como parágrafo normal
    return (
      <p key={lineIndex} className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed mb-2.5 last:mb-0">
        {formattedContent}
      </p>
    );
  });
};

const AiAnswerModal = ({ isOpen, onClose, question, answer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0D0D12] border border-gray-100 dark:border-white/5 w-full max-w-[460px] rounded-[28px] overflow-hidden flex flex-col shadow-2xl transition-colors scale-in-95 duration-200">
        
        {/* Header do Modal */}
        <div className="p-5 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand/10 dark:bg-brand/20 text-brand rounded-xl">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-gray-900 dark:text-white font-bold text-base leading-none">Consulta ao Mentor</h2>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mt-1">Resposta baseada na sua conta</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh] scrollbar-none">
          
          {/* Pergunta feita pelo Usuário */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex gap-2.5 items-start">
            <HelpCircle size={15} className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">Sua Pergunta</span>
              <p className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 leading-normal">
                "{question}"
              </p>
            </div>
          </div>

          {/* Resposta Gerada pela IA */}
          <div className="relative p-5 rounded-3xl bg-brand/[0.03] border border-brand/10 overflow-hidden">
            <span className="text-[9px] font-black uppercase tracking-widest text-brand mb-3 flex items-center gap-2">
              <span className="h-1 w-3 bg-brand rounded-full" />
              Análise de Resposta
            </span>
            
            {/* O conteúdo passa pelo nosso formatador nativo */}
            <div className="ai-formatted-content">
              {formatAIResponse(answer)}
            </div>
          </div>

        </div>

        {/* Rodapé */}
        <div className="p-3 bg-gray-50/50 dark:bg-white/[0.01] border-t border-gray-100 dark:border-white/5 text-center text-gray-400/60 dark:text-gray-500 text-[8px] font-bold uppercase tracking-widest">
          FinanceMax Intelligence Engine
        </div>
      </div>
    </div>
  );
};

export default AiAnswerModal;