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

function showCartToast(itemName) {
  // Remove any existing toast
  const existing = document.getElementById('cart-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'cart-toast';
  toast.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px;">
      <svg style="flex-shrink:0;margin-top:1px;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      <div style="flex:1;min-width:0;">
        <p style="margin:0 0 2px;font-size:13px;font-weight:500;color:#f5f5f4;">Added to cart</p>
        <p style="margin:0;font-size:12px;color:#a8a29e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${itemName}</p>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0;">
        <button onclick="document.getElementById('cart-toast').remove()" style="background:none;border:none;cursor:pointer;padding:0;color:#78716c;font-size:16px;line-height:1;">&#x2715;</button>
        <a href="cart.html" style="font-size:11px;color:#d6d3d1;text-decoration:none;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid #57534e;">View Cart</a>
      </div>
    </div>
  `;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    right: '20px',
    zIndex: '9999',
    background: '#1c1917',
    border: '1px solid rgba(255,255,255,0.10)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
    padding: '14px 16px',
    width: '390px',
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
    opacity: '0',
    transform: 'translateY(8px)',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
  });
  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // Auto-dismiss after 4s
  const timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 4000);

  // Cancel auto-dismiss on hover
  toast.addEventListener('mouseenter', () => clearTimeout(timer));
}

// Run on page load
document.addEventListener('DOMContentLoaded', updateCartBadge);
