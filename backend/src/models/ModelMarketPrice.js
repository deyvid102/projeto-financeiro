import mongoose from 'mongoose';

const marketPriceSchema = new mongoose.Schema({
  ticker: { type: String, required: true, unique: true, uppercase: true },
  price: { type: Number, required: true },
  type: { type: String, enum: ['criptomoedas', 'acoes', 'fiis'] },
  lastUpdate: { type: Date, default: Date.now }
});

export default mongoose.model('MarketPrice', marketPriceSchema);