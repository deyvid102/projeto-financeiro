import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarClock, CreditCard, Eye, Loader2, Pencil, Plus, Trash2, Wallet, X } from 'lucide-react';
import api from '@/services/api';
import { useAlert } from '@/context/AlertContext';
import ModalConfirm from '@/components/modals/ModalConfirm';
import SelectStyle from '@/components/SelectStyle';

const initialForm = {
  name: '',
  type: 'debito',
  lastFourDigits: '',
  flag: 'Outro',
  color: '#3b82f6',
  creditLimit: '',
  closingDay: '',
  dueDay: '',
  vaRechargeDay: '',
  vaRechargeAmount: '',
};

const cardTypeOptions = [
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
  { value: 'vale_alimentacao', label: 'Vale Alimentação' },
];

const flagOptions = [
  { value: 'Visa', label: 'Visa' },
  { value: 'Mastercard', label: 'Mastercard' },
  { value: 'Elo', label: 'Elo' },
  { value: 'American Express', label: 'American Express' },
  { value: 'Hipercard', label: 'Hipercard' },
  { value: 'Outro', label: 'Outro' },
];

const cardColorOptions = [
  '#3b82f6', // azul
  '#1d4ed8', // azul escuro
  '#10b981', // verde
  '#059669', // verde escuro
  '#f59e0b', // amarelo
  '#f97316', // laranja
  '#ef4444', // vermelho
  '#dc2626', // vermelho escuro
  '#8b5cf6', // roxo
  '#ec4899', // rosa
  '#0f172a', // preto/ardosia
  '#475569', // cinza
];

