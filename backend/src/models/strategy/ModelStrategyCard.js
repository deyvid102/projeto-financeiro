import mongoose from 'mongoose';

const childCardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'O nome do card filho é obrigatório'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StrategyCategory',
    }],
    // ── Função Vinculada (Goal, Investment, Recurrence, ShoppingCart, Card) ──
    linkedFunction: {
      type: {
        type: String,
        enum: ['goal', 'investment', 'recurrence', 'shoppingcart', 'card'],
        default: null,
      },
      referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },
  },
  { timestamps: true }
);

const strategyCardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'O título do card pai é obrigatório'],
      trim: true,
    },
    size: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium',
    },
    shape: {
      type: String,
      enum: ['rounded-rectangle'],
      default: 'rounded-rectangle',
    },
    
    // ── CONFIGURAÇÕES DE CONECTIVIDADE UML (ATUALIZADO) ──
    connectedTo: [{
      targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'StrategyCard' },
      fromSide: { type: String, enum: ['top', 'bottom', 'left', 'right', 'center'] },
      // Tipos de linha atualizados para: line, dotted-line, red-line, green-line
      type: { 
        type: String, 
        enum: ['line', 'dotted-line', 'red-line', 'green-line'], 
        default: 'line' 
      },
      // Valor associado apenas relevante para linhas coloridas (red/green)
      amount: { type: Number, default: 0 }
    }],

    // ── Coordenadas de posicionamento na tela ──
    position: {
      x: { type: Number, default: 100 },
      y: { type: Number, default: 120 }
    },

    // ── Itens Internos (Atributos e Métodos encapsulados) ──
    childCards: [childCardSchema]
  },
  { timestamps: true }
);

const StrategyCard = mongoose.model('StrategyCard', strategyCardSchema);
export default StrategyCard;