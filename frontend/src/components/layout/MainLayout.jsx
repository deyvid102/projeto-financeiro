import React, { useState } from 'react';
import Sidebar from './bars/Sidebar';
import Topbar from './bars/Topbar';
import MobileDrawer from './bars/MobileDrawer';
import MobileBottomBar from './bars/MobileBottomBar';

const MainLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    /* h-screen + overflow-hidden: Trava a janela do navegador. 
       Isso impede que a Topbar "suba" ou suma da tela.
    */
    <div className="flex h-[100dvh] w-full bg-bg-main transition-colors duration-300 font-sans overflow-hidden">
      
      {/* Sidebar Fixo */}
      <Sidebar />

      {/* Menu mobile (drawer) */}
      <MobileDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Container da Direita */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative"> 
        
        {/* Topbar: Fora do fluxo de scroll, ela nunca se move */}
        <Topbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        {/* Área de Conteúdo com scroll independente:
           - overflow-y-auto: Permite scroll vertical apenas aqui.
           - flex-1: Ocupa todo o espaço restante abaixo da Topbar.
        */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pt-3 md:pt-4 pb-28 md:pb-0 animate-in fade-in duration-500">
          {/* Centralizador de conteúdo para telas ultra-wide */}
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom bar mobile */}
      <MobileBottomBar />
    </div>
  );
};

export default MainLayout;