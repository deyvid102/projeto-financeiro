import React, { useState, useEffect } from "react";
import { X, Trash2, Loader2, Pencil, Plus, Calendar as CalendarIcon, CreditCard, Repeat, Target, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/services/Api"; 
import { useAlert } from "@/context/AlertContext";
import ModalConfirm from "@/components/modals/ModalConfirm";

// Importação correta do seu componente customizado
import SelectStyle from "@/components/SelectStyle"; 

const ModalRecurrence = ({ isOpen, onClose, onAdded }) => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [recurrences, setRecurrences] = useState([]);
  const [goals, setGoals] = useState([]); 
  const [fetching, setFetching] = useState(false);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialForm = {
    title: '',
    amount: '',
    type: 'saida',
    category: 'Fixa',
    goalId: '', 
    frequency: 'monthly',
    dayOfMonth: [new Date().getDate()],
    dayOfWeek: [1],
    monthOfYear: [new Date().getMonth()],
    isInstallment: false,
    totalInstallments: 12
  };

  const [formData, setFormData] = useState(initialForm);

  // Mapeando as categorias para o formato que seu SelectStyle espera [{ name: '...' }]
  const categoriesOptions = [
    { name: "Fixa" }, { name: "Assinaturas" }, { name: "Lazer" }, 
    { name: "Saúde" }, { name: "Alimentação" }, { name: "Educação" }, 
    { name: "Investimento" }, { name: "Outros" }
  ];

  // Mapeando goals para o formato do select
  const goalsOptions = goals.map(g => ({ value: g._id, name: g.title }));

  const toggleSelection = (field, value) => {
    setFormData(prev => {
      const currentValues = Array.isArray(prev[field]) ? prev[field] : [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [field]: newValues };
    });
  };

  const fetchData = async () => {
    setFetching(true);
    try {
      const [resRec, resGoals] = await Promise.all([
        api.get('/recurrences'),
        api.get('/goals') 
      ]);
      setRecurrences(Array.isArray(resRec.data) ? resRec.data : []);
      setGoals(Array.isArray(resGoals.data) ? resGoals.data : []);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleEditClick = (rec) => {
    setEditingId(rec._id);
    setFormData({
      title: rec.title,
      amount: rec.amount.toString(),
      type: rec.type,
      category: rec.category || 'Fixa',
      goalId: rec.goalId || '',
      frequency: rec.frequency || 'monthly',
      dayOfMonth: Array.isArray(rec.dayOfMonth) ? rec.dayOfMonth : [rec.dayOfMonth || 1],
      dayOfWeek: Array.isArray(rec.dayOfWeek) ? rec.dayOfWeek : [rec.dayOfWeek || 1],
      monthOfYear: Array.isArray(rec.monthOfYear) ? rec.monthOfYear : [rec.monthOfYear || 0],
      isInstallment: rec.isInstallment || false,
      totalInstallments: rec.totalInstallments || 12
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return showAlert("Preencha título e valor.", "error");

    setLoading(true);
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        totalInstallments: formData.isInstallment ? parseInt(formData.totalInstallments) : 1,
        dayOfMonth: typeof formData.dayOfMonth === 'string' 
          ? formData.dayOfMonth.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d))
          : formData.dayOfMonth
      };

      if (editingId) {
        await api.put(`/recurrences/${editingId}`, payload);
        showAlert("Atualizado!", "success");
      } else {
        await api.post('/recurrences', payload);
        showAlert("Plano ativado!", "success");
      }

      resetForm();
      fetchData();
      onAdded();
    } catch (err) {
      showAlert(`Erro ao salvar.`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/recurrences/${idToDelete}`);
      showAlert("Removido.", "success");
      fetchData();
      onAdded();
    } catch (err) {
      showAlert("Erro ao remover.", "error");
    } finally {
      setDeleteLoading(false);
      setIsConfirmOpen(false);
    }
  };

  const frequencies = [
    { label: "Mensal", value: "monthly" },
    { label: "Semanal", value: "weekly" },
    { label: "Anual", value: "yearly" }
  ];
  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="bg-bg-card w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] border border-border-ui shadow-2xl relative z-10 flex flex-col md:flex-row overflow-hidden"
          >
            {/* FORMULÁRIO */}
            <div className="flex-1 border-r border-border-ui/50 overflow-y-auto custom-scrollbar">
              <div className={`p-6 text-white transition-colors sticky top-0 z-20 ${editingId ? 'bg-orange-500' : 'bg-brand'}`}>
                <h2 className="text-xl font-black uppercase italic tracking-tighter">
                  {editingId ? 'Editar' : 'Nova'} <span className="text-black/30">Recorrência</span>
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setFormData({...formData, type: 'entrada'})} className={`py-2.5 rounded-xl font-black uppercase text-[9px] border-2 transition-all ${formData.type === 'entrada' ? 'bg-green-500 border-green-500 text-white' : 'bg-bg-main/50 border-border-ui/50 text-text-secondary'}`}>Entrada</button>
                  <button type="button" onClick={() => setFormData({...formData, type: 'saida'})} className={`py-2.5 rounded-xl font-black uppercase text-[9px] border-2 transition-all ${formData.type === 'saida' ? 'bg-red-500 border-red-500 text-white' : 'bg-bg-main/50 border-border-ui/50 text-text-secondary'}`}>Saída</button>
                </div>
                
                <input placeholder="Título" className="w-full bg-bg-main/50 border border-border-ui/50 p-4 rounded-xl focus:border-brand outline-none font-bold text-sm text-text-primary" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Valor" className="bg-bg-main/50 border border-border-ui/50 p-4 rounded-xl focus:border-brand outline-none font-bold text-sm text-text-primary" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                  <button type="button" onClick={() => setFormData({...formData, isInstallment: !formData.isInstallment})} 
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 transition-all font-black uppercase text-[9px] ${formData.isInstallment ? 'border-orange-500/50 bg-orange-500/10 text-orange-500' : 'border-border-ui/50 text-text-secondary'}`}>
                    {formData.isInstallment ? <CreditCard size={14}/> : <Repeat size={14}/>} {formData.isInstallment ? 'Parcelado' : 'Fixo'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {/* SELEÇÃO DE CATEGORIA USANDO SEU COMPONENTE */}
                  <SelectStyle 
                    icon={Tag}
                    options={categoriesOptions}
                    value={formData.category}
                    name="category"
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="Categoria"
                  />

                  {/* VINCULAR CAIXINHA USANDO SEU COMPONENTE */}
                  <SelectStyle 
                    icon={Target}
                    options={goalsOptions}
                    value={formData.goalId}
                    name="goalId"
                    onChange={(e) => setFormData({...formData, goalId: e.target.value})}
                    placeholder="Caixinha"
                  />
                </div>

                {formData.isInstallment && (
                  <div className="animate-in zoom-in-95 duration-200">
                    <label className="text-[9px] font-black uppercase opacity-40 ml-1">Total de Parcelas</label>
                    <input type="number" className="w-full bg-orange-500/5 border border-orange-500/20 p-4 rounded-xl focus:border-orange-500 outline-none font-bold text-sm text-text-primary" value={formData.totalInstallments} onChange={(e) => setFormData({...formData, totalInstallments: e.target.value})} />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase opacity-40 ml-1">Frequência</label>
                  <div className="grid grid-cols-3 gap-2">
                    {frequencies.map((f) => (
                      <button key={f.value} type="button" onClick={() => setFormData({ ...formData, frequency: f.value })} className={`py-2.5 rounded-xl text-[9px] font-black uppercase border transition-all ${formData.frequency === f.value ? 'bg-brand/10 border-brand text-brand' : 'bg-bg-main/30 border-border-ui/50 text-text-secondary'}`}>{f.label}</button>
                    ))}
                  </div>
                </div>

                <div className="bg-bg-main/20 p-3 rounded-2xl border border-border-ui/30">
                  {formData.frequency === 'weekly' && (
                    <div className="text-center">
                      <label className="text-[9px] font-black uppercase opacity-40 mb-2 block">Dias da Semana</label>
                      <div className="flex justify-center flex-wrap gap-1">
                        {daysOfWeek.map((day, idx) => (
                          <button key={day} type="button" onClick={() => toggleSelection('dayOfWeek', idx)}
                            className={`w-8 h-8 rounded-lg text-[8px] font-black uppercase transition-all border ${formData.dayOfWeek?.includes(idx) ? 'bg-brand border-brand text-white' : 'border-border-ui/50 text-text-secondary'}`}>
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(formData.frequency === 'monthly' || formData.frequency === 'yearly') && (
                    <div className="mt-2">
                      <label className="text-[9px] font-black uppercase opacity-40 block text-center mb-1.5">Dia do Vencimento</label>
                      <input type="text" placeholder="Ex: 5" className="w-full bg-bg-card border border-border-ui/50 p-2.5 rounded-xl text-center focus:border-brand outline-none font-bold text-sm text-text-primary" 
                        value={Array.isArray(formData.dayOfMonth) ? formData.dayOfMonth.join(', ') : formData.dayOfMonth} 
                        onChange={(e) => setFormData({...formData, dayOfMonth: e.target.value})} 
                      />
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading} className={`w-full text-white py-4 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all ${editingId ? 'bg-orange-500' : 'bg-brand'}`}>
                  {loading ? <Loader2 className="animate-spin" size={14} /> : (editingId ? "SALVAR ALTERAÇÕES" : "ATIVAR PLANO")}
                </button>
              </form>
            </div>

            {/* LISTAGEM */}
            <div className="flex-1 bg-bg-main/30 flex flex-col min-h-0">
              <div className="p-6 flex justify-between items-center border-b border-border-ui/50">
                <h3 className="font-black uppercase italic text-base tracking-tighter text-text-primary">Recorrências</h3>
                <button onClick={onClose} className="text-text-secondary"><X size={18} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
                {fetching ? <div className="flex justify-center py-10"><Loader2 className="animate-spin opacity-20" /></div> : 
                  recurrences.map((rec) => (
                    <div key={rec._id} className="bg-bg-card border border-border-ui/50 p-3 rounded-2xl flex items-center justify-between group">
                      <div className="flex items-center gap-2.5">
                        <div className={rec.type === 'entrada' ? 'text-green-500' : 'text-red-500'}>
                          {rec.goalId ? <Target size={16} /> : rec.isInstallment ? <CreditCard size={16} /> : <CalendarIcon size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-black uppercase text-text-primary truncate">{rec.title}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-bg-main border border-border-ui/50 text-text-secondary font-bold uppercase">{rec.category}</span>
                            <p className="text-[8px] font-bold opacity-60 text-text-secondary uppercase">
                              {rec.isInstallment ? `(${rec.totalInstallments}x)` : `Dia ${rec.dayOfMonth?.join(', ')}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => handleEditClick(rec)} className="p-1.5 text-text-secondary hover:text-brand"><Pencil size={12} /></button>
                        <button onClick={() => { setIdToDelete(rec._id); setIsConfirmOpen(true); }} className="p-1.5 text-text-secondary hover:text-red-500"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </motion.div>
        </div>
      )}
      <ModalConfirm isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} loading={deleteLoading} title="Interromper Plano" message="Confirmar exclusão desta regra?" />
    </AnimatePresence>
  );
};

export default ModalRecurrence;