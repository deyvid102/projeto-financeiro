import React, { useState, useEffect, useMemo } from "react";
import { X, Trash2, Loader2, CreditCard, Repeat, Tag, DollarSign, Target, Hash, Plus, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import api from "@/services/api"; 
import { useAlert } from "@/context/AlertContext";
import ModalConfirm from "@/components/modals/ModalConfirm";
import SelectStyle from "@/components/SelectStyle"; 
import ModalGoalRecurrence from "./ModalGoalRecurrence";

const ModalRecurrence = ({ isOpen, onClose, onAdded }) => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [recurrences, setRecurrences] = useState([]);
  const [categories, setCategories] = useState([]);
  const [fetching, setFetching] = useState(false);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  const monthsList = [
    { value: 1, name: "Jan" }, { value: 2, name: "Fev" }, { value: 3, name: "Mar" },
    { value: 4, name: "Abr" }, { value: 5, name: "Mai" }, { value: 6, name: "Jun" },
    { value: 7, name: "Jul" }, { value: 8, name: "Ago" }, { value: 9, name: "Set" },
    { value: 10, name: "Out" }, { value: 11, name: "Nov" }, { value: 12, name: "Dez" }
  ];

  const initialForm = {
    title: '', 
    amount: '', 
    type: 'saida', 
    category: '', 
    frequency: 'monthly', 
    dayOfMonth: [], 
    dayOfWeek: [], 
    monthOfYear: [],
    isInstallment: false, 
    totalInstallments: 1
  };

  const [formData, setFormData] = useState(initialForm);

  const categoriesOptions = useMemo(() => categories.map(c => ({ value: c.name, name: c.name })), [categories]);

  const toggleSelection = (value, field) => {
    setFormData(prev => {
      const currentSelection = prev[field] || [];
      const newSelection = currentSelection.includes(value)
        ? currentSelection.filter(v => v !== value)
        : [...currentSelection, value];
      return { ...prev, [field]: newSelection };
    });
  };

  const renderPickers = () => {
    if (formData.frequency === 'monthly') {
      return (
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase opacity-40 ml-1 italic">Dias do mês:</label>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <button key={d} type="button" onClick={() => toggleSelection(d, 'dayOfMonth')} className={`h-8 rounded-lg text-[10px] font-bold border ${formData.dayOfMonth.includes(d) ? 'bg-brand border-brand text-black' : 'bg-bg-main/30 border-border-ui/50 text-text-secondary'}`}>{d}</button>
            ))}
          </div>
        </div>
      );
    }
    if (formData.frequency === 'weekly') {
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      return (
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase opacity-40 ml-1 italic">Dias da semana:</label>
          <div className="grid grid-cols-7 gap-1">
            {days.map((l, i) => (
              <button key={i} type="button" onClick={() => toggleSelection(i, 'dayOfWeek')} className={`py-2 rounded-lg text-[10px] font-bold border ${formData.dayOfWeek.includes(i) ? 'bg-brand border-brand text-black' : 'bg-bg-main/30 border-border-ui/50 text-text-secondary'}`}>{l}</button>
            ))}
          </div>
        </div>
      );
    }
    if (formData.frequency === 'yearly') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-1">
            {monthsList.map(m => (
              <button key={m.value} type="button" onClick={() => toggleSelection(m.value, 'monthOfYear')} className={`py-2 rounded-lg text-[9px] font-bold border ${formData.monthOfYear.includes(m.value) ? 'bg-brand border-brand text-black' : 'bg-bg-main/30 border-border-ui/50 text-text-secondary'}`}>{m.name}</button>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <button key={d} type="button" onClick={() => toggleSelection(d, 'dayOfMonth')} className={`h-8 rounded-lg text-[10px] font-bold border ${formData.dayOfMonth.includes(d) ? 'bg-brand border-brand text-black' : 'bg-bg-main/30 border-border-ui/50 text-text-secondary'}`}>{d}</button>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const fetchData = async () => {
    setFetching(true);
    try {
      const [resRec, resCats] = await Promise.all([
        api.get('/recurrences'), api.get('/categories')
      ]);
      setRecurrences(Array.isArray(resRec.data) ? resRec.data : []);
      setCategories(Array.isArray(resCats.data) ? resCats.data : []);
    } catch (err) { console.error(err); } finally { setFetching(false); }
  };

  useEffect(() => { if (isOpen) { fetchData(); resetForm(); } }, [isOpen]);

  const resetForm = () => { setFormData(initialForm); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasSelection = 
      (formData.frequency === 'monthly' && formData.dayOfMonth.length > 0) ||
      (formData.frequency === 'weekly' && formData.dayOfWeek.length > 0) ||
      (formData.frequency === 'yearly' && formData.monthOfYear.length > 0 && formData.dayOfMonth.length > 0);

    if (!formData.title || !formData.amount || !hasSelection) {
      return showAlert("Preencha título, valor e os dias.", "error");
    }

    setLoading(true);
    try {
      await api.post('/recurrences', {
        ...formData,
        amount: parseFloat(formData.amount),
        isGoalContribution: false,
        isActive: true
      });
      showAlert("Salvo!", "success");
      resetForm(); fetchData(); onAdded();
    } catch (err) { showAlert("Erro ao salvar.", "error"); } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
        <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
        <div className="bg-bg-card w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] border border-border-ui shadow-2xl relative z-10 flex flex-col md:flex-row overflow-hidden">
          
          <div className="flex-1 border-r border-border-ui/50 overflow-y-auto custom-scrollbar">
            <div className="p-6 bg-brand text-white sticky top-0 z-20 flex justify-between items-center">
              <h2 className="text-xl font-black uppercase italic tracking-tighter">Programar <span className="text-black/30">Recorrência</span></h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setFormData({...formData, type: 'entrada'})} className={`py-2.5 rounded-xl font-black uppercase text-[9px] border-2 ${formData.type === 'entrada' ? 'bg-green-500 border-green-500 text-white' : 'bg-bg-main/50 border-border-ui/50 text-text-secondary'}`}>Entrada</button>
                <button type="button" onClick={() => setFormData({...formData, type: 'saida'})} className={`py-2.5 rounded-xl font-black uppercase text-[9px] border-2 ${formData.type === 'saida' ? 'bg-red-500 border-red-500 text-white' : 'bg-bg-main/50 border-border-ui/50 text-text-secondary'}`}>Saída</button>
              </div>

              <input 
                placeholder="Título da Recorrência" 
                className="w-full bg-bg-main/50 border border-border-ui/50 p-4 rounded-xl outline-none font-bold text-sm text-text-primary focus:border-brand" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="relative flex items-center">
                  <DollarSign className="absolute left-3 opacity-30" size={14} />
                  <input type="number" placeholder="0.00" className="w-full bg-bg-main/50 border border-border-ui/50 p-4 pl-10 rounded-xl focus:border-brand outline-none font-bold text-sm text-text-primary" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                </div>
                <button type="button" onClick={() => setFormData({...formData, isInstallment: !formData.isInstallment})} className={`flex items-center justify-center gap-2 rounded-xl border-2 font-black uppercase text-[9px] ${formData.isInstallment ? 'border-orange-500 bg-orange-500/10 text-orange-500' : 'border-border-ui/50 text-text-secondary'}`}>
                  {formData.isInstallment ? <CreditCard size={14}/> : <Repeat size={14}/>} {formData.isInstallment ? 'Parcelado' : 'Fixo'}
                </button>
              </div>

              {formData.isInstallment && (
                <div className="relative flex items-center">
                  <Hash className="absolute left-3 opacity-30" size={14} />
                  <input type="number" min="1" max="99" placeholder="Parcelas" className="w-full bg-bg-main/50 border border-orange-500/30 p-4 pl-10 rounded-xl focus:border-orange-500 outline-none font-bold text-sm text-text-primary" value={formData.totalInstallments} onChange={(e) => setFormData({...formData, totalInstallments: Math.min(99, parseInt(e.target.value) || 1)})} />
                  <span className="absolute right-4 text-[9px] font-black text-orange-500 uppercase italic">Máx 99x</span>
                </div>
              )}

              <SelectStyle icon={Tag} options={categoriesOptions} value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="Categoria" />

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase opacity-40 ml-1 italic">Repetição:</label>
                <div className="grid grid-cols-3 gap-2">
                  {['monthly', 'weekly', 'yearly'].map(f => (
                    <button key={f} type="button" onClick={() => setFormData({ ...formData, frequency: f, dayOfMonth: [], dayOfWeek: [], monthOfYear: [] })} className={`py-2.5 rounded-xl text-[9px] font-black uppercase border ${formData.frequency === f ? 'bg-brand/10 border-brand text-brand' : 'bg-bg-main/30 border-border-ui/50 text-text-secondary'}`}>{f === 'monthly' ? 'Mês' : f === 'weekly' ? 'Semana' : 'Ano'}</button>
                  ))}
                </div>
              </div>

              <div className="bg-bg-main/20 p-4 rounded-2xl border border-border-ui/30">
                  {renderPickers() || <p className="text-center text-[9px] uppercase font-black opacity-30 py-4 italic">Escolha uma frequência</p>}
              </div>

              <button type="submit" disabled={loading} className="w-full bg-brand text-white py-4 rounded-xl font-black uppercase text-[9px] shadow-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all">
                {loading ? <Loader2 className="animate-spin" size={14} /> : "CONFIRMAR PROGRAMAÇÃO"}
              </button>
            </form>
          </div>

          <div className="flex-1 bg-bg-main/30 flex flex-col min-h-0">
             <div className="p-6 border-b border-border-ui/50 flex justify-between items-center bg-bg-card/50 backdrop-blur-sm sticky top-0 z-20">
               <h3 className="font-black uppercase italic text-base text-text-primary">Ativos</h3>
               <button onClick={onClose} className="text-text-secondary hover:text-text-primary"><X size={18}/></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
               {recurrences.map(rec => (
                 <div key={rec._id} className="bg-bg-card border border-border-ui/50 p-3 rounded-2xl flex items-center justify-between group hover:border-brand/40 transition-all">
                   <div className="flex items-center gap-3 min-w-0">
                     {/* Símbolo de Entrada/Saída */}
                     {rec.type === 'entrada' ? (
                       <ArrowUpCircle size={18} className="text-green-500 shrink-0 opacity-60" />
                     ) : (
                       <ArrowDownCircle size={18} className="text-red-500 shrink-0 opacity-60" />
                     )}
                     <div className="min-w-0">
                       <p className="text-[9px] font-black uppercase truncate italic leading-none mb-1">{rec.title}</p>
                       <p className="text-[8px] font-bold opacity-60">
                         R$ {rec.amount.toFixed(2)} | {rec.isInstallment ? `${rec.currentInstallment}/${rec.totalInstallments} parc.` : rec.frequency}
                       </p>
                     </div>
                   </div>
                   <button onClick={() => { setIdToDelete(rec._id); setIsConfirmOpen(true); }} className="text-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12}/></button>
                 </div>
               ))}
             </div>

             {/* Botão de Caixinha no rodapé da lista */}
             <div className="p-4 bg-bg-card/50 border-t border-border-ui/50">
                <button 
                  onClick={() => setIsGoalModalOpen(true)}
                  className="w-full bg-brand/10 border border-brand/40 text-brand py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-brand hover:text-white transition-all group"
                >
                  <Target size={16} className="group-hover:scale-110 transition-transform"/>
                  <span className="text-[9px] font-black uppercase italic">Programar Aporte Caixinha</span>
                </button>
             </div>
          </div>
        </div>

        <ModalConfirm 
          isOpen={isConfirmOpen} 
          onClose={() => setIsConfirmOpen(false)} 
          onConfirm={async () => { 
            try { 
              await api.delete(`/recurrences/${idToDelete}`); 
              showAlert("Removido!", "success"); 
              fetchData(); 
            } catch (err) { 
              showAlert("Erro!", "error"); 
            } finally { 
              setIsConfirmOpen(false); 
            } 
          }} 
          title="Parar Recorrência" 
          message="Deseja excluir esta regra?" 
        />
      </div>

      <ModalGoalRecurrence 
        isOpen={isGoalModalOpen} 
        onClose={() => setIsGoalModalOpen(false)} 
        onAdded={() => { fetchData(); onAdded(); }}
      />
    </>
  );
};

export default ModalRecurrence;