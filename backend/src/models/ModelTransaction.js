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
      enum: ['entrada', 'saida'], // Limita os valores possíveis
      required: [true, 'Especifique se é entrada ou saida'],
    },
    category: {
  type: String, // Mude de ObjectId para String
  required: [true, 'A categoria é obrigatória'],
},
    date: {
      type: Date,
      default: Date.now, // Se não passar data, assume a de hoje
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;