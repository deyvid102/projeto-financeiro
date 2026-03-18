import mongoose from 'mongoose';

const recurrenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['entrada', 'saida'], required: true },
  category: { type: String, required: true },
  
  frequency: { type: String, enum: ['weekly', 'monthly', 'yearly'], default: 'monthly' },
  
  dayOfMonth: { type: [Number], default: [] },
  dayOfWeek: { type: [Number], default: [] },
  monthOfYear: { type: [Number], default: [] },

  // Controle de Parcelamento
  isInstallment: { type: Boolean, default: false },
  totalInstallments: { 
    type: Number, 
    default: 1,
    min: 1,
    max: 99 // Limite de 99 parcelas solicitado
  },
  currentInstallment: { 
    type: Number, 
    default: 1,
    min: 1
  },

  // Status da Regra
  isActive: { type: Boolean, default: true },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'paused'], 
    default: 'active' 
  },

  // Integração com Metas (Caixinhas)
  goalId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Goal', 
    default: null 
  },
  isGoalContribution: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Middlewares de Negócio
recurrenceSchema.pre('save', function(next) {
  // 1. Forçar categoria 'caixinha' para metas
  if (this.goalId || this.isGoalContribution) {
    this.category = 'caixinha';
  }

  // 2. Lógica de Finalização de Parcelas
  // Se for parcelado e a parcela atual já ultrapassou o total, desativa.
  if (this.isInstallment && this.currentInstallment > this.totalInstallments) {
    this.isActive = false;
    this.status = 'completed';
  }

  next();
});

const ModelRecurrence = mongoose.model('Recurrence', recurrenceSchema);
export default ModelRecurrence;