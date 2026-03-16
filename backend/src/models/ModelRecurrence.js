import mongoose from 'mongoose';

const recurrenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['entrada', 'saida'], required: true },
  category: { type: String, default: 'Fixa' },
  
  // ADICIONE ESTA LINHA AQUI:
  goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', default: null },

  // Regras de Tempo
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
  dayOfMonth: [{ type: Number }], 
  dayOfWeek: [{ type: Number }],  
  monthOfYear: [{ type: Number }], 
  
  // Lógica de Parcelas
  isInstallment: { type: Boolean, default: false },
  totalInstallments: { type: Number, default: 1 },
  currentInstallment: { type: Number, default: 1 },
  
  isActive: { type: Boolean, default: true }, 
  lastProcessed: { type: Date }, 
}, { timestamps: true });

export default mongoose.model('Recurrence', recurrenceSchema);