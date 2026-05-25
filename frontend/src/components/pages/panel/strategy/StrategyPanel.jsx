import React, { useState, useEffect, useRef } from 'react';
import api from '@/services/api'; 
import { useTheme } from "@/components/ThemeContext";

import ModalCategoriaStrategy from '@/components/modals/ModalCategoriaStrategy';
import ModalCardFilho from '@/components/modals/ModalCardFilho';
import ModalConfirm from '@/components/modals/ModalConfirm';
import AlertStyle from '@/components/AlertStyle';

import StrategyHeader from './StrategyHeader';
import StrategyBoard from './StrategyBoard';

const StrategyPanel = () => {
  const { isDarkMode } = useTheme();
  const boardRef = useRef(null);
  
  const dragRef = useRef({
    cardId: null,
    element: null,
    currentX: 0,
    currentY: 0,
    startMouseX: 0,
    startMouseY: 0,
    startCardX: 0,
    startCardY: 0
  });
  const boardDragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
    suppressContextMenu: false
  });

  const [cards, setCards] = useState([]);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [clipboard, setClipboard] = useState(null);
  const [categories, setCategories] = useState([]);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); 
  
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertStyleMessage, setAlertStyleMessage] = useState(null);
  const [alertStyleType, setAlertStyleType] = useState('info');
  const [selectedLineType, setSelectedLineType] = useState('line');
  const [zoom, setZoom] = useState(1);

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
      let loadedCards = cardsRes.data || [];
      setCategories(catRes.data || []);
      
      // ── Popula linkedFunction.item apenas quando necessário; evita re-fetch quando servidor já trouxe o item ──
      // Cache simples por tipo para evitar multiplas chamadas da mesma lista
      const listCache = {};

      const fetchItemFromCollection = async (type, id) => {
        try {
          const map = {
            card: '/cards',
            recurrence: '/recurrences',
            goal: '/goals',
            shoppingcart: '/shoppingcarts',
            investment: '/investments'
          };
          const endpoint = map[type];
          if (!endpoint) return null;

          if (!listCache[type]) {
            const res = await api.get(endpoint);
            listCache[type] = Array.isArray(res.data) ? res.data : [];
          }
          return listCache[type].find(it => String(it._id) === String(id)) || null;
        } catch (err) {
          return null;
        }
      };

      const cardsWithPopulatedLinkedFunctions = await Promise.all(loadedCards.map(async (card) => {
        const populatedChildCards = await Promise.all((card.childCards || []).map(async (child) => {
          // Se já veio populado pelo backend, não buscamos novamente
          if (child.linkedFunction && child.linkedFunction.item) return child;

          if (child.linkedFunction && child.linkedFunction.referenceId && child.linkedFunction.type) {
            const fetched = await fetchItemFromCollection(child.linkedFunction.type, child.linkedFunction.referenceId);
            if (fetched) {
              return { ...child, linkedFunction: { ...child.linkedFunction, item: fetched } };
            }
            return child;
          }
          return child;
        }));
        return { ...card, childCards: populatedChildCards };
      }));

      setCards(cardsWithPopulatedLinkedFunctions);

      // Inicializa histórico se vazio
      if (history.length === 0) { setHistory([JSON.stringify(cardsWithPopulatedLinkedFunctions)]); }
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

  const getCleanCategoryIds = (category) => {
    if (!category) return [];
    if (Array.isArray(category)) return category.map(cat => cat._id || cat);
    return [category._id || category];
  };

  const getCleanChildPayload = (child) => ({
    name: child.name,
    description: child.description,
    category: getCleanCategoryIds(child.category),
    linkedFunction: child.linkedFunction ? {
      type: child.linkedFunction.type,
      referenceId: child.linkedFunction.referenceId
    } : null
  });

  const saveToHistory = (newCards) => {
    const state = JSON.stringify(newCards);
    setHistory(prev => [state, ...prev.slice(0, 19)]); // Mantém 20 estados
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const [current, previous, ...rest] = history;
    const restoredCards = JSON.parse(previous);
    setCards(restoredCards);
    setHistory([previous, ...rest]);
    setRedoStack(prev => [current, ...prev]);
    // Aqui você poderia sincronizar com a API se desejar persistir o undo
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const [next, ...rest] = redoStack;
    const restoredCards = JSON.parse(next);
    setCards(restoredCards);
    setHistory(prev => [next, ...prev]);
    setRedoStack(rest);
  };

  useEffect(() => {
    const handleKeyboardShortcuts = (e) => {
      const isCommand = e.metaKey || e.ctrlKey;
      if (!isCommand) return;

      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }

      if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [handleUndo, handleRedo]);

  const handleOpenDelete = (id, type, parentId = null) => {
    setItemToDelete({ id, type, parentId });
    setIsConfirmOpen(true);
  };

  const handleCopyCard = (card) => {
    const payload = {
      title: card.title,
      size: card.size,
      shape: card.shape,
      childCards: (card.childCards || []).map(getCleanChildPayload),
      originalPosition: card.position || { x: 100, y: 120 }
    };
    setClipboard({ type: 'card', payload });
    setAlertStyleMessage('Card copiado. Use Colar no card ou no quadro.');
    setAlertStyleType('success');
    closeAllMenus();
  };

  const handleCopyChild = (parentId, child) => {
    const payload = getCleanChildPayload(child);
    setClipboard({ type: 'child', payload, fromParentId: parentId });
    setAlertStyleMessage('Item filho copiado. Use Colar em outro card pai.');
    setAlertStyleType('success');
    closeAllMenus();
  };

  const handlePasteCard = async (targetCard = null) => {
    if (!clipboard || clipboard.type !== 'card') return;

    try {
      const position = targetCard
        ? { x: (targetCard.position?.x || 100) + 40, y: (targetCard.position?.y || 120) + 40 }
        : typeof boardContextMenu.x === 'number' && typeof boardContextMenu.y === 'number' && boardRef.current
          ? (() => {
              const boardRect = boardRef.current.getBoundingClientRect();
              return {
                x: ((boardContextMenu.x - boardRect.left) + boardRef.current.scrollLeft) / zoom,
                y: ((boardContextMenu.y - boardRect.top) + boardRef.current.scrollTop) / zoom
              };
            })()
          : { x: 100, y: 120 };

      const { payload } = clipboard;
      const cardPayload = {
        title: payload.title,
        size: payload.size,
        shape: payload.shape,
        position,
      };

      const response = await api.post('/strategy/cards', cardPayload);
      const newCard = response.data;

      if (payload.childCards && payload.childCards.length > 0) {
        await Promise.all(payload.childCards.map((child) => api.post(`/strategy/cards/${newCard._id}/children`, child)));
      }

      await fetchData();
      setAlertStyleMessage('Card colado com sucesso.');
      setAlertStyleType('success');
    } catch (error) {
      console.error('Erro ao colar card:', error);
      setAlertStyleMessage('Não foi possível colar o card.');
      setAlertStyleType('danger');
    }
    closeAllMenus();
  };

  const handlePasteChild = async (targetParentId) => {
    if (!clipboard || clipboard.type !== 'child') return;

    try {
      await api.post(`/strategy/cards/${targetParentId}/children`, clipboard.payload);
      await fetchData();
      setAlertStyleMessage('Item filho colado com sucesso.');
      setAlertStyleType('success');
    } catch (error) {
      console.error('Erro ao colar item filho:', error);
      setAlertStyleMessage('Não foi possível colar o item filho.');
      setAlertStyleType('danger');
    }
    closeAllMenus();
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
    
    const x = xParam !== null ? xParam : ((boardContextMenu.x - boardRect.left) + boardRef.current.scrollLeft) / zoom;
    const y = yParam !== null ? yParam : ((boardContextMenu.y - boardRect.top) + boardRef.current.scrollTop) / zoom;

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
      setAlertMessage("Erro ao criar card. Verifique a conexão com o servidor ou se você está autenticado.");
      setIsConfirmOpen(true); // Reusing ModalConfirm for alerts
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
      setAlertStyleMessage("Estes cards já estão interligados.");
      setAlertStyleType('warning');
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
    if (boardDragRef.current.suppressContextMenu) {
      e.preventDefault();
      boardDragRef.current.suppressContextMenu = false;
      boardDragRef.current.active = false;
      return;
    }
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

  const getCardWidth = (size) => (size === 'small' ? 220 : 280);

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

  const handleBoardMouseDown = (e) => {
    if (!isEditMode || e.button !== 2) return;
    if (e.target.closest('.card-element') || e.target.closest('.line-element')) return;
    if (!boardRef.current) return;

    e.preventDefault();
    boardDragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: boardRef.current.scrollLeft,
      startTop: boardRef.current.scrollTop,
      suppressContextMenu: false
    };
    closeAllMenus();
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
      startMouseX: mouseX,
      startMouseY: mouseY,
      startCardX: card.position.x,
      startCardY: card.position.y,
      currentX: card.position.x,
      currentY: card.position.y
    };

    closeAllMenus();
  };

  const handleMouseMove = (e) => {
    if (!boardRef.current || !isEditMode) return;

    if (boardDragRef.current.active) {
      const deltaX = e.clientX - boardDragRef.current.startX;
      const deltaY = e.clientY - boardDragRef.current.startY;
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        boardDragRef.current.suppressContextMenu = true;
      }
      boardRef.current.scrollLeft = boardDragRef.current.startLeft - deltaX;
      boardRef.current.scrollTop = boardDragRef.current.startTop - deltaY;
      return;
    }

    if (!dragRef.current.cardId) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - boardRect.left) + boardRef.current.scrollLeft;
    const mouseY = (e.clientY - boardRect.top) + boardRef.current.scrollTop;

    const deltaX = (mouseX - dragRef.current.startMouseX) / zoom;
    const deltaY = (mouseY - dragRef.current.startMouseY) / zoom;

    let newX = dragRef.current.startCardX + deltaX;
    let newY = dragRef.current.startCardY + deltaY;
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
    if (boardDragRef.current.active) {
      boardDragRef.current.active = false;
      return;
    }

    const { cardId, currentX, currentY } = dragRef.current;
    if (!cardId) return;

    dragRef.current.cardId = null;
    dragRef.current.element = null;

    const newCards = cards.map(c => 
      String(c._id) === String(cardId) ? { ...c, position: { x: currentX, y: currentY } } : c
    );
    
    setCards(newCards);
    saveToHistory(newCards);
    
    try { 
      await api.put(`/strategy/cards/${cardId}`, { position: { x: currentX, y: currentY } }); 
    } catch (error) {
      console.error("Erro ao salvar posição:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans transition-colors duration-300 select-none" style={{ color: isDarkMode ? '#f3f4f6' : '#111827' }}>
      <StrategyHeader 
        isDarkMode={isDarkMode}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        lineTypes={lineTypes}
        selectedLineType={selectedLineType}
        setSelectedLineType={setSelectedLineType}
        linkingSource={linkingSource}
        setLinkingSource={setLinkingSource}
        setIsCatModalOpen={setIsCatModalOpen}
        closeAllMenus={closeAllMenus}
        zoom={zoom}
        setZoom={setZoom}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        canUndo={history.length > 1}
        canRedo={redoStack.length > 0}
      />

      <StrategyBoard 
        ref={boardRef}
        isDarkMode={isDarkMode}
        isEditMode={isEditMode}
        cards={cards}
        linkingSource={linkingSource}
        zoom={zoom}
        boardContextMenu={boardContextMenu}
        lineContextMenu={lineContextMenu}
        cardContextMenu={cardContextMenu}
        editingCardId={editingCardId}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        handleBoardContextMenu={handleBoardContextMenu}
        closeAllMenus={closeAllMenus}
        handleMouseMove={handleMouseMove}
        handleGlobalMouseUp={handleGlobalMouseUp}
        handleCreateAtPosition={handleCreateAtPosition}
        handleLineContextMenu={handleLineContextMenu}
        handleUpdateLineType={handleUpdateLineType}
        handleRemoveConnection={handleRemoveConnection}
        handleCardContextMenu={handleCardContextMenu}
        handleStartLinking={handleStartLinking}
        handleCompleteConnection={handleCompleteConnection}
        handleMouseDown={handleMouseDown}
        handleBoardMouseDown={handleBoardMouseDown}
        handleStartEdit={handleStartEdit}
        handleSaveTitle={handleSaveTitle}
        handleOpenDelete={handleOpenDelete}
        handleCopyCard={handleCopyCard}
        handleCopyChild={handleCopyChild}
        handlePasteCard={handlePasteCard}
        handlePasteChild={handlePasteChild}
        clipboard={clipboard}
        setActiveParentId={setActiveParentId}
        setEditingChild={setEditingChild}
        setIsFilhoModalOpen={setIsFilhoModalOpen}
        getCardWidth={getCardWidth}
        getCardHeight={getCardHeight}
        getCardCenter={getCardCenter}
        getLineStyle={getLineStyle}
        extractTargetId={extractTargetId}
      />

      <ModalCategoriaStrategy isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} onSuccess={fetchData} categories={categories} />
      <ModalCardFilho isOpen={isFilhoModalOpen} onClose={() => { setIsFilhoModalOpen(false); setEditingChild(null); }} parentId={activeParentId} editingChild={editingChild} categories={categories} onSuccess={fetchData} />
      <ModalConfirm 
        isOpen={isConfirmOpen} 
        onConfirm={alertMessage ? () => { setIsConfirmOpen(false); setAlertMessage(null); } : confirmDelete} 
        onCancel={alertMessage ? null : () => setIsConfirmOpen(false)} // No cancel button for alerts
        message={alertMessage || "Deseja realmente excluir este item?"} 
        confirmText={alertMessage ? "Ok" : "Confirmar"}
        cancelText={alertMessage ? null : "Cancelar"} // Hide cancel button for alerts
        isAlert={!!alertMessage} // Pass a prop to indicate it's an alert
      />
      <AlertStyle 
        message={alertStyleMessage} 
        type={alertStyleType} 
        onClose={() => setAlertStyleMessage(null)} 
      />
    </div>
  );
};

export default StrategyPanel;