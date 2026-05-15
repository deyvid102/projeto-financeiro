import React from 'react';
import AiMentorReport from './AiMentorReport';
import ShopSidebar from './ShopSidebar';

const MobileInsightCarousel = () => {
  return (
    <div className="w-full lg:hidden px-4 mb-8">
      {/* Título de seção */}
      <div className="flex items-center gap-2 mb-4 px-2">
        <div className="w-1 h-3 bg-brand rounded-full" />
        <h2 className="text-[10px] font-black uppercase tracking-widest text-text-secondary italic">
          Insights & Recomendações
        </h2>
      </div>

      {/* Container do Carrossel */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4">
        
        {/* Slide 1: Mentor IA */}
        <div className="min-w-[85vw] snap-center">
          <div className="bg-bg-card border border-border-ui/50 rounded-[2rem] p-4 h-full shadow-xl">
             <AiMentorReport />
          </div>
        </div>

        {/* Slide 2: Shop / Sugestões (Ajustado com tamanho fixo e scroll interno) */}
        <div className="min-w-[85vw] snap-center">
          <div className="bg-bg-card border border-border-ui/50 rounded-[2rem] p-4 h-full shadow-xl max-h-[340px] overflow-y-auto scrollbar-none">
            <ShopSidebar isMobile={true} />
          </div>
        </div>

      </div>

      {/* Indicadores Visuais (Dots) */}
      <div className="flex justify-center gap-1.5 mt-2">
        <div className="w-4 h-1 rounded-full bg-brand/40" />
        <div className="w-1.5 h-1 rounded-full bg-border-ui" />
      </div>
    </div>
  );
};

export default MobileInsightCarousel;