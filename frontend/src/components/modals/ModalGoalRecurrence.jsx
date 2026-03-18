import React, { useState, useEffect, useMemo } from "react";
import { X, Loader2, Target, DollarSign, Calendar, Hash } from "lucide-react";
import api from "@/services/api"; 
import { useAlert } from "@/context/AlertContext";
import SelectStyle from "@/components/SelectStyle"; 

const ModalGoalRecurrence = ({ isOpen, onClose, onAdded }) => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState([]); 

  const monthsList = [
    { value: 1, name: "Jan" }, { value: 2, name: "Fev" }, { value: 3, name: "Mar" },
    { value: 4, name: "Abr" }, { value: 5, name: "Mai" }, { value: 6, name: "Jun" },
    { value: 7, name: "Jul" }, { value: 8, name: "Ago" }, { value: 9, name: "Set" },
    { value: 10, name: "Out" }, { value: 11, name: "Nov" }, { value: 12, name: "Dez" }
  ];

  const initialForm = {
    amount: '', 
    goalId: '', 
    frequency: 'monthly',
    dayOfMonth: [], 
    dayOfWeek: [],
    monthOfYear: []
  };

  const [formData, setFormData] = useState(initialForm);

  const goalsOptions = useMemo(() => goals.map(g => ({ 
    value: g._id, 
    name: g.name 
  })), [goals]);

  const fetchData = async () => {
    try {
      const res = await api.get('/goals');
      setGoals(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (isOpen) { fetchData(); setFormData(initialForm); } }, [isOpen]);

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
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
            <button key={d} type="button" onClick={() => toggleSelection(d, 'dayOfMonth')} className={`h-8 rounded-lg text-[10px] font-bold border ${formData.dayOfMonth.includes(d) ? 'bg-brand border-brand text-black' : 'bg-bg-main/30 border-border-ui/50 text-text-secondary'}`}>{d}</button>
          ))}
        </div>
      );
    }
    if (formData.frequency === 'weekly') {
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      return (
        <div className="grid grid-cols-7 gap-1">
          {days.map((l, i) => (
            <button key={i} type="button" onClick={() => toggleSelection(i, 'dayOfWeek')} className={`py-2 rounded-lg text-[10px] font-bold border ${formData.dayOfWeek.includes(i) ? 'bg-brand border-brand text-black' : 'bg-bg-main/30 border-border-ui/50 text-text-secondary'}`}>{l}</button>
          ))}
        </div>
      );
    }
    if (formData.frequency === 'yearly') {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-1">
            {monthsList.map(m => (
              <button key={m.value} type="button" onClick={() => toggleSelection(m.value, 'monthOfYear')} className={`py-2 rounded-lg text-[9px] font-bold border ${formData.monthOfYear.includes(m.value) ? 'bg-brand border-brand text-black' : 'bg-bg-main/30 border-border-ui/50 text-text-secondary'}`}>{m.name}</button>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 border-t border-border-ui/30 pt-3">
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <button key={d} type="button" onClick={() => toggleSelection(d, 'dayOfMonth')} className={`h-8 rounded-lg text-[10px] font-bold border ${formData.dayOfMonth.includes(d) ? 'bg-brand border-brand text-black' : 'bg-bg-main/30 border-border-ui/50 text-text-secondary'}`}>{d}</button>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const hasSelection = 
      (formData.frequency === 'monthly' && formData.dayOfMonth.length > 0) ||
      (formData.frequency === 'weekly' && formData.dayOfWeek.length > 0) ||
      (formData.frequency === 'yearly' && formData.monthOfYear.length > 0 && formData.dayOfMonth.length > 0);

    if (!formData.goalId || !formData.amount || !hasSelection) {
      return showAlert("Preencha todos os campos e selecione os períodos.", "error");
    }

    setLoading(true);
    const selectedGoal = goals.find(g => g._id === formData.goalId);

    try {
      await api.post('/recurrences', {
        ...formData,
        title: `Aporte: ${selectedGoal.name}`,
        amount: parseFloat(formData.amount),
        type: 'saida',
        category: 'caixinha',
        isGoalContribution: true,
        isActive: true
      });

      showAlert("Investimento automático ativado!", "success");
      onAdded();
      onClose();
    } catch (err) {
      showAlert("Erro ao salvar.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className="bg-bg-card w-full max-w-lg rounded-[2.5rem] border border-border-ui shadow-2xl relative z-10 overflow-hidden">
        <div className="p-6 bg-brand text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Programar <span className="text-black/30">Caixinha</span></h2>
          </div>
          <button onClick={onClose} className="hover:scale-110 transition-transform"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <SelectStyle 
            icon={Target} 
            options={goalsOptions} 
            value={formData.goalId} 
            onChange={(e) => setFormData({...formData, goalId: e.target.value})} 
            placeholder="Qual caixinha quer alimentar?" 
          />

          <div className="relative flex items-center">
            <DollarSign className="absolute left-4 opacity-30" size={16} />
            <input 
              type="number" 
              placeholder="Valor do aporte mensal" 
              className="w-full bg-bg-main/50 border border-border-ui/50 p-4 pl-12 rounded-2xl focus:border-brand outline-none font-bold text-sm text-text-primary" 
              value={formData.amount} 
              onChange={(e) => setFormData({...formData, amount: e.target.value})} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase opacity-40 ml-1 italic">Frequência do aporte:</label>
            <div className="grid grid-cols-3 gap-2">
              {['monthly', 'weekly', 'yearly'].map(f => (
                <button key={f} type="button" onClick={() => setFormData({ ...formData, frequency: f, dayOfMonth: [], dayOfWeek: [], monthOfYear: [] })} className={`py-2.5 rounded-xl text-[9px] font-black uppercase border ${formData.frequency === f ? 'bg-brand/10 border-brand text-brand' : 'bg-bg-main/30 border-border-ui/50 text-text-secondary'}`}>{f === 'monthly' ? 'Mês' : f === 'weekly' ? 'Semana' : 'Ano'}</button>
              ))}
            </div>
          </div>

          <div className="bg-bg-main/20 p-4 rounded-2xl border border-border-ui/30">
              {renderPickers()}
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-brand text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : "CONFIRMAR PROGRAMAÇÃO"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModalGoalRecurrence;