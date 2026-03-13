import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'O nome da categoria é obrigatório'],
      trim: true,
    },
    color: { 
      type: String, 
      default: '#3b82f6' // Cor padrão (azul) para exibir no front
    },
    type: {
      type: String,
      enum: ['transacao', 'investimento', 'ambos'],
      default: 'transacao'
    }
  },
  { timestamps: true }
);

// Evita que o usuário crie duas categorias com o mesmo nome
categorySchema.index({ user: 1, name: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);
export default Category;