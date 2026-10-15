const API = '/api';
const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
let products = [];
let activeCategory = 'All';
const sessionStorageFallback = new Map();
function readStorage(key) {
  try { return window.localStorage.getItem(key); }
  catch (_error) { return sessionStorageFallback.get(key) ?? null; }
}
function writeStorage(key, value) {
  try { window.localStorage.setItem(key, value); }
  catch (_error) { sessionStorageFallback.set(key, value); }
}
function removeStorage(key) {
  try { window.localStorage.removeItem(key); }
  catch (_error) { sessionStorageFallback.delete(key); }
}
let cart = [];
try { cart = JSON.parse(readStorage('shoplocal-cart') || '[]'); } catch (_error) { cart = []; }
let toastTimer;

const $ = (selector, root = document) => root.querySelector(selector);
const toast = (message) => {
  const el = $('#toast'); if (!el) return;
  el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
};
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const token = () => readStorage('shoplocal-token');
const saveCart = () => { writeStorage('shoplocal-cart', JSON.stringify(cart)); renderCart(); };
const cartQty = () => cart.reduce((total, item) => total + item.quantity, 0);

async function api(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  const response = await fetch(`${API}${url}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Please try again.');
  return data;
}

function productCard(product) {
  return `<article class="product-card"><a href="/product.html?id=${encodeURIComponent(product._id)}" class="product-image-wrap"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">${product.badge ? `<span class="product-badge">${escapeHtml(product.badge)}</span>` : ''}<button class="quick-add" type="button" data-add="${escapeHtml(product._id)}" aria-label="Add ${escapeHtml(product.name)} to bag">+</button></a><div class="product-info"><div class="product-meta"><a class="product-name" href="/product.html?id=${encodeURIComponent(product._id)}">${escapeHtml(product.name)}</a><span class="product-price">${money(product.price)}</span></div><p class="product-category">${escapeHtml(product.category.toUpperCase())}</p></div></article>`;
}

function renderProducts() {
  const grid = $('#product-grid'); if (!grid) return;
  const query = ($('#product-search')?.value || '').toLowerCase().trim();
  const shown = products.filter((p) => (activeCategory === 'All' || p.category === activeCategory) && (!query || `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(query)));
  grid.innerHTML = shown.length ? shown.map(productCard).join('') : '<div class="empty-state">Nothing here just yet. Try another search.</div>';
}

function addToCart(id) {
  const product = products.find((p) => p._id === id);
  if (!product) return;
  const existing = cart.find((item) => item.productId === id);
  if (existing) existing.quantity = Math.min(50, existing.quantity + 1);
  else cart.push({ productId: id, name: product.name, price: product.price, image: product.image, quantity: 1 });
  saveCart(); toast(`${product.name} added to your bag.`);
}

function renderCart() {
  const count = $('#cart-count'); if (count) count.textContent = cartQty();
  const drawerCount = $('#drawer-count'); if (drawerCount) drawerCount.textContent = `(${cartQty()})`;
  const items = $('#cart-items'); if (!items) return;
  if (!cart.length) items.innerHTML = '<div class="cart-empty">Your bag is ready for something good.</div>';
  else items.innerHTML = cart.map((item) => `<div class="cart-line"><img src="${escapeHtml(item.image)}" alt=""><div><h3>${escapeHtml(item.name)}</h3><p>${money(item.price)}</p><div class="quantity-controls"><button data-quantity="${escapeHtml(item.productId)}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-quantity="${escapeHtml(item.productId)}" data-delta="1" aria-label="Increase quantity">+</button><button class="remove-item" data-remove="${escapeHtml(item.productId)}">Remove</button></div></div><span class="cart-line-price">${money(item.price * item.quantity)}</span></div>`).join('');
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if ($('#cart-subtotal')) $('#cart-subtotal').textContent = money(total);
  if ($('#shipping-note')) $('#shipping-note').textContent = total >= 75 ? 'Lovely — shipping is on us.' : `You're ${money(75 - total)} away from free shipping.`;
  const checkout = $('#checkout-button'); if (checkout) checkout.disabled = !cart.length;
}

function openCart() { $('#overlay')?.classList.add('open'); $('#overlay')?.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
function closeCart() { $('#overlay')?.classList.remove('open'); $('#overlay')?.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }

function updateAccountButton() {
  const button = $('#account-button'); if (!button) return;
  let user = null;
  try { user = JSON.parse(readStorage('shoplocal-user') || 'null'); } catch (_error) { user = null; }
  button.textContent = user ? `Hi, ${user.name.split(' ')[0]}` : 'Sign in';
  button.title = user ? 'Click to sign out' : 'Sign in or create an account';
}

function setAuthMode(register) {
  const dialog = $('#auth-dialog'); if (!dialog) return;
  $('#auth-title').textContent = register ? 'Come on in.' : 'Good to see you.';
  $('#auth-subtitle').textContent = register ? 'Create your ShopLocal account.' : 'Sign in to pick up where you left off.';
  $('#auth-submit').innerHTML = register ? 'Create account <span>→</span>' : 'Sign in <span>→</span>';
  $('#name-field').classList.toggle('hidden', !register);
  $('#name-field input').required = register;
  $('#auth-form').dataset.mode = register ? 'register' : 'login';
  $('#auth-switch').innerHTML = register ? 'Already have an account? <button type="button">Sign in</button>' : 'New around here? <button type="button">Create an account</button>';
}

async function loadCatalog() {
  try {
    products = await api('/products');
    renderProducts(); renderCart();
    if ($('#product-detail')) loadProductDetail();
  } catch (error) {
    const grid = $('#product-grid'); if (grid) grid.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}<br><small>Start MongoDB, then run <code>npm run seed</code>.</small></div>`;
    const detail = $('#product-detail'); if (detail) detail.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

async function loadProductDetail() {
  const root = $('#product-detail');
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { root.innerHTML = '<div class="empty-state">Choose a product from the collection to see its details.</div>'; return; }
  try {
    const product = await api(`/products/${encodeURIComponent(id)}`);
    document.title = `${product.name} — ShopLocal`;
    root.innerHTML = `<div class="detail-image"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">${product.badge ? `<span class="product-badge">${escapeHtml(product.badge)}</span>` : ''}</div><div class="detail-copy"><p class="eyebrow">${escapeHtml(product.category.toUpperCase())} · THOUGHTFULLY CHOSEN</p><h1>${escapeHtml(product.name)}</h1><p class="detail-price">${money(product.price)}</p><p class="detail-description">${escapeHtml(product.description)}</p><p class="detail-stock">${product.stock > 0 ? '✳ In stock, ready to come home' : 'Currently out of stock'}</p><button class="button button-dark detail-add" data-add="${escapeHtml(product._id)}" ${product.stock < 1 ? 'disabled' : ''}>Add to your bag <span>→</span></button></div>`;
    const related = products.filter((p) => p._id !== product._id).slice(0, 4);
    const relatedGrid = $('#related-grid'); if (relatedGrid) relatedGrid.innerHTML = related.map(productCard).join('');
  } catch (error) { root.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}<br><a href="/#shop">Back to the collection →</a></div>`; }
}

document.addEventListener('click', async (event) => {
  const add = event.target.closest('[data-add]');
  if (add) { event.preventDefault(); addToCart(add.dataset.add); return; }
  const quantity = event.target.closest('[data-quantity]');
  if (quantity) {
    const item = cart.find((row) => row.productId === quantity.dataset.quantity);
    if (item) { item.quantity += Number(quantity.dataset.delta); if (item.quantity <= 0) cart = cart.filter((row) => row !== item); saveCart(); }
    return;
  }
  const remove = event.target.closest('[data-remove]');
  if (remove) { cart = cart.filter((item) => item.productId !== remove.dataset.remove); saveCart(); return; }
  if (event.target.closest('#cart-button')) { openCart(); return; }
  if (event.target.closest('#close-cart, #overlay-dismiss')) { closeCart(); return; }
  if (event.target.closest('#account-button')) {
    if (token()) { removeStorage('shoplocal-token'); removeStorage('shoplocal-user'); updateAccountButton(); toast('You have been signed out.'); }
    else { setAuthMode(false); $('#auth-dialog')?.showModal(); }
    return;
  }
  const close = event.target.closest('[data-close]'); if (close) $(`#${close.dataset.close}`)?.close();
  if (event.target.closest('#auth-switch button')) setAuthMode($('#auth-form').dataset.mode !== 'register');
  if (event.target.closest('#checkout-button')) {
    if (!token()) { closeCart(); setAuthMode(false); $('#auth-dialog')?.showModal(); toast('Sign in or create an account to check out.'); return; }
    $('#checkout-total').textContent = money(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
    $('#checkout-dialog')?.showModal();
  }
});

$('#category-list')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]'); if (!button) return;
  activeCategory = button.dataset.category;
  document.querySelectorAll('.category-chip').forEach((chip) => chip.classList.toggle('selected', chip === button));
  renderProducts();
});
$('#product-search')?.addEventListener('input', renderProducts);
$('#auth-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget; const body = Object.fromEntries(new FormData(form));
  try {
    const result = await api(`/auth/${form.dataset.mode}`, { method: 'POST', body: JSON.stringify(body) });
    writeStorage('shoplocal-token', result.token); writeStorage('shoplocal-user', JSON.stringify(result.user));
    updateAccountButton(); $('#auth-dialog').close(); form.reset(); toast(`Welcome${result.user.name ? `, ${result.user.name.split(' ')[0]}` : ' back'}!`);
  } catch (error) { toast(error.message); }
});
$('#checkout-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget; const shipping = Object.fromEntries(new FormData(form));
  const button = form.querySelector('button[type="submit"],button:not([type])'); button.disabled = true;
  try {
    const result = await api('/orders', { method: 'POST', body: JSON.stringify({ shipping, items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })) }) });
    cart = []; saveCart(); form.reset(); $('#checkout-dialog').close(); closeCart(); toast(`${result.message} Order #${result.order._id.slice(-6).toUpperCase()}`);
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; }
});
$('#newsletter-form')?.addEventListener('submit', (event) => { event.preventDefault(); event.currentTarget.reset(); toast('You’re on the list. Keep an eye on your inbox!'); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeCart(); });
if ($('#year')) $('#year').textContent = new Date().getFullYear();
updateAccountButton(); renderCart(); loadCatalog();
