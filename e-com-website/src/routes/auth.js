const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const limiter = require('express-rate-limit')({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });
const makeToken = (user) => jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', limiter, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !/^\S+@\S+\.\S+$/.test(email || '') || !password || password.length < 8) {
      return res.status(400).json({ message: 'Enter your name, a valid email, and a password with at least 8 characters.' });
    }
    if (await User.exists({ email: email.toLowerCase().trim() })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: makeToken(user), user: { name: user.name, email: user.email } });
  } catch (error) { next(error); }
});

router.post('/login', limiter, async (req, res, next) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) return res.status(401).json({ message: 'Email or password is incorrect.' });
    res.json({ token: makeToken(user), user: { name: user.name, email: user.email } });
  } catch (error) { next(error); }
});
module.exports = router;
