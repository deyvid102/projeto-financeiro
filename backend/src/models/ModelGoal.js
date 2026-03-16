import mongoose from 'mongoose';

const GoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'O nome da caixinha é obrigatório'],
    trim: true
  },
  category: {
    type: String,
    enum: ['emergencia', 'carro', 'viagem', 'casa', 'educacao', 'lazer', 'outros'],
    default: 'outros'
  },
  targetAmount: {
    type: Number,
    required: [true, 'Defina um valor de meta para o seu objetivo'],
    min: 0
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  deadline: {
    type: Date
  },
  icon: {
    type: String, 
    default: 'PiggyBank'
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  status: {
    type: String,
    enum: ['ativo', 'concluido'],
    default: 'ativo'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual para progresso
GoalSchema.virtual('progress').get(function() {
  if (this.targetAmount <= 0) return 0;
  const progress = (this.currentAmount / this.targetAmount) * 100;
  return parseFloat(Math.min(progress, 100).toFixed(2));
});

// A LINHA QUE RESOLVE O ERRO:
const Goal = mongoose.model('Goal', GoalSchema);
export default Goal;