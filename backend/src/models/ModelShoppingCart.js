import mongoose from 'mongoose';

const shoppingCartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  itemName: {
    type: String,
    required: [true, 'O nome do item é obrigatório'],
    trim: true
  },
  // Este campo será preenchido automaticamente pela nossa lógica de 'Match'
  category: {
    type: String,
    required: [true, 'A categoria é obrigatória'],
  },
  estimatedPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  itemStatus: {
    type: String,
    enum: ['pending', 'purchased', 'cancelled'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  },
  // Campo para armazenar o link de afiliado específico gerado para este item
  affiliateLink: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ShoppingCart = mongoose.model('ShoppingCart', shoppingCartSchema);
export default ShoppingCart;