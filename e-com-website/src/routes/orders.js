const router = require('express').Router();
const mongoose = require('mongoose');
const requireAuth = require('../middleware/auth');
const Product = require('../models/Product');
const Order = require('../models/Order');

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { items, shipping } = req.body;
    if (!Array.isArray(items) || items.length < 1 || items.length > 30) return res.status(400).json({ message: 'Your cart is empty or too large.' });
    if (!shipping?.name?.trim() || !/^\S+@\S+\.\S+$/.test(shipping.email || '') || !shipping.address?.trim() || !shipping.city?.trim() || !shipping.postalCode?.trim()) {
      return res.status(400).json({ message: 'Please complete all shipping details.' });
    }
    const quantities = new Map();
    for (const item of items) {
      if (!mongoose.isValidObjectId(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 50) return res.status(400).json({ message: 'One or more cart items are invalid.' });
      quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
    }
    const products = await Product.find({ _id: { $in: [...quantities.keys()] } });
    if (products.length !== quantities.size) return res.status(400).json({ message: 'A product in your cart is no longer available.' });
    for (const product of products) if (product.stock < quantities.get(String(product._id))) return res.status(409).json({ message: `${product.name} does not have enough stock.` });
    const orderItems = products.map((product) => ({ product: product._id, name: product.name, price: product.price, quantity: quantities.get(String(product._id)) }));
    const total = Number(orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));
    for (const product of products) { product.stock -= quantities.get(String(product._id)); await product.save(); }
    const order = await Order.create({ user: req.user.id, items: orderItems, total, shipping: {
      name: shipping.name.trim().slice(0, 100), email: shipping.email.trim().toLowerCase(), address: shipping.address.trim().slice(0, 200),
      city: shipping.city.trim().slice(0, 100), postalCode: shipping.postalCode.trim().slice(0, 20)
    } });
    res.status(201).json({ message: 'Your order has been placed!', order });
  } catch (error) { next(error); }
});
router.get('/mine', requireAuth, async (req, res, next) => {
  try { res.json(await Order.find({ user: req.user.id }).sort({ createdAt: -1 })); }
  catch (error) { next(error); }
});
module.exports = router;
