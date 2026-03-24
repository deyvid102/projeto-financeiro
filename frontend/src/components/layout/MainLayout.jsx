import React from 'react';
import Sidebar from './bars/Sidebar';
import Topbar from './bars/Topbar';
import MobileBottomBar from './bars/MobileBottomBar';

const MainLayout = ({ children }) => {
  return (
    /* h-screen + overflow-hidden: Trava a janela do navegador. */
    <div className="flex h-[100dvh] w-full bg-bg-main transition-colors duration-300 font-sans overflow-hidden">
      
      {/* Sidebar: 'hidden' por padrão (mobile) e 'md:block/flex' para telas maiores */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Container da Direita */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative"> 
        
        {/* Topbar: Fora do fluxo de scroll, ela nunca se move */}
        <Topbar />

        {/* Área de Conteúdo com scroll independente */}
        {/* Ajustado o padding-bottom (pb-28) para aparecer apenas no mobile, evitando espaço vazio no PC */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pt-3 md:pt-4 pb-28 md:pb-8 animate-in fade-in duration-500">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom bar mobile: 'md:hidden' faz com que ela desapareça em telas de PC */}
      <div className="md:hidden">
        <MobileBottomBar />
      </div>
    </div>
  );
};

export default MainLayout;