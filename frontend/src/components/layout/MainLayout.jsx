import React from 'react';
import Sidebar from './bars/Sidebar';
import Topbar from './bars/Topbar';
import MobileBottomBar from './bars/MobileBottomBar';
import ShopSidebar from '@/components/shop/ShopSidebar'; 
import { ExternalLink, Gift, ShieldCheck, Mail } from 'lucide-react';

const MainLayout = ({ children }) => {
  return (
    <div className="flex h-[100dvh] w-full bg-bg-main transition-colors duration-300 font-sans overflow-hidden">
      
      {/* Sidebar Esquerda */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full relative"> 
        <Topbar />

        <div className="flex flex-1 overflow-hidden">
          
          {/* Área de Conteúdo com Scroll */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pt-3 md:pt-4 animate-in fade-in duration-500">
            <div className="max-w-[1200px] mx-auto w-full min-h-[calc(100vh-180px)]">
              {children}
            </div>

            {/* --- FOOTER DENTRO DO SCROLL --- */}
            <footer className="max-w-[1200px] mx-auto w-full mt-12 pb-28 md:pb-4 border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] text-text-secondary">
              
              {/* Informações do Criador e Suporte */}
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                <div className="flex flex-col items-center md:items-start">
                  <span className="font-bold text-text-primary uppercase tracking-tighter">FinanceMAX v1.1.0</span>
                  <span className="opacity-70">Desenvolvido por <b className="text-brand">Deyvid Wellington</b></span>
                </div>
                
                <a 
                  href="mailto:deyvidwellington@gmail.com" 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <Mail size={12} className="text-brand" />
                  <span>Suporte: deyvidwellington@gmail.com</span>
                </a>
              </div>

              {/* Patrocinador / Magazine Luiza */}
              <div className="flex flex-col items-center md:items-end gap-2">
                <span className="text-[8px] uppercase tracking-[0.2em] opacity-40 font-black">Patrocínio</span>
                <a 
                  href="https://www.magazinevoce.com.br/magazinefinancemax/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2 bg-[#0086ff]/5 border border-[#0086ff]/20 rounded-xl hover:bg-[#0086ff]/10 transition-all group"
                >
                  <div className="flex flex-col items-end leading-none">
                    <span className="text-[11px] font-black italic text-[#0086ff]">MAGAZINE LUIZA</span>
                    <span className="text-[9px] font-bold text-gray group-hover:text-[#0086ff] transition-colors">FINANCEMAX</span>
                  </div>
                  <ShieldCheck size={18} className="text-[#0086ff]" />
                </a>
              </div>
            </footer>
          </main>

          <ShopSidebar />
        </div>
      </div>

      <div className="md:hidden">
        <MobileBottomBar />
      </div>
    </div>
  );
};

export default MainLayout;