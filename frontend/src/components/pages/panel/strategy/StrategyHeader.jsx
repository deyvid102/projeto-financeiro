import React, { useState } from 'react';
import { LayoutTemplate, Unlock, Lock, Tag, Link2, FolderTree, Save, RotateCcw, RotateCw, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

const StrategyHeader = ({ 
  isDarkMode, 
  isEditMode, 
  setIsEditMode, 
  lineTypes, 
  selectedLineType, 
  setSelectedLineType, 
  linkingSource, 
  setLinkingSource, 
  setIsCatModalOpen,
  closeAllMenus,
  zoom,
  setZoom,
  handleUndo,
  handleRedo,
  canUndo,
  canRedo
}) => {
  const [isConnMenuOpen, setIsConnMenuOpen] = useState(false);

  return (
    <header className="h-16 flex items-center justify-between px-6 shrink-0 z-20 transition-colors duration-300 border-b bg-bg-card border-border-ui">
      
      <div className="flex items-center gap-3">
        <LayoutTemplate className="text-brand" size={24} />
        <h1 className="text-lg font-black uppercase italic text-text-primary">UML <span className="text-brand">Strategy</span></h1>
      </div>

      <div className="flex items-center gap-6">
        {/* Controles de Zoom */}
        <div className="flex items-center gap-1 bg-bg-main border-border-ui p-1 rounded-lg border">
          <button onClick={() => setZoom(Math.max(0.4, zoom - 0.1))} className="p-1.5 hover:bg-bg-card rounded transition-colors text-text-secondary hover:text-brand" title="Zoom Out"><ZoomOut size={14} /></button>
          <span className="text-[10px] font-black w-10 text-center text-text-primary">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="p-1.5 hover:bg-bg-card rounded transition-colors text-text-secondary hover:text-brand" title="Zoom In"><ZoomIn size={14} /></button>
          <button onClick={() => setZoom(1)} className="p-1.5 hover:bg-bg-card rounded transition-colors border-l border-border-ui text-text-secondary hover:text-brand" title="Reset Zoom"><Maximize size={12} /></button>
        </div>

        {/* Histórico e Status */}
        <div className="flex items-center gap-3">
          <button 
            disabled={!canUndo} 
            onClick={handleUndo}
            className={`p-2 rounded-full transition-all ${canUndo ? 'hover:bg-brand/10 text-brand' : 'opacity-30 cursor-not-allowed text-text-secondary'}`}
            title="Desfazer alteração"
          >
            <RotateCcw size={16} />
          </button>
          <button 
            disabled={!canRedo} 
            onClick={handleRedo}
            className={`p-2 rounded-full transition-all ${canRedo ? 'hover:bg-brand/10 text-brand' : 'opacity-30 cursor-not-allowed text-text-secondary'}`}
            title="Refazer alteração"
          >
            <RotateCw size={16} />
          </button>
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase opacity-70 text-text-secondary">
            <Save size={12} /> Autosave ON
          </div>
        </div>

        <div className="h-6 w-[1px] bg-border-ui" />

        <div className="flex items-center gap-4">
          {isEditMode && (
            <div className="relative">
              <button 
                onClick={() => setIsConnMenuOpen(!isConnMenuOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all border ${isConnMenuOpen ? 'bg-brand text-white border-brand' : 'text-text-secondary hover:bg-bg-main border-border-ui hover:border-brand hover:text-brand'}`}
              >
                <FolderTree size={14} /> Ligações
              </button>

              {isConnMenuOpen && (
                <div className="absolute top-full mt-2 right-0 bg-bg-card border-border-ui shadow-2xl rounded-xl p-2 w-48 z-50 flex flex-col gap-1 border">
                  <div className="text-[9px] font-black uppercase opacity-60 px-2 py-1 text-text-secondary">Estilo da Linha</div>
                  {lineTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => { setSelectedLineType(type.value); setIsConnMenuOpen(false); }}
                      className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${selectedLineType === type.value ? 'bg-brand/10 text-brand' : 'text-text-primary hover:bg-bg-main'}`}
                    >
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: type.color }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: type.color }} />
                      </div>
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

        {linkingSource && (
          <div className="text-xs bg-blue-500/10 border border-blue-500/30 text-blue-500 px-3 py-1.5 rounded-lg font-bold uppercase animate-pulse flex items-center gap-2">
            <Link2 size={12} /> Conectando: {linkingSource.title}
          </div>
        )}

        <button 
          onClick={() => { setIsEditMode(!isEditMode); setLinkingSource(null); closeAllMenus(); }} 
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${isEditMode ? 'bg-red-500/20 text-red-500 border border-red-500' : 'bg-brand text-white'}`}
        >
          {isEditMode ? <Unlock size={14} /> : <Lock size={14} />}
          {isEditMode ? 'Modo Edição ON' : 'Modo Leitura'}
        </button>

        <button onClick={() => setIsCatModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all border bg-bg-main border-border-ui text-text-secondary hover:text-brand hover:border-brand">
          <Tag size={14} /> Categoria
        </button>
      </div>
    </div>
    </header>
  );
};

export default StrategyHeader;