import React, { useState, useEffect } from 'react';
import { BrainCircuit, RefreshCcw, Maximize2, Sparkles, Loader2 } from 'lucide-react';
import AiFullReportModal from './AiFullReportModal';
import api from '@/services/api';

const AiMentorReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Função para buscar o relatório estruturado em JSON
  const fetchAiReport = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ai/report');
      
      if (data && data.insight) {
        setReportData(data.insight);
        // Salva o objeto completo no cache local
        localStorage.setItem('last_ai_insight_v2', JSON.stringify({
          objectData: data.insight,
          date: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error("Erro ao chamar Mentor IA:", error);
      setReportData({
        conselhoCurto: "O motor de auditoria está recalibrando os parâmetros. Tente novamente em instantes.",
        eficienciaRetencao: 0,
        alertas: [],
        estrategias: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Efeito para carregar e validar o cache do dia
  useEffect(() => {
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
  }, []);

  // Extrai o conselho rápido para exibir na pré-visualização do card
  const previewText = reportData?.conselhoCurto;

  return (
    <>
      <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-[#0D0D12] border border-gray-200 dark:border-white/5 p-6 group hover:border-brand/30 transition-all duration-500 shadow-xl">
        
        {/* Efeito sutil de iluminação IA ao passar o mouse */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-brand/5 dark:bg-brand/10 blur-[40px] rounded-full group-hover:bg-brand/20 transition-all duration-500 pointer-events-none" />

        {/* Header do Card */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand/10 rounded-xl border border-brand/20 transition-colors">
              <BrainCircuit size={16} className="text-brand" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white italic block leading-none">Auditor IA</span>
              <span className="text-[8px] text-brand font-bold uppercase tracking-tighter mt-1 block animate-pulse">Análise Ativa</span>
            </div>
          </div>
          
          <button 
            onClick={fetchAiReport}
            disabled={loading}
            className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-full text-gray-400 hover:text-brand transition-all disabled:opacity-30"
            title="Recalcular Métricas"
          >
            {loading ? <Loader2 size={13} className="animate-spin text-brand" /> : <RefreshCcw size={13} />}
          </button>
        </div>

        {/* Área de Conteúdo / Clique */}
        <div 
          className="cursor-pointer relative z-10" 
          onClick={() => reportData && !loading && setIsModalOpen(true)}
        >
          {loading && !reportData ? (
            /* Skeletons totalmente adaptáveis aos modos claro/escuro */
            <div className="space-y-2.5 py-1 animate-pulse">
              <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full w-full" />
              <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full w-[92%]" />
              <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full w-[78%]" />
            </div>
          ) : (
            <div className="relative">
              {/* Exibe o conselho dinâmico focado em 50% retrospectiva e 50% ação */}
              <p className="text-[12px] leading-relaxed text-gray-600 dark:text-gray-400 font-medium italic line-clamp-3">
                {previewText ? `"${previewText}"` : "Avaliando e cruzando o histórico de movimentações com suas metas ativas..."}
              </p>
              
              {previewText && (
                <div className="mt-4 pt-1 flex items-center justify-between border-t border-gray-50 dark:border-white/[0.02]">
                  <div className="flex items-center gap-1.5 text-brand">
                    <Sparkles size={10} className="opacity-80" />
                    <span className="text-[9px] font-black uppercase tracking-wider">Diretriz Estratégica</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 dark:text-gray-500 group-hover:text-brand transition-colors uppercase tracking-tight">
                    Auditar Ecossistema <Maximize2 size={10} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal - Passa o objeto JSON completo estruturado */}
      <AiFullReportModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        reportData={reportData}
      />
    </>
  );
};

export default AiMentorReport;