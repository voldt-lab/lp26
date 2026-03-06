// cart.js — shared cart state via localStorage
const CART_KEY = 'voldt-cart';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function addItem(item) {
  const cart = getCart();
  const existing = cart.find(i => i.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  saveCart(cart);
  updateCartBadge();
}

function removeItem(id) {
  saveCart(getCart().filter(i => i.id !== id));
  updateCartBadge();
}

function updateQty(id, qty) {
  if (qty <= 0) { removeItem(id); return; }
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) item.quantity = qty;
  saveCart(cart);
  updateCartBadge();
}

function clearCart() {
  saveCart([]);
  updateCartBadge();
}

function getCount() {
  return getCart().reduce((sum, i) => sum + i.quantity, 0);
}

function getTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (!badge) return;
  const count = getCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

// Run on page load
document.addEventListener('DOMContentLoaded', updateCartBadge);
