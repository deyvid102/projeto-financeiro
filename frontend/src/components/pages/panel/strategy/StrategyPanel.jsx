import React, { useState, useEffect, useRef } from 'react';
import { Plus, GripHorizontal, Component, LayoutTemplate, Tag, Trash2, Lock, Unlock, Trash, Sliders, Link2, Unlink, Edit2, MousePointerClick } from 'lucide-react';
import api from '@/services/api'; 
import { useTheme } from "@/components/ThemeContext";

import ModalCategoriaStrategy from '@/components/modals/ModalCategoriaStrategy';
import ModalCardFilho from '@/components/modals/ModalCardFilho';
import ModalConfirm from '@/components/modals/ModalConfirm';

const StrategyPanel = () => {
  const { isDarkMode } = useTheme();
  const boardRef = useRef(null);
  
  const dragRef = useRef({
    cardId: null,
    element: null,
    offsetX: 0,
    offsetY: 0,
    currentX: 0,
    currentY: 0
  });

  const [cards, setCards] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); 
  
  const [selectedLineType, setSelectedLineType] = useState('line');

  const [editingCardId, setEditingCardId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  
  const [boardContextMenu, setBoardContextMenu] = useState({ x: 0, y: 0, visible: false });
  const [lineContextMenu, setLineContextMenu] = useState({ x: 0, y: 0, visible: false, sourceCardId: null, targetId: null });
  const [cardContextMenu, setCardContextMenu] = useState({ x: 0, y: 0, visible: false, card: null });

  const [linkingSource, setLinkingSource] = useState(null); 

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isFilhoModalOpen, setIsFilhoModalOpen] = useState(false);
  const [activeParentId, setActiveParentId] = useState(null);
  const [editingChild, setEditingChild] = useState(null);

  const fetchData = async () => {
    try {
      const [cardsRes, catRes] = await Promise.all([
        api.get('/strategy/cards'),
        api.get('/strategy/categories')
      ]);
      setCards(cardsRes.data || []);
      setCategories(catRes.data || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const lineTypes = [
    { value: 'line',        label: 'Sólida',   color: isDarkMode ? '#9ca3af' : '#6b7280' },
    { value: 'dotted-line', label: 'Tracejada',  color: isDarkMode ? '#9ca3af' : '#6b7280' },
    { value: 'red-line',    label: 'Vermelha',    color: '#ef4444' },
    { value: 'green-line',  label: 'Verde',      color: '#22c55e' },
  ];

  const getLineStyle = (type) => {
    const defaultStroke = isDarkMode ? "#4b5563" : "#9ca3af";
    switch (type) {
      case 'red-line': return { stroke: '#ef4444', dash: 'none' };
      case 'green-line': return { stroke: '#22c55e', dash: 'none' };
      case 'dotted-line': return { stroke: defaultStroke, dash: '6,5' };
      default: return { stroke: defaultStroke, dash: 'none' };
    }
  };

  const handleOpenDelete = (id, type, parentId = null) => {
    setItemToDelete({ id, type, parentId });
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'card') {
        await api.delete(`/strategy/cards/${itemToDelete.id}`);
      } else {
        await api.delete(`/strategy/cards/${itemToDelete.parentId}/children/${itemToDelete.id}`);
      }
      fetchData();
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
    setIsConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleCreateAtPosition = async (xParam = null, yParam = null) => {
    if (!boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();
    
    const x = xParam !== null ? xParam : (boardContextMenu.x - boardRect.left) + boardRef.current.scrollLeft;
    const y = yParam !== null ? yParam : (boardContextMenu.y - boardRect.top) + boardRef.current.scrollTop;

    try {
      if (!api || typeof api.post !== 'function') {
        throw new Error("A instância do Axios (api) não está configurada ou importada corretamente.");
      }
      await api.post('/strategy/cards', { title: 'Novo Card', position: { x, y }, size: 'medium' });
      closeAllMenus();
      fetchData();
    } catch (error) {
      console.error("Erro detalhado ao criar card:", error);
      if (error.response) {
        console.error("Dados da resposta do erro:", error.response.data);
      }
      alert("Erro ao criar card. Verifique a conexão com o servidor ou se você está autenticado.");
    }
  };

  const closeAllMenus = () => {
    setBoardContextMenu(prev => ({ ...prev, visible: false }));
    setLineContextMenu(prev => ({ ...prev, visible: false }));
    setCardContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleStartLinking = (e, card) => {
    e.stopPropagation();
    setLinkingSource(card);
    closeAllMenus();
  };

  const handleCompleteConnection = async (sourceCard, targetCard) => {
    if (String(sourceCard._id) === String(targetCard._id)) return;

    const freshSourceCard = cards.find(c => String(c._id) === String(sourceCard._id)) || sourceCard;
    const existingConnections = Array.isArray(freshSourceCard.connectedTo) ? freshSourceCard.connectedTo : [];
    const alreadyConnected = existingConnections.some(conn => String(extractTargetId(conn)) === String(targetCard._id));

    if (alreadyConnected) {
      alert("Estes cards já estão interligados.");
      setLinkingSource(null);
      closeAllMenus();
      return;
    }

    const updatedConnections = [
      ...existingConnections.map(c => ({ targetId: extractTargetId(c), fromSide: 'center', type: c.type || 'line' })),
      { targetId: targetCard._id, fromSide: 'center', type: selectedLineType }
    ];

    try {
      await api.put(`/strategy/cards/${freshSourceCard._id}`, { connectedTo: updatedConnections });
      fetchData();
    } catch (error) {
      console.error("Erro na conexão:", error);
    }
    
    setLinkingSource(null);
    closeAllMenus();
  };

  const handleUpdateLineType = async (sourceCardId, targetId, newType) => {
    const sourceCard = cards.find(c => String(c._id) === String(sourceCardId));
    if (!sourceCard) return;
    const updatedConnections = sourceCard.connectedTo.map(c => {
      const cId = extractTargetId(c);
      return String(cId) === String(targetId) ? { ...c, targetId: cId, type: newType } : { ...c, targetId: cId };
    });
    try { 
      await api.put(`/strategy/cards/${sourceCardId}`, { connectedTo: updatedConnections }); 
      fetchData(); 
    } catch (error) {
      console.error(error);
    }
    closeAllMenus();
  };

  const handleRemoveConnection = async (sourceCardId, targetId) => {
    const sourceCard = cards.find(c => String(c._id) === String(sourceCardId));
    if (!sourceCard) return;
    const updatedConnections = sourceCard.connectedTo
      .filter(c => String(extractTargetId(c)) !== String(targetId))
      .map(c => ({ targetId: extractTargetId(c), fromSide: 'center', type: c.type }));
    try { 
      await api.put(`/strategy/cards/${sourceCardId}`, { connectedTo: updatedConnections }); 
      fetchData(); 
    } catch (error) {
      console.error(error);
    }
    closeAllMenus();
  };

  const handleBoardContextMenu = (e) => {
    e.preventDefault();
    if (!isEditMode) return;
    if (e.target.closest('.card-element') || e.target.closest('.line-element')) return;
    closeAllMenus();
    setBoardContextMenu({ x: e.clientX, y: e.clientY, visible: true });
  };

  const handleLineContextMenu = (e, sourceCardId, targetId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditMode) return;
    closeAllMenus();
    setLineContextMenu({ x: e.clientX, y: e.clientY, visible: true, sourceCardId, targetId });
  };

  const handleCardContextMenu = (e, card) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditMode) return;
    closeAllMenus();
    setCardContextMenu({ x: e.clientX, y: e.clientY, visible: true, card });
  };

  const extractTargetId = (conn) => {
    if (!conn) return null;
    if (typeof conn === 'string') return conn;
    if (typeof conn.targetId === 'object' && conn.targetId !== null) return conn.targetId._id;
    return conn.targetId;
  };

  const getCardWidth = (size) => (size === 'small' ? 240 : 320);

  const getCardHeight = (card) => {
    const headerHeight = 54;
    const paddingAndGap = 24; 
    const childHeight = (card.childCards?.length || 0) * 52; 
    const gapCompensation = card.childCards?.length > 1 ? (card.childCards.length - 1) * 8 : 0;
    const footerButton = isEditMode ? 34 : 0; 
    return headerHeight + paddingAndGap + childHeight + gapCompensation + footerButton;
  };

  const getCardCenter = (card) => {
    if (!card) return { x: 0, y: 0 };
    const width = getCardWidth(card.size);
    const height = getCardHeight(card);
    return {
      x: card.position.x + width / 2,
      y: card.position.y + height / 2
    };
  };

  const handleStartEdit = (card) => { setEditingCardId(card._id); setEditTitle(card.title); };
  const handleSaveTitle = async (cardId) => {
    try { 
      await api.put(`/strategy/cards/${cardId}`, { title: editTitle }); 
      setEditingCardId(null); 
      fetchData(); 
    } catch (error) {
      console.error(error);
    }
  };

  const handleMouseDown = (e, card) => {
    if (e.button !== 0) return; 
    if (e.target.closest('.no-drag')) return; 
    
    const cardElement = e.currentTarget;
    const boardRect = boardRef.current.getBoundingClientRect();
    
    const mouseX = (e.clientX - boardRect.left) + boardRef.current.scrollLeft;
    const mouseY = (e.clientY - boardRect.top) + boardRef.current.scrollTop;

    dragRef.current = {
      cardId: card._id,
      element: cardElement,
      offsetX: mouseX - card.position.x,
      offsetY: mouseY - card.position.y,
      currentX: card.position.x,
      currentY: card.position.y
    };

    closeAllMenus();
  };

  const handleMouseMove = (e) => {
    if (!boardRef.current || !dragRef.current.cardId || !isEditMode) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - boardRect.left) + boardRef.current.scrollLeft;
    const mouseY = (e.clientY - boardRect.top) + boardRef.current.scrollTop;

    let newX = mouseX - dragRef.current.offsetX;
    let newY = mouseY - dragRef.current.offsetY;
    if (newY < 0) newY = 0;

    dragRef.current.currentX = newX;
    dragRef.current.currentY = newY;

    if (dragRef.current.element) {
      dragRef.current.element.style.left = `${newX}px`;
      dragRef.current.element.style.top = `${newY}px`;
      
      const width = dragRef.current.element.offsetWidth;
      const height = dragRef.current.element.offsetHeight;
      const centerX = newX + width / 2;
      const centerY = newY + height / 2;

      const sourceLines = document.querySelectorAll(`[data-source="${dragRef.current.cardId}"]`);
      sourceLines.forEach(line => { line.setAttribute('x1', centerX); line.setAttribute('y1', centerY); });

      const targetLines = document.querySelectorAll(`[data-target="${dragRef.current.cardId}"]`);
      targetLines.forEach(line => { line.setAttribute('x2', centerX); line.setAttribute('y2', centerY); });
    }
  };

  const handleGlobalMouseUp = async () => {
    if (!dragRef.current.cardId) return;
    const { cardId, currentX, currentY } = dragRef.current;

    setCards(prev => prev.map(c => String(c._id) === String(cardId) ? { ...c, position: { x: currentX, y: currentY } } : c));
    
    try { 
      await api.put(`/strategy/cards/${cardId}`, { position: { x: currentX, y: currentY } }); 
    } catch (error) {
      console.error("Erro ao salvar posição:", error);
    }

    dragRef.current.cardId = null;
    dragRef.current.element = null;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans transition-colors duration-300 select-none" style={{ color: isDarkMode ? '#f3f4f6' : '#111827' }}>
      <header className="h-16 flex items-center justify-between px-6 shrink-0 z-20 transition-colors duration-300 border-b" style={{ backgroundColor: isDarkMode ? '#111827' : '#ffffff', borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
        
        <div className="flex items-center gap-3">
          <LayoutTemplate className="text-brand" size={24} />
          <h1 className="text-lg font-black uppercase italic">UML <span className="text-brand">Strategy</span></h1>
        </div>

        <div className="flex items-center gap-4">
          {isEditMode && (
            <div className="flex items-center gap-1 bg-gray-800/50 dark:bg-gray-900/50 rounded-xl p-1 border" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
              {lineTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedLineType(type.value)}
                  className={`flex flex-col items-center px-4 py-1.5 rounded-lg text-xs font-medium transition-all min-w-[78px] ${
                    selectedLineType === type.value 
                      ? 'bg-white dark:bg-gray-700 shadow-sm' 
                      : 'hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 rounded" style={{ backgroundColor: type.color }} />
                    <span style={{ color: selectedLineType === type.value ? type.color : undefined }}>
                      {type.label}
                    </span>
                  </div>
                  <div className="mt-1 w-12 h-[1px] rounded" 
                       style={{ 
                         backgroundColor: type.color,
                         borderTop: type.value === 'dotted-line' ? '1px dashed' : 'none',
                         opacity: 0.6 
                       }} 
                  />
                </button>
              ))}
            </div>
          )}

          {linkingSource && (
            <div className="text-xs bg-blue-500/10 border border-blue-500/30 text-blue-500 px-3 py-1.5 rounded-lg font-bold uppercase animate-pulse flex items-center gap-2">
              <Link2 size={12} /> Conectando: {linkingSource.title}
            </div>
          )}

          <button 
            onClick={() => { 
              setIsEditMode(!isEditMode); 
              setLinkingSource(null); 
              closeAllMenus(); 
            }} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${isEditMode ? 'bg-red-500/20 text-red-500 border border-red-500' : 'bg-brand text-white'}`}
          >
            {isEditMode ? <Unlock size={14} /> : <Lock size={14} />}
            {isEditMode ? 'Modo Edição ON' : 'Modo Leitura'}
          </button>

          <button onClick={() => setIsCatModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all border" style={{ backgroundColor: isDarkMode ? 'rgba(0,0,0,0.3)' : '#f3f4f6', borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
            <Tag size={14} /> Categoria
          </button>
        </div>
      </header>

      <div 
        ref={boardRef} 
        className="flex-1 relative overflow-auto cursor-crosshair transition-colors duration-300" 
        style={{ backgroundColor: isDarkMode ? '#030712' : '#f9fafb' }} 
        onContextMenu={handleBoardContextMenu} 
        onClick={closeAllMenus}
        onMouseMove={handleMouseMove} 
        onMouseUp={handleGlobalMouseUp} 
        onMouseLeave={handleGlobalMouseUp}
      >
        
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

        {/* SVG das Linhas */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" style={{ minWidth: '4000px', minHeight: '4000px' }}>
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

        {/* AVISO DE QUADRO VAZIO */}
        {cards.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-8 rounded-3xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-2 border-dashed border-gray-300 dark:border-gray-700">
              <MousePointerClick size={48} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-black uppercase mb-2">Quadro vazio</h2>
              <p className="text-sm text-gray-500 max-w-xs">
                Clique em <strong>modo leitura</strong> para desbloquear o <strong>modo edição</strong>. Com o <strong>botão direito</strong> do mouse clique em qualquer lugar do quadro para começar a adicionar suas estratégias de finanças.
              </p>
            </div>
          </div>
        )}

        {/* Cards */}
        {cards.map((card) => {
          const cardWidth = getCardWidth(card.size);
          const cardHeight = getCardHeight(card);
          const isTargetAwaiting = linkingSource && String(linkingSource._id) !== String(card._id);

          return (
            <div key={String(card._id)} onMouseDown={(e) => isEditMode && handleMouseDown(e, card)} onContextMenu={(e) => handleCardContextMenu(e, card)}
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
              <div className="flex items-center justify-between p-3 border-b rounded-t-2xl shrink-0 h-[54px]" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb', backgroundColor: isDarkMode ? '#111827' : '#f9fafb' }} onDoubleClick={() => isEditMode && handleStartEdit(card)}>
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
                    <div key={child._id} className="bg-gray-100/50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-200/50 dark:border-gray-700/50 flex justify-between items-start group">
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-1 mb-1">
                          {Array.isArray(child.category) 
                            ? child.category.map(cat => <span key={cat._id} className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>{cat.name}</span>)
                            : child.category && <span className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase" style={{ backgroundColor: `${child.category.color}20`, color: child.category.color }}>{child.category.name}</span>
                          }
                        </div>
                        <div className="text-xs font-bold truncate">{child.name}</div>
                        {child.description && (
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                            {child.description}
                          </div>
                        )}
                      </div>
                      
                      {isEditMode && (
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <button onClick={(e) => { e.stopPropagation(); setActiveParentId(card._id); setEditingChild(child); setIsFilhoModalOpen(true); }} className="text-blue-500 p-1 hover:bg-blue-500/10 rounded"><Edit2 size={12} /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleOpenDelete(child._id, 'child', card._id); }} className="text-red-500 p-1 hover:bg-red-500/10 rounded"><Trash2 size={12} /></button>
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

      <ModalCategoriaStrategy isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} onSuccess={fetchData} categories={categories} />
      <ModalCardFilho isOpen={isFilhoModalOpen} onClose={() => { setIsFilhoModalOpen(false); setEditingChild(null); }} parentId={activeParentId} editingChild={editingChild} categories={categories} onSuccess={fetchData} />
      <ModalConfirm isOpen={isConfirmOpen} onConfirm={confirmDelete} onCancel={() => setIsConfirmOpen(false)} message="Deseja realmente excluir este item?" />
    </div>
  );
};

export default StrategyPanel;