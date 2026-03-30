import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'O nome do cartão é obrigatório'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['credito', 'debito', 'vale_alimentacao'],
      required: [true, 'O tipo do cartão é obrigatório'],
    },
    lastFourDigits: {
      type: String,
      trim: true,
      maxlength: [4, 'Máximo 4 dígitos'],
      default: null,
    },
    flag: {
      type: String,
      enum: ['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard', 'Outro'],
      default: 'Outro',
    },
    color: {
      type: String,
      default: '#3b82f6',
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // ──────────────────────────────────────────────
    // Campos exclusivos para CARTÃO DE CRÉDITO
    // ──────────────────────────────────────────────

    // Limite total concedido pela operadora
    creditLimit: {
      type: Number,
      default: 0,
      min: [0, 'Limite não pode ser negativo'],
    },
    // Valor comprometido com compras ainda não pagas.
    // Aumenta ao criar uma compra parcelada (valor total da compra).
    // Diminui ao registrar pagamento de fatura.
    usedLimit: {
      type: Number,
      default: 0,
      min: [0, 'Limite utilizado não pode ser negativo'],
    },
    // Dia do mês em que a fatura fecha (ex: 5)
    closingDay: {
      type: Number,
      min: 1,
      max: 28,
      default: null,
    },
    // Dia do mês em que a fatura vence (ex: 15)
    dueDay: {
      type: Number,
      min: 1,
      max: 28,
      default: null,
    },

    // ──────────────────────────────────────────────
    // Campos exclusivos para VALE ALIMENTAÇÃO
    // ──────────────────────────────────────────────

    // Saldo atual disponível no VA
    vaBalance: {
      type: Number,
      default: 0,
      min: [0, 'Saldo do VA não pode ser negativo'],
    },
    // Dia do mês em que o VA é recarregado (ex: 5)
    vaRechargeDay: {
      type: Number,
      min: 1,
      max: 28,
      default: null,
    },
    // Valor fixo da recarga mensal
    vaRechargeAmount: {
      type: Number,
      default: 0,
      min: [0, 'Valor de recarga não pode ser negativo'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: Limite disponível para novas compras ──
cardSchema.virtual('availableLimit').get(function () {
  if (this.type !== 'credito') return null;
  return parseFloat((this.creditLimit - this.usedLimit).toFixed(2));
});

// ── Virtual: Próxima data de fechamento ──
cardSchema.virtual('nextClosingDate').get(function () {
  if (this.type !== 'credito' || !this.closingDay) return null;
  const today = new Date();
  const closing = new Date(today.getFullYear(), today.getMonth(), this.closingDay);
  // Se o fechamento deste mês já passou, o próximo é no mês seguinte
  if (today.getDate() >= this.closingDay) {
    closing.setMonth(closing.getMonth() + 1);
  }
  return closing;
});

// ── Virtual: Próxima data de vencimento ──
cardSchema.virtual('nextDueDate').get(function () {
  if (this.type !== 'credito' || !this.dueDay || !this.closingDay) return null;
  const closing = this.nextClosingDate;
  if (!closing) return null;
  const due = new Date(closing);
  due.setDate(this.dueDay);
  // Vencimento é após o fechamento
  if (due <= closing) due.setMonth(due.getMonth() + 1);
  return due;
});

// ── Validações por tipo antes de salvar ──
cardSchema.pre('save', function (next) {
  if (this.type === 'credito') {
    if (!this.creditLimit || this.creditLimit <= 0)
      return next(new Error('Cartão de crédito requer um limite válido (> 0).'));
    if (!this.closingDay)
      return next(new Error('Cartão de crédito requer o dia de fechamento.'));
    if (!this.dueDay)
      return next(new Error('Cartão de crédito requer o dia de vencimento.'));
    if (this.dueDay === this.closingDay)
      return next(new Error('Dia de vencimento não pode ser igual ao dia de fechamento.'));
  }

  if (this.type === 'vale_alimentacao') {
    if (!this.vaRechargeDay)
      return next(new Error('Vale Alimentação requer o dia de recarga.'));
    if (!this.vaRechargeAmount || this.vaRechargeAmount <= 0)
      return next(new Error('Vale Alimentação requer um valor de recarga válido (> 0).'));
  }

  next();
});

// Índice para evitar dois cartões com o mesmo nome e tipo para o mesmo usuário
cardSchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

const ModelCard = mongoose.model('Card', cardSchema);
export default ModelCard;
