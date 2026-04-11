// header.js -- injects shared header + footer, initializes nav behavior
document.addEventListener('DOMContentLoaded', () => {

  // --- HEADER ---
  const headerEl = document.getElementById('site-header');
  if (headerEl) {
    headerEl.classList.remove('bg-white/70', 'backdrop-blur-md');
    headerEl.classList.add('bg-white');
    headerEl.innerHTML = `
      <div class="px-8 py-2">
        <div class="flex items-center justify-between">
          <a href="index.html" class="flex items-center">
            <img src="assets/3a774a1b3058523e9f5d0495ad6d5e47ad4be5da.jpg" alt="Voldt" class="h-4" />
          </a>
          <div class="flex items-center gap-4">
            <button id="menu-btn" class="p-2 hover:bg-stone-50 rounded transition-colors" aria-label="Menu">
              <span id="menu-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </span>
            </button>
            <a href="cart.html" class="p-2 hover:bg-stone-50 rounded transition-colors relative" aria-label="Cart">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <span id="cart-count" class="absolute -top-1 -right-1 bg-stone-900 text-white text-[10px] w-4 h-4 rounded-full items-center justify-center hidden">0</span>
            </a>
          </div>
        </div>
      </div>
      <div id="nav-dropdown" class="bg-white border-t border-stone-200" style="display:none">
        <nav class="divide-y divide-yellow-600/10">
          <a href="shop-all.html" class="block w-full py-4 text-center text-xs tracking-[0.15em] uppercase text-stone-900 hover:bg-stone-50 font-medium">Shop All</a>
          <div>
            <button id="collections-btn" class="w-full flex items-center justify-center py-4 text-xs tracking-[0.15em] uppercase text-stone-900 hover:bg-stone-50 font-medium">
              <span class="flex items-center gap-2"><a href="collections.html" id="collections-link" class="text-stone-900 hover:text-stone-600">Collections</a>
                <svg id="collections-chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition:transform .2s"><polyline points="6 9 12 15 18 9"/></svg>
              </span>
            </button>
            <div id="collections-menu" class="bg-stone-50 border-t border-yellow-600/10" style="display:none">
              <a href="polyframes.html" class="block w-full py-3 text-center text-xs text-stone-700 hover:text-stone-900 hover:bg-stone-50 border-b border-yellow-600/10">PolyFrames</a>
              <a href="detroit-lights.html" class="block w-full py-3 text-center text-xs text-stone-700 hover:text-stone-900 hover:bg-stone-50 border-b border-yellow-600/10">Detroit Lights</a>
              <a href="voldt-hardware.html" class="block w-full py-3 text-center text-xs text-stone-700 hover:text-stone-900 hover:bg-stone-50">VOLDT Hardware</a>
            </div>
          </div>
          <a href="trade.html" class="block w-full py-4 text-center text-xs tracking-[0.15em] uppercase text-stone-900 hover:bg-stone-50 font-medium">Studio & Trade</a>
          <div>
            <button id="info-btn" class="w-full flex items-center justify-center py-4 text-xs tracking-[0.15em] uppercase text-stone-900 hover:bg-stone-50 font-medium">
              <span class="flex items-center gap-2"><a href="about.html" id="info-link" class="text-stone-900 hover:text-stone-600">Info</a>
                <svg id="info-chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition:transform .2s"><polyline points="6 9 12 15 18 9"/></svg>
              </span>
            </button>
            <div id="info-menu" class="bg-stone-50 border-t border-yellow-600/10" style="display:none">
              <a href="about.html" class="block w-full py-3 text-center text-xs text-stone-700 hover:text-stone-900 hover:bg-stone-50 border-b border-yellow-600/10">About</a>
              <a href="faq.html" class="block w-full py-3 text-center text-xs text-stone-700 hover:text-stone-900 hover:bg-stone-50 border-b border-yellow-600/10">FAQ</a>
              <a href="shipping-returns.html" class="block w-full py-3 text-center text-xs text-stone-700 hover:text-stone-900 hover:bg-stone-50 border-b border-yellow-600/10">Shipping</a>
              <a href="contact.html" class="block w-full py-3 text-center text-xs text-stone-700 hover:text-stone-900 hover:bg-stone-50">Contact Us</a>
            </div>
          </div>
        </nav>
      </div>
    `;

    // --- NAV BEHAVIOR (runs after inject) ---
    const menuBtn = document.getElementById('menu-btn');
    const menuIcon = document.getElementById('menu-icon');
    const navDropdown = document.getElementById('nav-dropdown');
    const collectionsBtn = document.getElementById('collections-btn');
    const collectionsLink = document.getElementById('collections-link');
    const collectionsMenu = document.getElementById('collections-menu');
    const collectionsChevron = document.getElementById('collections-chevron');
    const infoBtn = document.getElementById('info-btn');
    const infoLink = document.getElementById('info-link');
    const infoMenu = document.getElementById('info-menu');
    const infoChevron = document.getElementById('info-chevron');

    const MENU_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
    const CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

    let menuOpen = false, collectionsOpen = false, infoOpen = false;

    function closeAll() {
      menuOpen = false; collectionsOpen = false; infoOpen = false;
      navDropdown.style.display = 'none';
      collectionsMenu.style.display = 'none';
      infoMenu.style.display = 'none';
      collectionsChevron.style.transform = '';
      infoChevron.style.transform = '';
      menuIcon.innerHTML = MENU_ICON;
    }

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menuOpen = !menuOpen;
      navDropdown.style.display = menuOpen ? 'block' : 'none';
      menuIcon.innerHTML = menuOpen ? CLOSE_ICON : MENU_ICON;
      if (!menuOpen) { collectionsOpen=false; infoOpen=false; collectionsMenu.style.display='none'; infoMenu.style.display='none'; }
    });

    collectionsBtn.addEventListener('click', () => {
      collectionsOpen = !collectionsOpen;
      collectionsMenu.style.display = collectionsOpen ? 'block' : 'none';
      collectionsChevron.style.transform = collectionsOpen ? 'rotate(180deg)' : '';
    });

    collectionsLink.addEventListener('click', (e) => { e.stopPropagation(); closeAll(); });

    infoBtn.addEventListener('click', () => {
      infoOpen = !infoOpen;
      infoMenu.style.display = infoOpen ? 'block' : 'none';
      infoChevron.style.transform = infoOpen ? 'rotate(180deg)' : '';
    });

    infoLink.addEventListener('click', (e) => { e.stopPropagation(); closeAll(); });

    document.querySelectorAll('#nav-dropdown a').forEach(link => link.addEventListener('click', closeAll));

    // Click anywhere outside the header to close the menu
    document.addEventListener('click', (e) => {
      if (menuOpen && !headerEl.contains(e.target)) closeAll();
    });

    // --- SCROLL SHADOW ---
    window.addEventListener('scroll', () => {
      if (window.scrollY > 4) {
        headerEl.classList.add('shadow-sm');
      } else {
        headerEl.classList.remove('shadow-sm');
      }
    }, { passive: true });
  }

  // --- FOOTER ---
  const footerEl = document.getElementById('site-footer');
  if (footerEl) {
    footerEl.innerHTML = `
      <div class="max-w-[1800px] mx-auto px-12 lg:px-20 py-24">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-20">
          <div><div class="text-[11px] tracking-[0.3em] uppercase mb-6 text-stone-900 font-medium">VOLDT</div><p class="text-sm text-stone-500 leading-relaxed">Computational design and fabrication for contemporary interiors.</p></div>
          <div><h3 class="text-[10px] tracking-[0.3em] uppercase mb-6 text-stone-400">Products</h3><ul class="space-y-4"><li><a href="voldt-hardware.html" class="text-sm text-stone-600 hover:text-stone-900 transition-colors">VOLDT Hardware</a></li><li><a href="polyframes.html" class="text-sm text-stone-600 hover:text-stone-900 transition-colors">PolyFrames</a></li><li><a href="detroit-lights.html" class="text-sm text-stone-600 hover:text-stone-900 transition-colors">Detroit Lights</a></li></ul></div>
          <div><h3 class="text-[10px] tracking-[0.3em] uppercase mb-6 text-stone-400">Studio</h3><ul class="space-y-4"><li><a href="about.html" class="text-sm text-stone-600 hover:text-stone-900 transition-colors">About</a></li><li><a href="trade.html" class="text-sm text-stone-600 hover:text-stone-900 transition-colors">Studio & Trade</a></li><li><a href="faq.html" class="text-sm text-stone-600 hover:text-stone-900 transition-colors">FAQ</a></li></ul></div>
          <div><h3 class="text-[10px] tracking-[0.3em] uppercase mb-6 text-stone-400">Contact</h3><p class="text-sm text-stone-600 leading-relaxed">Detroit, Michigan<br />US-Based Design & Manufacturing<br /><a href="mailto:info@voldtlab.com" class="hover:text-stone-900 transition-colors">info@voldtlab.com</a></p></div>
        </div>
        <div class="mt-24 pt-8 border-t border-stone-200 text-xs text-stone-400 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; ${new Date().getFullYear()} VOLDT LAB LLC. All rights reserved.</p>
          <p>US-Based Design and Manufacturing</p>
        </div>
      </div>
    `;
  }

  // Hide cart on opted-out pages, but only when cart is empty
  if (document.body.hasAttribute('data-hide-cart')) {
    const cartEmpty = typeof getCount === 'function' ? getCount() === 0 : true;
    if (cartEmpty) {
      const cartLink = headerEl ? headerEl.querySelector('a[href="cart.html"]') : null;
      if (cartLink) cartLink.style.display = 'none';
    }
  }

  // Update cart badge
  if (typeof updateCartBadge === 'function') updateCartBadge();
});
