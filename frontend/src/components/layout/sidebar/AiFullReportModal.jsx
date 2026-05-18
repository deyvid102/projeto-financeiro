import React from 'react';
import { X, ShieldAlert, ArrowUpRight, CheckCircle2, BrainCircuit, ThumbsUp, ThumbsDown, PieChart } from 'lucide-react';

const AiFullReportModal = ({ isOpen, onClose, reportData }) => {
  if (!isOpen) return null;

  const data = reportData || { 
    conselhoCurto: "", 
    eficienciaRetencao: 0, 
    alertas: [], 
    estrategias: [],
    pontosPositivos: [],
    pontosNegativos: [],
    maioresGastos: [] // Novo campo injetado
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0D0D12] border border-gray-100 dark:border-white/5 w-full max-w-[460px] rounded-[28px] overflow-hidden flex flex-col shadow-2xl transition-colors scale-in-95 duration-200">
        
        {/* Header Principal */}
        <div className="p-5 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand/10 dark:bg-brand/20 text-brand rounded-xl">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h2 className="text-gray-900 dark:text-white font-bold text-base leading-none">Auditoria de Ecossistema</h2>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mt-1">Análise automatizada de retenção</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Corpo do Relatório */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh] scrollbar-none">
          
          {/* Caixa Editorial (Conselho Principal) */}
          {data.conselhoCurto && (
            <div className="relative p-5 rounded-3xl bg-brand/[0.03] border border-brand/10 overflow-hidden">
              <div className="absolute -right-2 -top-2 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                <BrainCircuit size={80} className="text-brand" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-brand mb-2 flex items-center gap-2">
                <span className="h-1 w-3 bg-brand rounded-full" />
                Diretriz Estratégica
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-[12.5px] leading-relaxed font-medium italic relative z-10">
                "{data.conselhoCurto}"
              </p>
            </div>
          )}
          
          {/* Eficiência de Retenção */}
          <div className="space-y-2 p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl">
            <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight text-gray-500">
              <span>Eficiência de Retenção</span>
              <span className="text-brand">{data.eficienciaRetencao}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${data.eficienciaRetencao}%` }}
              />
            </div>
          </div>

          {/* NOVA SEÇÃO: Análise de Ofensores (Maiores Gastos por Categoria) */}
          {data.maioresGastos && data.maioresGastos.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block px-1 flex items-center gap-1.5">
                <PieChart size={12} /> Ofensores de Caixa
              </span>
              <div className="grid grid-cols-2 gap-2">
                {data.maioresGastos.map((gasto, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex flex-col justify-center">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-tight truncate">{gasto.categoria}</span>
                    <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300 mt-0.5">{gasto.valor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pontos Positivos & Negativos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Prós */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/10 space-y-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ThumbsUp size={12} /> Pontos Fortes
              </span>
              <div className="space-y-1.5">
                {data.pontosPositivos?.map((item, i) => (
                  <p key={i} className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug font-medium">• {item}</p>
                )) || <p className="text-[10px] text-gray-400 italic">Analisando histórico...</p>}
              </div>
            </div>

            {/* Contras */}
            <div className="p-3.5 rounded-2xl bg-rose-500/[0.03] border border-rose-500/10 space-y-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <ThumbsDown size={12} /> Vulnerabilidades
              </span>
              <div className="space-y-1.5">
                {data.pontosNegativos?.map((item, i) => (
                  <p key={i} className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug font-medium">• {item}</p>
                )) || <p className="text-[10px] text-gray-400 italic">Analisando histórico...</p>}
              </div>
            </div>
          </div>

          {/* Alertas */}
          {data.alertas && data.alertas.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block px-1">
                Pontos de Atenção
              </span>
              <div className="space-y-2">
                {data.alertas.map((alerta, idx) => (
                  <div key={idx} className="flex gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-700 dark:text-amber-400">
                    <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                    <p className="text-[11px] font-medium leading-relaxed">{alerta}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plano de Otimização */}
          {data.estrategias && data.estrategias.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block px-1">
                Plano de Otimização
              </span>
              <div className="space-y-2">
                {data.estrategias.map((est, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                    <div className="flex gap-2 items-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-brand" />
                      <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{est.acao}</p>
                    </div>
                    <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                      <ArrowUpRight size={10} />
                      <span>+{est.impacto}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Rodapé Fixo */}
        <div className="p-3 bg-gray-50/50 dark:bg-white/[0.01] border-t border-gray-100 dark:border-white/5 text-center text-gray-400/60 dark:text-gray-500 text-[8px] font-bold uppercase tracking-widest">
          FinanceMax Intelligence Engine
        </div>
      </div>
    </div>
  );
};

export default AiFullReportModal;