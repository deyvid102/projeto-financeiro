import React from 'react';
import Sidebar from './bars/Sidebar';
import Topbar from './bars/Topbar';
// MobileDrawer removido daqui
import MobileBottomBar from './bars/MobileBottomBar';

const MainLayout = ({ children }) => {
  // Estado isMobileMenuOpen removido, pois não há mais drawer para abrir

  return (
    /* h-screen + overflow-hidden: Trava a janela do navegador. */
    <div className="flex h-[100dvh] w-full bg-bg-main transition-colors duration-300 font-sans overflow-hidden">
      
      {/* Sidebar Fixo */}
      <Sidebar />

      {/* Container da Direita */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative"> 
        
        {/* Topbar: Fora do fluxo de scroll, ela nunca se move */}
        {/* Removida a prop onOpenMobileMenu já que o estado foi deletado */}
        <Topbar />

        {/* Área de Conteúdo com scroll independente */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pt-3 md:pt-4 pb-28 md:pb-0 animate-in fade-in duration-500">
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