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
    
    // Preço no momento em que o usuário comprou (histórico)
    purchasePrice: { type: Number },
    
    // Taxa para Renda Fixa (ex: 12.5% a.a.)
    expectedProfitability: { type: Number, default: 0 }, 
    
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    
    status: {
      type: String,
      enum: ['em andamento', 'finalizado', 'sacado'],
      default: 'em andamento' 
    },

    // Removidos: lastPrice e lastUpdate (agora ficam na tabela MarketPrice)
  },
  { timestamps: true }
);

const Investment = mongoose.model('Investment', investmentSchema);
export default Investment;