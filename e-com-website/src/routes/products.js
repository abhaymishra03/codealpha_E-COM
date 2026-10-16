const router = require('express').Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category && req.query.category !== 'All') filter.category = req.query.category;
    if (req.query.search) filter.name = { $regex: req.query.search.slice(0, 60), $options: 'i' };
    res.json(await Product.find(filter).sort({ createdAt: -1 }));
  } catch (error) { next(error); }
});
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid product ID.' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json(product);
  } catch (error) { next(error); }
});
module.exports = router;
