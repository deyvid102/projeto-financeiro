import React from 'react';
import Sidebar from './bars/Sidebar';
import Topbar from './bars/Topbar';

const MainLayout = ({ children }) => {
  return (
    /* h-screen + overflow-hidden: Trava a janela do navegador. 
       Isso impede que a Topbar "suba" ou suma da tela.
    */
    <div className="flex h-screen w-full bg-bg-main transition-colors duration-300 font-sans overflow-hidden">
      
      {/* Sidebar Fixo */}
      <Sidebar />

      {/* Container da Direita */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative"> 
        
        {/* Topbar: Fora do fluxo de scroll, ela nunca se move */}
        <Topbar />

        {/* Área de Conteúdo com scroll independente:
           - overflow-y-auto: Permite scroll vertical apenas aqui.
           - flex-1: Ocupa todo o espaço restante abaixo da Topbar.
        */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 pt-4 animate-in fade-in duration-500">
          {/* Centralizador de conteúdo para telas ultra-wide */}
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;