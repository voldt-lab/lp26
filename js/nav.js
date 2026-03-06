// nav.js — header navigation behavior
document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menu-btn');
  const menuIcon = document.getElementById('menu-icon');
  const navDropdown = document.getElementById('nav-dropdown');
  const collectionsBtn = document.getElementById('collections-btn');
  const collectionsMenu = document.getElementById('collections-menu');
  const collectionsChevron = document.getElementById('collections-chevron');
  const infoBtn = document.getElementById('info-btn');
  const infoMenu = document.getElementById('info-menu');
  const infoChevron = document.getElementById('info-chevron');

  let menuOpen = false;
  let collectionsOpen = false;
  let infoOpen = false;

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      menuOpen = !menuOpen;
      navDropdown.style.display = menuOpen ? 'block' : 'none';
      menuIcon.innerHTML = menuOpen
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
      if (!menuOpen) {
        collectionsOpen = false;
        infoOpen = false;
        if (collectionsMenu) collectionsMenu.style.display = 'none';
        if (infoMenu) infoMenu.style.display = 'none';
      }
    });
  }

  if (collectionsBtn) {
    collectionsBtn.addEventListener('click', () => {
      collectionsOpen = !collectionsOpen;
      collectionsMenu.style.display = collectionsOpen ? 'block' : 'none';
      collectionsChevron.style.transform = collectionsOpen ? 'rotate(180deg)' : '';
    });
  }

  if (infoBtn) {
    infoBtn.addEventListener('click', () => {
      infoOpen = !infoOpen;
      infoMenu.style.display = infoOpen ? 'block' : 'none';
      infoChevron.style.transform = infoOpen ? 'rotate(180deg)' : '';
    });
  }

  // Close nav on nav link click
  document.querySelectorAll('#nav-dropdown a').forEach(link => {
    link.addEventListener('click', () => {
      menuOpen = false;
      collectionsOpen = false;
      infoOpen = false;
      navDropdown.style.display = 'none';
      if (collectionsMenu) collectionsMenu.style.display = 'none';
      if (infoMenu) infoMenu.style.display = 'none';
      menuIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
    });
  });
});
