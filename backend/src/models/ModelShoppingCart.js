import mongoose from 'mongoose';

const shoppingCartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// REMOVA: module.exports = mongoose.model('ShoppingCart', shoppingCartSchema);
// ADICIONE:
const ShoppingCart = mongoose.model('ShoppingCart', shoppingCartSchema);
export default ShoppingCart;