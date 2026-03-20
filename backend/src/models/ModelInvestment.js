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
    expectedProfitability: {
      type: Number,
      required: [true, 'A rentabilidade esperada é necessária para o cálculo médio'],
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pendente', 'em andamento', 'finalizado', 'sacado'],
      default: 'em andamento' 
    },
    isLiquidated: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    // Isso garante que o virtual apareça quando você der um console.log ou enviar via API
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * Campo Virtual: currentValue
 * Calcula o lucro proporcional ao tempo decorrido automaticamente.
 */
investmentSchema.virtual('currentValue').get(function() {
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);

  if (now < start) return this.amountInvested;
  
  if (now >= end) {
    return parseFloat((this.amountInvested * (1 + (this.expectedProfitability / 100))).toFixed(2));
  }

  const totalDuration = end - start;
  const elapsed = now - start;
  const progressFactor = elapsed / totalDuration;

  const finalValue = this.amountInvested * (1 + (this.expectedProfitability / 100));
  const totalGain = finalValue - this.amountInvested;
  const currentGain = totalGain * progressFactor;
  
  return parseFloat((this.amountInvested + currentGain).toFixed(2));
});

const Investment = mongoose.model('Investment', investmentSchema);
export default Investment;