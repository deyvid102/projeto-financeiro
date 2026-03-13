import React from 'react';
import Sidebar from './bars/Sidebar';
import Topbar from './bars/Topbar';

const MainLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-bg-main transition-colors duration-300 font-sans">
      {/* Menu Lateral Fixo (Compacto) 
         O Sidebar agora ocupa 80px (w-20), o que deixa mais espaço para os dados.
      */}
      <Sidebar />

      {/* Área de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0"> 
        {/* min-w-0 evita que o conteúdo quebre o flexbox em telas menores */}
        
        <Topbar />

        {/* Reduzi o pt-2 para manter a harmonia com a Topbar.
           O overflow-x-hidden garante que tabelas grandes não quebrem o layout lateral.
        */}
        <main className="p-8 pt-4 flex-1 overflow-x-hidden animate-in fade-in duration-500">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;