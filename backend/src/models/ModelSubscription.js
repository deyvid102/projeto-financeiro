import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  method: { type: String },
  transactionId: { type: String },
  note: { type: String },
}, { _id: false });

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['STARTER', 'PRO', 'MAX'], required: true },
  price: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'paid', 'cancelled', 'overdue'], default: 'pending' },
  paymentHistory: { type: [paymentSchema], default: [] },
}, { timestamps: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
