import mongoose from 'mongoose';

const investmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    ticker: { type: String, uppercase: true, trim: true }, 
    type: {
      type: String,
      enum: ['renda fixa', 'acoes', 'fiis', 'criptomoedas', 'outros'],
      required: true,
    },
    amountInvested: { type: Number, required: true }, 
    quantity: { type: Number, default: 1 }, 
    purchasePrice: { type: Number },
    // NOVO: Campo para armazenar a taxa (ex: 12.5 para 12.5% a.a.)
    expectedProfitability: { type: Number, default: 0 }, 
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ['em andamento', 'finalizado', 'sacado'],
      default: 'em andamento' 
    }
  },
  { timestamps: true }
);

const Investment = mongoose.model('Investment', investmentSchema);
export default Investment;