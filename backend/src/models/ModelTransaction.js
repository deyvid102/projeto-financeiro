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
      enum: ['entrada', 'saida'],
      required: [true, 'Especifique se é entrada ou saida'],
    },
    category: {
      type: String,
      required: [true, 'A categoria é obrigatória'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    goal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      required: false,
    },
    // FLAG DE SEGURANÇA: Para validar no front/back se pode editar
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurrenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recurrence',
      default: null
    },
    installmentNumber: {
      type: Number,
      default: null
    }
  },
  { 
    timestamps: true 
  }
);

transactionSchema.index({ user: 1, date: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;