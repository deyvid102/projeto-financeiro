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
      min: [0.01, 'O valor deve ser maior que zero'],
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

    // ── Vínculo com Meta (Caixinha) ──
    goal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      default: null,
    },

    // ── Vínculo com Cartão ──
    // Presente em: débito, VA, compras de crédito (card_bill) e pagamento de fatura (bill_payment)
    card: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
      default: null,
    },

    // ── Origem da Transação ──
    // manual        → criada diretamente pelo usuário (débito, VA, sem cartão)
    // recurrence    → gerada por uma regra de recorrência comum ou meta
    // card_bill     → gerada automaticamente no dia de fechamento do cartão de crédito
    // va_purchase   → compra debitada do saldo do Vale Alimentação
    // va_recharge   → recarga mensal do VA (gerada pela recorrência de recarga)
    // bill_payment  → pagamento de fatura do cartão de crédito
    transactionOrigin: {
      type: String,
      enum: ['manual', 'recurrence', 'card_bill', 'va_purchase', 'va_recharge', 'bill_payment'],
      default: 'manual',
    },

    // ── Vínculo com Recorrência ──
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recurrence',
      default: null,
    },
    installmentNumber: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, card: 1, date: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
