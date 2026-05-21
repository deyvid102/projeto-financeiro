import mongoose from 'mongoose';

const strategyCategorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'O nome da categoria do card é obrigatório'],
      trim: true,
    },
    color: {
      type: String,
      default: '#3b82f6', // Cor padrão para renderização visual
    },
  },
  { timestamps: true }
);

// Evita que o mesmo usuário replique categorias idênticas
strategyCategorySchema.index({ user: 1, name: 1 }, { unique: true });

const StrategyCategory = mongoose.model('StrategyCategory', strategyCategorySchema);
export default StrategyCategory;