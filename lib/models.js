import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const BillSchema = new mongoose.Schema({
  tableNo: { type: Number, required: true },
  billNo: { type: Number, required: true, unique: true },
  timestamp: { type: Date, default: Date.now },
  captain: { type: String, required: true },
  covers: { type: Number, required: true },
  orders: [{
    item: { type: String, required: true },
    qty: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'card', 'upi','guest'], 
    required: true 
  },
  guestName: { type: String, default: '' },
  roomNo: { type: String, default: '' },
  tip: { type: Number, default: 0 },
  netAmount: { type: Number, required: true }
}, { timestamps: true });

const MenuSchema= new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['soups', 'starters', 'tandoori', 'main course', 'beverages', 'desserts'],
    required: true
  },
  type: {
    type: String,
    enum: ['veg', 'nonveg'],
    required: true
  },
  price: { type: Number, required: true },
  description: { type: String }
});

export const Menu = mongoose.models.Menu || mongoose.model('Menu', MenuSchema);
export const Bill = mongoose.models.Bill || mongoose.model('Bill', BillSchema);
export const User = mongoose.models.User || mongoose.model('User', userSchema);