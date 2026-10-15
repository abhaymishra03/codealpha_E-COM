require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

const products = [
  { name: 'Everyday Canvas Tote', category: 'Accessories', price: 28, badge: 'Bestseller', description: 'A sturdy, roomy everyday carryall made from heavyweight recycled cotton canvas.', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=85', stock: 24 },
  { name: 'Ceramic Morning Mug', category: 'Home', price: 22, badge: 'Handmade', description: 'A quietly beautiful stoneware mug with a soft glaze and a comfortable handle.', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85', stock: 18 },
  { name: 'Ribbed Lounge Socks', category: 'Apparel', price: 16, badge: '', description: 'Soft, breathable cotton blend socks for slow mornings and long walks.', image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=900&q=85', stock: 35 },
  { name: 'Pocket Notebook Set', category: 'Stationery', price: 19, badge: 'Set of 3', description: 'Three pocket-sized notebooks with smooth, fountain-pen-friendly pages.', image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=85', stock: 30 },
  { name: 'Minimal Desk Lamp', category: 'Home', price: 74, badge: 'New', description: 'A warm, focused glow in a compact brushed-metal silhouette.', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85', stock: 12 },
  { name: 'Daily Carry Bottle', category: 'Accessories', price: 34, badge: '', description: 'Double-wall insulated stainless steel keeps drinks cold for hours.', image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=85', stock: 22 },
  { name: 'Soft Knit Beanie', category: 'Apparel', price: 32, badge: 'Favorite', description: 'A cozy, easy-fit rib knit beanie for crisp days and cool evenings.', image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=900&q=85', stock: 15 },
  { name: 'Weekly Planner Pad', category: 'Stationery', price: 18, badge: '', description: 'A tear-off weekly planner to keep your plans clear and your desk calm.', image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=85', stock: 28 }
]; 


async function seed() {
  if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI in your .env file first.');
  await mongoose.connect(process.env.MONGODB_URI);
  for (const product of products) await Product.updateOne({ name: product.name }, { $set: product }, { upsert: true });
  console.log(`Seeded ${products.length} products.`);
  await mongoose.disconnect();
}
seed().catch(async (error) => { console.error(error.message); await mongoose.disconnect(); process.exit(1); });
