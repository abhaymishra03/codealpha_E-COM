const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, name: String, price: Number, quantity: Number }],
  total: { type: Number, required: true },
  shipping: { name: String, email: String, address: String, city: String, postalCode: String },
  status: { type: String, enum: ['placed', 'processing', 'shipped', 'delivered'], default: 'placed' }
}, { timestamps: true });
module.exports = mongoose.model('Order', orderSchema);