const ModalCard = ({ isOpen, onClose }) => {
  const { showAlert } = useAlert();
  const [cards, setCards] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [detailCard, setDetailCard] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [mobileTab, setMobileTab] = useState('form');

  const isEditing = Boolean(editingId);

  const fetchCards = async () => {
    setFetching(true);
    try {
      const res = await api.get('/cards');
      setCards(Array.isArray(res.data) ? res.data : []);
    } catch {
      showAlert('Erro ao buscar cartões.', 'error');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCards();
      setFormData(initialForm);
      setEditingId(null);
      setMobileTab('form');
    }
  }, [isOpen]);

  const subtitle = useMemo(() => {
    if (formData.type === 'credito') return 'Configurar limite e fatura';
    if (formData.type === 'vale_alimentacao') return 'Configurar recarga mensal';
    return 'Cartão de débito';
  }, [formData.type]);

  const sanitizeDigits = (value) => value.replace(/\D/g, '').slice(0, 4);

  const handleEdit = (card) => {
    setEditingId(card._id);
    setFormData({
      name: card.name || '',
      type: card.type || 'debito',
      lastFourDigits: card.lastFourDigits || '',
      flag: card.flag || 'Outro',
      color: card.color || '#3b82f6',
      creditLimit: card.creditLimit ?? '',
      closingDay: card.closingDay ?? '',
      dueDay: card.dueDay ?? '',
      vaRechargeDay: card.vaRechargeDay ?? '',
      vaRechargeAmount: card.vaRechargeAmount ?? '',
    });
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const buildPayload = () => {
    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      lastFourDigits: formData.lastFourDigits || null,
      flag: formData.flag,
      color: formData.color || '#3b82f6',
    };

    if (formData.type === 'credito') {
      payload.creditLimit = Number(formData.creditLimit);
      payload.closingDay = Number(formData.closingDay);
      payload.dueDay = Number(formData.dueDay);
    }

    if (formData.type === 'vale_alimentacao') {
      payload.vaRechargeDay = Number(formData.vaRechargeDay);
      payload.vaRechargeAmount = Number(formData.vaRechargeAmount);
    }

    return payload;
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Informe o nome do cartão.';
    if (formData.lastFourDigits && formData.lastFourDigits.length < 4) return 'Os 4 últimos dígitos devem ter 4 números.';

    if (formData.type === 'credito') {
      if (!formData.creditLimit || Number(formData.creditLimit) <= 0) return 'Limite de crédito inválido.';
      if (!formData.closingDay || !formData.dueDay) return 'Informe fechamento e vencimento.';
    }

    if (formData.type === 'vale_alimentacao') {
      if (!formData.vaRechargeDay) return 'Informe o dia da recarga do VA.';
      if (!formData.vaRechargeAmount || Number(formData.vaRechargeAmount) <= 0) return 'Informe um valor de recarga válido.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      showAlert(validationError, 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEditing) {
        await api.put(`/cards/${editingId}`, payload);
        showAlert('Cartão atualizado!', 'success');
      } else {
        await api.post('/cards', payload);
        showAlert('Cartão criado!', 'success');
      }
      resetForm();
      fetchCards();
    } catch (err) {
      showAlert(err?.response?.data?.message || 'Erro ao salvar cartão.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await api.delete(`/cards/${confirmDeleteId}`);
      showAlert('Cartão removido!', 'success');
      setConfirmDeleteId(null);
      fetchCards();
      if (editingId === confirmDeleteId) resetForm();
    } catch (err) {
      showAlert(err?.response?.data?.message || 'Erro ao remover cartão.', 'error');
      setConfirmDeleteId(null);
    }
  };

  const loadCardDetails = async (card) => {
    console.log('[CardDetails] Abrindo detalhes do cartão:', card);
    setDetailCard(card);
    setDetailData(null);
    setDetailLoading(true);
    try {
      if (card.type === 'credito') {
        const [summaryRes, transactionsRes, recurrencesRes] = await Promise.allSettled([
          api.get(`/cards/${card._id}/bill-summary`),
          api.get('/transactions'),
          api.get('/recurrences'),
        ]);

        console.log('[CardDetails] Resultado bill-summary:', summaryRes);
        console.log('[CardDetails] Resultado transactions:', transactionsRes);
        console.log('[CardDetails] Resultado recurrences:', recurrencesRes);

        const summaryData = summaryRes.status === 'fulfilled' ? summaryRes.value.data : null;
        const transactionsData = transactionsRes.status === 'fulfilled' ? (transactionsRes.value.data || []) : [];
        const recurrencesData = recurrencesRes.status === 'fulfilled' ? (recurrencesRes.value.data || []) : [];

        const cardTransactions = transactionsData
          .filter((t) => t.card?._id === card._id || t.card === card._id)
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        const creditRecurrences = recurrencesData
          .filter((r) => (r.cardId?._id || r.cardId) === card._id)
          .map((r) => ({
            _id: `rec-${r._id}`,
            title: `${r.title} (${r.currentInstallment}/${r.totalInstallments}x)`,
            date: r.createdAt || new Date().toISOString(),
            type: 'saida',
            amount: Number(r.amount || 0),
            isProjected: true,
          }));

        setDetailData({
          mode: 'credito',
          summary: summaryData,
          transactions: [...cardTransactions, ...creditRecurrences].sort((a, b) => new Date(b.date) - new Date(a.date)),
        });
      } else if (card.type === 'vale_alimentacao') {
        const statementRes = await api.get(`/cards/${card._id}/va-statement`);
        console.log('[CardDetails] Resultado va-statement:', statementRes.data);
        setDetailData({ mode: 'va', statement: statementRes.data, transactions: statementRes.data?.transactions || [] });
      } else {
        const transactionsRes = await api.get('/transactions');
        console.log('[CardDetails] Resultado transactions débito:', transactionsRes.data);
        const cardTransactions = (transactionsRes.data || [])
          .filter((t) => t.card?._id === card._id || t.card === card._id)
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setDetailData({ mode: 'debito', transactions: cardTransactions });
      }
    } catch (err) {
      console.error('[CardDetails] Erro ao carregar detalhes:', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
        url: err?.config?.url,
        method: err?.config?.method,
      });
      showAlert(err?.response?.data?.message || 'Erro ao carregar detalhes do cartão.', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal((
    <>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 md:p-6">
        <div onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-md" />

        <div className="relative z-10 w-full max-w-5xl max-h-[92vh] bg-bg-card border border-border-ui rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
          <div className="md:hidden flex flex-col z-20 bg-bg-card border-b border-border-ui/40">
            <div className="flex items-center justify-between p-4">
              <div>
                <h2 className="text-base font-black uppercase italic tracking-tighter text-text-primary">
                  {isEditing ? 'Editar' : 'Novo'} <span className="text-brand">Cartão</span>
                </h2>
                <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary mt-1">{subtitle}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-bg-main/50 transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="flex w-full border-t border-border-ui/30">
              <button
                onClick={() => setMobileTab('form')}
                className={`flex-1 py-3 text-[10px] font-black uppercase transition-all ${mobileTab === 'form' ? 'bg-brand text-white' : 'bg-bg-main/30 text-text-secondary hover:bg-bg-main/50'}`}
              >
                Formulário
              </button>
              <button
                onClick={() => setMobileTab('list')}
                className={`flex-1 py-3 text-[10px] font-black uppercase transition-all ${mobileTab === 'list' ? 'bg-brand text-white' : 'bg-bg-main/30 text-text-secondary hover:bg-bg-main/50'}`}
              >
                Cartões ({cards.length})
              </button>
            </div>
          </div>

          <div className={`w-full md:w-[46%] border-b md:border-b-0 md:border-r border-border-ui/40 overflow-y-auto custom-scrollbar ${mobileTab === 'form' ? 'block' : 'hidden md:block'}`}>
            <div className="hidden md:flex p-5 md:p-6 bg-brand text-white items-center justify-between">
              <div>
                <h2 className="text-xl font-black uppercase italic tracking-tighter">
                  {isEditing ? 'Editar' : 'Novo'} <span className="text-black/30">Cartão</span>
                </h2>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mt-1">{subtitle}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/10 transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
              <input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do cartão"
                className="w-full bg-bg-main/40 border border-border-ui/50 p-4 rounded-2xl outline-none font-bold text-sm text-text-primary focus:border-brand"
                required
              />

              <SelectStyle
                label="Tipo"
                icon={CreditCard}
                options={cardTypeOptions}
                value={formData.type}
                onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={formData.lastFourDigits}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastFourDigits: sanitizeDigits(e.target.value) }))}
                  placeholder="Últimos 4 dígitos"
                  className="w-full bg-bg-main/40 border border-border-ui/50 p-4 rounded-2xl outline-none font-bold text-sm text-text-primary focus:border-brand"
                />
                <div className="w-full bg-bg-main/40 border border-border-ui/50 p-3 rounded-2xl">
                  <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary mb-2 px-1">Cor do cartão</p>
                  <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                    {cardColorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full shrink-0 border-2 transition-all ${formData.color === color ? 'border-text-primary scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        title={`Selecionar cor ${color}`}
                        aria-label={`Selecionar cor ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <SelectStyle
                label="Bandeira"
                options={flagOptions}
                value={formData.flag}
                onChange={(e) => setFormData((prev) => ({ ...prev, flag: e.target.value }))}
              />

              {formData.type === 'credito' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData((prev) => ({ ...prev, creditLimit: e.target.value }))}
                    placeholder="Limite"
                    className="w-full bg-bg-main/40 border border-border-ui/50 p-4 rounded-2xl outline-none font-bold text-sm text-text-primary focus:border-brand"
                  />
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={formData.closingDay}
                    onChange={(e) => setFormData((prev) => ({ ...prev, closingDay: e.target.value }))}
                    placeholder="Fechamento"
                    className="w-full bg-bg-main/40 border border-border-ui/50 p-4 rounded-2xl outline-none font-bold text-sm text-text-primary focus:border-brand"
                  />
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={formData.dueDay}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dueDay: e.target.value }))}
                    placeholder="Vencimento"
                    className="w-full bg-bg-main/40 border border-border-ui/50 p-4 rounded-2xl outline-none font-bold text-sm text-text-primary focus:border-brand"
                  />
                </div>
              )}

              {formData.type === 'vale_alimentacao' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={formData.vaRechargeDay}
                    onChange={(e) => setFormData((prev) => ({ ...prev, vaRechargeDay: e.target.value }))}
                    placeholder="Dia da recarga"
                    className="w-full bg-bg-main/40 border border-border-ui/50 p-4 rounded-2xl outline-none font-bold text-sm text-text-primary focus:border-brand"
                  />
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.vaRechargeAmount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, vaRechargeAmount: e.target.value }))}
                    placeholder="Valor da recarga"
                    className="w-full bg-bg-main/40 border border-border-ui/50 p-4 rounded-2xl outline-none font-bold text-sm text-text-primary focus:border-brand"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full py-4 rounded-2xl border border-border-ui/60 text-text-secondary font-black text-[10px] uppercase tracking-widest hover:bg-bg-main/60 transition-all"
                >
                  Limpar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 rounded-2xl bg-brand text-white font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  {isEditing ? 'Salvar edição' : 'Criar cartão'}
                </button>
              </div>
            </form>
          </div>

          <div className={`w-full md:w-[54%] bg-bg-main/20 flex-col min-h-0 ${mobileTab === 'list' ? 'flex' : 'hidden md:flex'}`}>
            <div className="p-5 md:p-6 border-b border-border-ui/40 flex items-center justify-between">
              <h3 className="text-base font-black uppercase italic text-text-primary">
                Meus <span className="text-brand">Cartões</span>
              </h3>
              <span className="text-[10px] font-black uppercase text-text-secondary">{cards.length} ativos</span>
            </div>

            <div className="p-4 md:p-5 overflow-y-auto custom-scrollbar flex-1 space-y-2.5">
              {!fetching && cards.length === 0 && (
                <div className="h-32 rounded-2xl border border-border-ui/40 bg-bg-card flex items-center justify-center">
                  <p className="text-[10px] font-black uppercase text-text-secondary opacity-50">Nenhum cartão cadastrado</p>
                </div>
              )}

              {cards.map((card) => (
                <div key={card._id} className="bg-bg-card border border-border-ui/40 rounded-2xl p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase italic text-text-primary truncate">{card.name}</p>
                    <p className="text-[9px] font-bold text-text-secondary uppercase mt-1">
                      {card.type === 'vale_alimentacao' ? 'Vale alimentação' : card.type}
                      {card.lastFourDigits ? ` • **** ${card.lastFourDigits}` : ''}
                    </p>
                    {card.type === 'credito' && (
                      <p className="text-[9px] font-bold text-text-secondary mt-1">
                        Limite: R$ {Number(card.creditLimit || 0).toFixed(2)} | Disponível: R$ {Number(card.availableLimit || 0).toFixed(2)}
                      </p>
                    )}
                    {card.type === 'vale_alimentacao' && (
                      <p className="text-[9px] font-bold text-text-secondary mt-1">
                        Saldo VA: R$ {Number(card.vaBalance || 0).toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      onClick={() => loadCardDetails(card)}
                      className="p-2.5 rounded-xl bg-bg-main/60 text-text-secondary hover:text-brand transition-all"
                      title="Detalhes"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleEdit(card)}
                      className="p-2.5 rounded-xl bg-bg-main/60 text-text-secondary hover:text-brand transition-all"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(card._id)}
                      className="p-2.5 rounded-xl bg-bg-main/60 text-text-secondary hover:text-red-500 transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ModalConfirm
        isOpen={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir cartão"
        message="Deseja remover este cartão? Recorrências vinculadas serão pausadas."
      />

      {detailCard && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setDetailCard(null)} />
          <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden bg-bg-card border border-border-ui rounded-[2rem] shadow-2xl flex flex-col">
            <div className="p-5 md:p-6 border-b border-border-ui/40 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black uppercase italic text-text-primary">{detailCard.name}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mt-1">
                  {detailCard.type === 'credito' ? 'Detalhes de fatura' : detailCard.type === 'vale_alimentacao' ? 'Extrato VA' : 'Compras no débito'}
                </p>
              </div>
              <button onClick={() => setDetailCard(null)} className="p-2 rounded-xl hover:bg-bg-main transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar space-y-4">
              {detailLoading && (
                <div className="h-24 flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-brand" />
                </div>
              )}

              {!detailLoading && detailData?.mode === 'credito' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl border border-border-ui/40 bg-bg-main/20">
                    <p className="text-[9px] uppercase font-black text-text-secondary">Vira em</p>
                    <p className="text-sm font-black italic text-brand mt-1">
                      {detailData.summary?.card?.closingDay ? `Todo dia ${detailData.summary.card.closingDay}` : '--'}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border-ui/40 bg-bg-main/20">
                    <p className="text-[9px] uppercase font-black text-text-secondary">Fatura atual</p>
                    <p className="text-sm font-black italic text-red-500 mt-1">
                      R$ {Number(detailData.summary?.currentBill?.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border-ui/40 bg-bg-main/20">
                    <p className="text-[9px] uppercase font-black text-text-secondary">Limite disponível</p>
                    <p className="text-sm font-black italic text-green-500 mt-1">
                      R$ {Number(detailData.summary?.card?.availableLimit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}

              {!detailLoading && detailData?.mode === 'va' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl border border-border-ui/40 bg-bg-main/20">
                    <p className="text-[9px] uppercase font-black text-text-secondary">Saldo VA</p>
                    <p className="text-sm font-black italic text-brand mt-1">
                      R$ {Number(detailData.statement?.card?.vaBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border-ui/40 bg-bg-main/20">
                    <p className="text-[9px] uppercase font-black text-text-secondary">Recarga</p>
                    <p className="text-sm font-black italic text-green-500 mt-1">
                      R$ {Number(detailData.statement?.card?.vaRechargeAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-border-ui/40 bg-bg-main/20">
                    <p className="text-[9px] uppercase font-black text-text-secondary">Vira em</p>
                    <p className="text-sm font-black italic text-text-primary mt-1">
                      Todo dia {detailData.statement?.card?.vaRechargeDay || '--'}
                    </p>
                  </div>
                </div>
              )}

              {!detailLoading && (
                <div className="rounded-2xl border border-border-ui/40 overflow-hidden">
                  <div className="px-4 py-3 bg-bg-main/30 border-b border-border-ui/40 flex items-center gap-2">
                    <Wallet size={14} className="text-brand" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Compras recentes</p>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto custom-scrollbar divide-y divide-border-ui/20">
                    {(detailData?.transactions || []).slice(0, 30).map((t) => (
                      <div key={t._id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase text-text-primary">{t.title}</p>
                          <p className="text-[9px] font-bold text-text-secondary mt-1 flex items-center gap-1">
                            <CalendarClock size={12} />
                            {new Date(t.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <p className={`text-[10px] font-black italic ${t.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                          {t.type === 'entrada' ? '+ ' : '- '}
                          {Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          {t.isProjected ? ' (prevista)' : ''}
                        </p>
                      </div>
                    ))}
                    {(detailData?.transactions || []).length === 0 && (
                      <div className="px-4 py-6 text-center text-[10px] font-black uppercase text-text-secondary opacity-60">
                        Sem compras para este cartão
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  ), document.body);
};

export default ModalCard;
