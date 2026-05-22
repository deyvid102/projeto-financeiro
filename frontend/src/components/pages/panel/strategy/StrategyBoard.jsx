import React, { forwardRef } from 'react';
import { Plus, Sliders, Trash, Link2, Unlink, Component, Trash2, GripHorizontal, Edit2, MousePointerClick } from 'lucide-react';
import CardChildFunction from '@/components/CardChildFunction';

const StrategyBoard = forwardRef(({
  isDarkMode,
  isEditMode,
  cards,
  zoom,
  linkingSource,
  boardContextMenu,
  lineContextMenu,
  cardContextMenu,
  editingCardId,
  editTitle,
  setEditTitle,
  // Handlers
  handleBoardContextMenu,
  closeAllMenus,
  handleMouseMove,
  handleGlobalMouseUp,
  handleCreateAtPosition,
  handleLineContextMenu,
  handleUpdateLineType,
  handleRemoveConnection,
  handleCardContextMenu,
  handleStartLinking,
  handleCompleteConnection,
  handleMouseDown,
  handleStartEdit,
  handleSaveTitle,
  handleOpenDelete,
  setActiveParentId,
  setEditingChild,
  setIsFilhoModalOpen,
  // Helpers
  getCardWidth,
  getCardHeight,
  getCardCenter,
  getLineStyle,
  extractTargetId
}, ref) => {
  return (
    <div 
      ref={ref} 
      className="flex-1 relative overflow-auto cursor-crosshair transition-colors duration-300" 
      style={{ backgroundColor: isDarkMode ? '#030712' : '#f9fafb' }} 
      onContextMenu={handleBoardContextMenu} 
      onClick={closeAllMenus}
      onMouseMove={handleMouseMove} 
      onMouseUp={handleGlobalMouseUp} 
      onMouseLeave={handleGlobalMouseUp}
    >
      {/* Menus de Contexto (fora do container escalável para evitar problemas de posicionamento) */}
      {isEditMode && boardContextMenu.visible && (
        <div className="fixed z-50 p-2 rounded-lg shadow-xl border w-40" style={{ top: boardContextMenu.y, left: boardContextMenu.x, backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
          <button onClick={() => handleCreateAtPosition()} className="flex items-center gap-2 w-full p-2 hover:bg-brand/10 rounded transition-colors text-xs font-bold uppercase">
            <Plus size={14} /> Novo Card
          </button>
        </div>
      )}

      {isEditMode && lineContextMenu.visible && (
        <div className="fixed z-50 p-2 rounded-lg shadow-xl border w-48 flex flex-col gap-1" style={{ top: lineContextMenu.y, left: lineContextMenu.x, backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
          <div className="text-[10px] uppercase opacity-50 px-2 py-0.5 font-bold flex items-center gap-1"><Sliders size={10} /> Tipo de Linha</div>
          {['line', 'dotted-line', 'red-line', 'green-line'].map(type => (
            <button key={type} onClick={() => handleUpdateLineType(lineContextMenu.sourceCardId, lineContextMenu.targetId, type)} className="text-left w-full p-1.5 hover:bg-brand/10 rounded text-xs capitalize font-medium pl-4">
              {type.replace('-', ' ')}
            </button>
          ))}
          <div className="h-[1px] my-1" style={{ backgroundColor: isDarkMode ? '#374151' : '#e5e7eb' }} />
          <button onClick={() => handleRemoveConnection(lineContextMenu.sourceCardId, lineContextMenu.targetId)} className="flex items-center gap-2 w-full p-2 hover:bg-red-500/10 text-red-500 rounded transition-colors text-xs font-bold uppercase">
            <Trash size={14} /> Excluir Linha
          </button>
        </div>
      )}

      {isEditMode && cardContextMenu.visible && (
        <div className="fixed z-50 p-2 rounded-lg shadow-xl border w-56 flex flex-col gap-1" style={{ top: cardContextMenu.y, left: cardContextMenu.x, backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
          {!linkingSource && (
            <button onClick={(e) => handleStartLinking(e, cardContextMenu.card)} className="flex items-center gap-2 w-full p-2 hover:bg-blue-500/10 text-blue-500 rounded transition-colors text-xs font-bold uppercase">
              <Link2 size={14} /> Interligar
            </button>
          )}
          {linkingSource && String(linkingSource._id) !== String(cardContextMenu.card._id) && (
            <button onClick={() => handleCompleteConnection(linkingSource, cardContextMenu.card)} className="flex items-center gap-2 w-full p-2 hover:bg-green-500/10 text-green-500 rounded transition-colors text-xs font-bold uppercase">
              <Link2 size={14} /> Conectar aqui
            </button>
          )}
          {linkingSource && String(linkingSource._id) === String(cardContextMenu.card._id) && (
            <button onClick={() => { setLinkingSource(null); closeAllMenus(); }} className="flex items-center gap-2 w-full p-2 hover:bg-red-500/10 text-red-500 rounded transition-colors text-xs font-bold uppercase">
              Cancelar ligação
            </button>
          )}
          {cardContextMenu.card?.connectedTo && cardContextMenu.card.connectedTo.length > 0 && (
            <>
              <div className="h-[1px] my-1" style={{ backgroundColor: isDarkMode ? '#374151' : '#e5e7eb' }} />
              <div className="text-[10px] uppercase opacity-50 px-2 py-0.5 font-bold flex items-center gap-1"><Unlink size={10} /> Desconectar</div>
              {cardContextMenu.card.connectedTo.map((conn) => {
                const targetId = extractTargetId(conn);
                const targetCard = cards.find(c => String(c._id) === String(targetId));
                if (!targetCard) return null;
                return (
                  <button key={String(targetId)} onClick={() => handleRemoveConnection(cardContextMenu.card._id, targetId)} className="flex items-center gap-2 w-full p-2 hover:bg-red-500/10 text-red-500 rounded transition-colors text-xs font-medium text-left truncate pl-3">
                    Soltar {targetCard.title}
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
      {/* Container Escalável */}
      <div 
        className="absolute top-0 left-0 transition-transform duration-200 ease-out" 
        style={{ 
          transform: `scale(${zoom})`, 
          transformOrigin: '0 0',
          width: '4000px', // Área de trabalho grande
          height: '4000px' 
        }}
      >
      {/* SVG das Linhas */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        {cards.map(card => {
          const connections = Array.isArray(card.connectedTo) ? card.connectedTo : [];
          return connections.map((conn) => {
            const targetId = extractTargetId(conn);
            if (!targetId) return null;
            const target = cards.find(c => String(c._id) === String(targetId));
            if (!target) return null;
            const start = getCardCenter(card);
            const end = getCardCenter(target); 
            const lineStyle = getLineStyle(conn.type);
            return (
              <g key={`${String(card._id)}-${String(targetId)}`} className="line-element pointer-events-auto cursor-pointer">
                <line data-source={String(card._id)} data-target={String(targetId)} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="transparent" strokeWidth="16" onContextMenu={(e) => handleLineContextMenu(e, card._id, targetId)} />
                <line data-source={String(card._id)} data-target={String(targetId)} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={lineStyle.stroke} strokeWidth="2.5" strokeDasharray={lineStyle.dash} onContextMenu={(e) => handleLineContextMenu(e, card._id, targetId)} className="hover:stroke-blue-500 transition-colors" />
              </g>
            );
          });
        })}
      </svg>

      {/* Aviso Vazio */}
      {cards.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 rounded-3xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-2 border-dashed border-gray-300 dark:border-gray-700">
            <MousePointerClick size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-black uppercase mb-2">Quadro vazio</h2>
            <p className="text-sm text-gray-500 max-w-xs">Use o botão direito do mouse no modo edição para começar.</p>
          </div>
        </div>
      )}

      {/* Cards Loop */}
      {cards.map((card) => {
        const cardWidth = getCardWidth(card.size);
        const baseHeight = getCardHeight(card);
        const childItemsHeight = (card.childCards?.length || 0) * 60;
        const cardHeight = Math.max(baseHeight, 150 + childItemsHeight);
        const isTargetAwaiting = linkingSource && String(linkingSource._id) !== String(card._id);

        return (
          <div key={String(card._id)} 
            onMouseDown={(e) => isEditMode && handleMouseDown(e, card)} 
            onContextMenu={(e) => handleCardContextMenu(e, card)}
            className={`card-element absolute flex flex-col shadow-2xl border rounded-2xl z-10 ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''} ${isTargetAwaiting ? 'ring-2 ring-dashed ring-blue-500/50 hover:ring-blue-500' : ''} ${linkingSource && String(linkingSource._id) === String(card._id) ? 'ring-2 ring-blue-500 shadow-blue-500/20' : ''}`}
            style={{
              left: card.position?.x || 0, 
              top: card.position?.y || 0,
              width: `${cardWidth}px`,
              height: `${cardHeight}px`, 
              backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
              borderColor: isDarkMode ? '#374151' : '#e5e7eb',
              willChange: 'left, top'
            }}
          >
            <div className="flex items-center justify-between p-3 border-b rounded-t-2xl shrink-0 h-[54px]" 
              style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb', backgroundColor: isDarkMode ? '#111827' : '#f9fafb' }} 
              onDoubleClick={() => isEditMode && handleStartEdit(card)}>
              {editingCardId === card._id ? (
                <input autoFocus className="no-drag bg-transparent border-b border-blue-500 w-full outline-none font-black uppercase text-xs text-brand" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onBlur={() => handleSaveTitle(card._id)} onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(card._id)} />
              ) : (
                <span className="font-black uppercase text-xs flex items-center gap-2 select-none"><Component size={14} className="text-brand" /> {card.title}</span>
              )}
              {isEditMode && (
                <div className="flex items-center gap-2 text-gray-400">
                  <button onClick={(e) => { e.stopPropagation(); handleOpenDelete(card._id, 'card'); }} className="no-drag hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  <GripHorizontal size={14} className="opacity-50" />
                </div>
              )}
            </div>

            <div className="p-3 flex flex-col gap-2 no-drag overflow-hidden flex-1 justify-between">
              <div className="flex flex-col gap-2 overflow-y-auto">
                {card.childCards?.map((child) => (
                  <div key={child._id} className="flex flex-col gap-2">
                    <div className="bg-gray-100/50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-200/50 dark:border-gray-700/50 flex justify-between items-start group">
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-1 mb-1">
                          {Array.isArray(child.category)
                            ? child.category.map(cat => <span key={cat._id} className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>{cat.name}</span>)
                            : child.category && <span className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase" style={{ backgroundColor: `${child.category.color}20`, color: child.category.color }}>{child.category.name}</span>
                          }
                        </div>
                        <div className="text-xs font-bold truncate">{child.name}</div>
                      </div>
                      {isEditMode && (
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <button onClick={(e) => { e.stopPropagation(); setActiveParentId(card._id); setEditingChild(child); setIsFilhoModalOpen(true); }} className="text-blue-500 p-1 hover:bg-blue-500/10 rounded"><Edit2 size={12} /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleOpenDelete(child._id, 'child', card._id); }} className="text-red-500 p-1 hover:bg-red-500/10 rounded"><Trash2 size={12} /></button>
                        </div>
                      )}
                    </div>
                    {child.linkedFunction && (
                      <div className="scale-90 origin-top-left">
                        <CardChildFunction linkedFunction={child.linkedFunction} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {isEditMode && (
                <button onClick={() => { setActiveParentId(card._id); setEditingChild(null); setIsFilhoModalOpen(true); }} className="h-[26px] py-0.5 w-full border border-dashed border-gray-300 dark:border-gray-600 text-[10px] uppercase hover:bg-brand/5 dark:hover:bg-brand/5 hover:border-brand rounded-lg transition-all text-gray-400 hover:text-brand font-bold">
                  <Plus size={12} className="inline mr-1" /> Add Item
                </button>
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
});

StrategyBoard.displayName = 'StrategyBoard';
export default StrategyBoard;