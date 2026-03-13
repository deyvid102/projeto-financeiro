import mongoose from 'mongoose';

const investmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'O nome do investimento é obrigatório'],
      trim: true,
      // Exemplos: 'Tesouro Selic', 'Ações PETR4', 'CDB Banco Inter'
    },
    type: {
      type: String,
      enum: ['renda fixa', 'renda variavel', 'criptomoedas', 'outros'],
      required: true,
    },
    amountInvested: {
      type: Number,
      required: [true, 'O valor investido inicial é obrigatório'],
    },
    currentValue: {
      type: Number,
      required: [true, 'O valor atual é obrigatório'],
      // Esse campo pode ser atualizado pelo usuário mensalmente para ver o rendimento
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    maturityDate: {
      type: Date, // Data de vencimento (opcional, útil para Renda Fixa)
    },
  },
  {
    timestamps: true,
  }
);

const Investment = mongoose.model('Investment', investmentSchema);

export default Investment;