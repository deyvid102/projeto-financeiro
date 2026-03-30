import mongoose from 'mongoose';

const recurrenceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true, min: [0.01, 'Valor deve ser maior que zero'] },
    type: { type: String, enum: ['entrada', 'saida'], required: true },
    category: { type: String, required: true },

    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'yearly'],
      default: 'monthly',
    },

    dayOfMonth:   { type: [Number], default: [] },
    dayOfWeek:    { type: [Number], default: [] },
    monthOfYear:  { type: [Number], default: [] },

    // ── Controle de Parcelamento ──
    isInstallment: { type: Boolean, default: false },
    totalInstallments: {
      type: Number,
      default: 1,
      min: 1,
      max: 99,
    },
    currentInstallment: {
      type: Number,
      default: 1,
      min: 1,
    },

    // ── Status da Regra ──
    isActive: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active',
    },

    // ── Integração com Metas (Caixinhas) ──
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      default: null,
    },
    isGoalContribution: { type: Boolean, default: false },

    // ── Integração com Cartões ──

    // ID do cartão vinculado (crédito ou VA)
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
      default: null,
    },

    // Flag que identifica a recorrência de recarga automática do VA.
    // Criada automaticamente ao cadastrar um cartão VA — não deve ser editada manualmente.
    isVaRecharge: {
      type: Boolean,
      default: false,
    },

    // Para compras de CRÉDITO: armazena o valor TOTAL comprometido no limite
    // (amount × totalInstallments), calculado na criação.
    totalCreditAmount: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

// ── Middlewares de Negócio ──
recurrenceSchema.pre('save', function (next) {
  // 1. Forçar categoria 'caixinha' para metas
  if (this.goalId || this.isGoalContribution) {
    this.category = 'caixinha';
  }

  // 2. Forçar categoria 'vale_alimentacao' para recargas de VA
  if (this.isVaRecharge) {
    this.category = 'vale_alimentacao';
  }

  // 3. Recorrências de cartão de CRÉDITO devem sempre ser parceladas
  //    e o totalCreditAmount é calculado aqui se ainda não estiver definido
  if (this.cardId && !this.isVaRecharge && this.isInstallment) {
    if (!this.totalCreditAmount) {
      this.totalCreditAmount = parseFloat((this.amount * this.totalInstallments).toFixed(2));
    }
  }

  // 4. Finalização de parcelas
  if (this.isInstallment && this.currentInstallment > this.totalInstallments) {
    this.isActive = false;
    this.status = 'completed';
  }

  next();
});

const ModelRecurrence = mongoose.model('Recurrence', recurrenceSchema);
export default ModelRecurrence;
