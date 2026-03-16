import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'O título da transação é obrigatório'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'O valor é obrigatório'],
    },
    type: {
      type: String,
      enum: ['entrada', 'saida'], // Verifique se o front envia exatamente isso
      required: [true, 'Especifique se é entrada ou saida'],
    },
    category: {
      type: String,
      required: [true, 'A categoria é obrigatória'],
    },
    // O CAMPO QUE FALTAVA:
    goal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      required: false, // Opcional, pois nem toda transação é de caixinha
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;