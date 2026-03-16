import mongoose from 'mongoose';

const recurrenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['entrada', 'saida'], required: true },
  category: { type: String, default: 'Fixa' },
  
  // Regras de Tempo
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
  dayOfMonth: [{ type: Number }], // Ex: [5, 20]
  dayOfWeek: [{ type: Number }],  // Ex: [1, 3, 5] (Seg, Qua, Sex)
  monthOfYear: [{ type: Number }], // Ex: [0, 5, 11] (Jan, Jun, Dez)
  
  // Lógica de Parcelas
  isInstallment: { type: Boolean, default: false },
  totalInstallments: { type: Number, default: 1 },
  currentInstallment: { type: Number, default: 1 },
  
  isActive: { type: Boolean, default: true }, // Para "Pausar" em vez de deletar
  lastProcessed: { type: Date }, // Evita criar duplicatas no mesmo período
}, { timestamps: true });

export default mongoose.model('Recurrence', recurrenceSchema);