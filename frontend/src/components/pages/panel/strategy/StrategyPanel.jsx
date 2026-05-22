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
    offsetX: 0,
    offsetY: 0,
    currentX: 0,
    currentY: 0,
    startMouseX: 0,
    startMouseY: 0,
    startCardX: 0,
    startCardY: 0
  });

  const [cards, setCards] = useState([]);
  const [history, setHistory] = useState([]);
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
      const loadedCards = cardsRes.data || [];
      setCards(loadedCards);
      setCategories(catRes.data || []);
      
      // Inicializa histórico se vazio
      if (history.length === 0) {
        setHistory([JSON.stringify(loadedCards)]);
      }
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

  const saveToHistory = (newCards) => {
    const state = JSON.stringify(newCards);
    setHistory(prev => [state, ...prev.slice(0, 19)]); // Mantém 20 estados
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const [_, previous, ...rest] = history;
    const restoredCards = JSON.parse(previous);
    setCards(restoredCards);
    setHistory([previous, ...rest]);
    // Aqui você poderia sincronizar com a API se desejar persistir o undo
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
    if (!boardRef.current || !dragRef.current.cardId || !isEditMode) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - boardRect.left) + boardRef.current.scrollLeft;
    const mouseY = (e.clientY - boardRect.top) + boardRef.current.scrollTop;

    // Ajusta o delta pelo zoom
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
    const { cardId, currentX, currentY } = dragRef.current;
    if (!cardId) return;

    // Limpa a referência IMEDIATAMENTE para evitar que o mousemove continue movendo
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
        canUndo={history.length > 1}
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
        handleStartEdit={handleStartEdit}
        handleSaveTitle={handleSaveTitle}
        handleOpenDelete={handleOpenDelete}
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