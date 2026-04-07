# VOLDT lp26 -- Project Reference

## Stack
- Vanilla HTML/CSS/JS -- no build step, no framework
- Tailwind CSS via CDN (`<script src="https://cdn.tailwindcss.com">`)
- Font: Inter (extended in tailwind.config)
- Global styles: `css/styles.css`

## File Map

### Pages
| File | Purpose |
|------|---------|
| `index.html` | Home -- hero slideshow + product grid (JS-rendered) |
| `collections.html` | Products overview -- 3 series with images |
| `shop-all.html` | Shop All -- full product listing |
| `voldt-hardware.html` | VOLDT Hardware collection page + configurator link |
| `polyframes.html` | PolyFrames collection overview |
| `polyframes-floor-lamp.html` | Product detail |
| `polyframes-table-lamp.html` | Product detail |
| `polyframes-coat-rack.html` | Product detail |
| `polyframes-coffee-table.html` | Product detail |
| `detroit-lights.html` | Detroit Lights collection overview |
| `detroit-pendant.html` | Detroit Pendant -- ?style=A or ?style=B |
| `detroit-table-lamp.html` | Detroit Table Lamp -- ?style=A or ?style=B |
| `trade.html` | Studio & Trade -- trade program / inquiry |
| `cart.html` | Cart page -- wired to Shopify checkout via `js/shopify.js` |
| `about.html` | About |
| `faq.html` | FAQ |
| `shipping-returns.html` | Shipping & Returns |
| `contact.html` | Contact / Inquiries |

### JS
| File | Purpose |
|------|---------|
| `js/cart.js` | Cart state in localStorage -- `addItem`, `removeItem`, `updateQty`, `clearCart`, `getCart`, `getTotal`, `getCount`, `updateCartBadge` |
| `js/shopify.js` | Shopify Storefront API integration -- `createShopifyCheckout()` maps cart items to variant GIDs, calls `cartCreate` mutation, redirects to `checkoutUrl` |
| `js/header.js` | Injects shared header + footer HTML into `#site-header` / `#site-footer`; wires nav dropdown + scroll shadow |

### Configurator (iframe embed at `configurator/`)
| File | Purpose |
|------|---------|
| `configurator/index.html` | 3D hardware configurator UI |
| `configurator/main.js` | UI wiring -- product/variant selects, length + hole spacing + twist + density sliders, density segmented toggle |
| `configurator/viewer.js` | Three.js GLB viewer -- `loadModel()` for single GLB, `loadComposite()` for handle + stems |
| `configurator/styles.css` | Configurator-specific styles (dark theme) |

**Configurator GLB structure:**

Handle GLBs (grip only, no stems -- being re-exported progressively from Rhino):
- `configurator/mechanic/{voronoi,gyroid}/len{0-5}_dens{0-2}.glb` [warning] len5 files still present (should be deleted)
- `configurator/lake_shore/simple/len{0-5}_tw{0-2}.glb` [warning] len5 files still present (should be deleted)
- `configurator/lake_shore/free_form/ff{0-4}.glb`
- `configurator/heat_wave/chrystal/len{0-4}_dens{0-2}.glb` [warning] old `rad*_tw*.glb` files also present (should be deleted)
- `configurator/heat_wave/bulb/len{0-4}_dens{0-2}.glb`


Shared stem GLB (one mounting stem, screw hole center at world origin):
- `configurator/stem.glb`

**Composite loading (`loadComposite` in viewer.js):**
Loads handle GLB + `stem.glb` in parallel. Auto-detects the handle's longest bounding-box axis, then clones the stem twice and offsets each copy by +/-(spacingMeters/2) along that axis. The far clone is mirrored so both posts face outward.

**Hole spacing values (in `main.js`):**
```js
SPACING_LABELS = ['3-3/4"', '5"', '6-5/16"', '7-9/16"', '10-1/16"']
SPACING_METERS = [0.09525, 0.127, 0.160338, 0.192088, 0.255588]
```

**GLB re-export status:** Only `mechanic/gyroid/len2_dens1.glb` has been re-exported without stems. All other handle GLBs still have baked-in stems and will look wrong until re-exported from Rhino.

## Shared Layout Pattern
Every page:
```html
<header id="site-header" class="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md"></header>
<div class="pt-16"> ... content ... </div>
<footer id="site-footer" class="border-t border-stone-200 bg-white"></footer>
<script src="js/cart.js"></script>
<script src="js/header.js"></script>
```
`header.js` injects all nav/footer HTML -- never edit nav links directly in pages.

Cart page also includes `<script src="js/shopify.js"></script>` between cart.js and header.js.

## Design System

### Typography / Color Rules
- Max content width: `max-w-[1600px]` (most pages) or `max-w-[1800px]` (custom-work)
- Horizontal padding: `px-8 lg:px-16` (most) or `px-12 lg:px-20` (custom-work)
- **Grey on white**: use stone-400-600 range
- **Grey on dark (stone-900) backgrounds**: use stone-100-400 range
  - Headings: `text-white` / Subtitle: `text-stone-200` / Body: `text-stone-400`
  - List items: `text-stone-300` / Bold product names: `text-stone-100`
  - Section eyebrow labels: `text-stone-400` / Decorative dashes: `text-stone-600`
- Buttons (dark bg cards): `border border-white text-white hover:bg-white hover:text-stone-900`

### Cart Item Shape
```js
{ id, name, price, qty, image, options: { key: value } }
```

## Shopify Integration

- **Store**: `voldt-2.myshopify.com`
- **Storefront API token** (public, safe client-side): `6f7494dd98f3629db5b1132b90087320`
- **Setup**: Headless -- custom frontend + Shopify checkout only. Theme redirects storefront pages to `voldt.design` via `theme.liquid`; checkout URLs are unaffected.
- **Cart notes**: Detroit lamp color (Black/Blue/Berry/Mint) is passed as a cart note via `buildNote()` -- not a Shopify variant.
- **Custom work**: Handled via Shopify Draft Orders in Admin GUI -- no API needed.

### Variant ID Map (in `js/shopify.js`)
| Cart ID | Product |
|---------|---------|
| `polyframes-coat-rack` | PolyFrame Coat Rack |
| `polyframes-table-lamp-a` / `-b` | PolyFrame Table Lamp Style A/B |
| `polyframes-floor-lamp-a` / `-b` | PolyFrame Floor Lamp Style A/B |
| `polyframes-coffee-table` | PolyFrame Coffee Table |
| `detroit-pendant-a-standard` / `-large` | Detroit Pendant Style A, Standard/Large |
| `detroit-pendant-b-standard` / `-large` | Detroit Pendant Style B, Standard/Large |
| `detroit-table-lamp-a-standard` / `-large` | Detroit Table Lamp Style A, Standard/Large |
| `detroit-table-lamp-b-standard` / `-large` | Detroit Table Lamp Style B, Standard/Large |
| `voldt-hardware-0` … `voldt-hardware-4` | VOLDT Hardware by length index ($49–$89); full config as cart note |
| `voldt-hardware-knob` | VOLDT Hardware Lake Shore Free Form ($49); form factor as cart note |

## To-Dos

### Configurator
- [x] **Re-export all handle GLBs** from Rhino without stems (only `mechanic/gyroid/len2_dens1.glb` done so far)
- [x] **Export Heat Wave Chrystal GLBs** -- `heat_wave/chrystal/len{0-4}_dens{0-2}.glb` (old `rad*_tw*` knob files still in folder, need replacing)
- [x] **Export Heat Wave Bulb GLBs** -- create `heat_wave/bulb/` folder and export `len{0-4}_dens{0-2}.glb`
- [ ] **Delete old knob files** from `heat_wave/chrystal/` (`rad*_tw*.glb` are leftover and won't load)
- [ ] Add **screw size selector** to `configurator/main.js` + UI in `configurator/index.html`
- [ ] Add **mounting style selector** -- `resolveStemUrl()` in `main.js` already has a hook for per-style stems; add UI and additional stem GLBs
- [ ] **Delete len5 GLBs** -- `mechanic/gyroid/`, `mechanic/voronoi/`, and `lake_shore/simple/` still have `len5_*` files on disk; slider max is already capped at 4 in `main.js`
- [x] ~~Eliminate About Us button~~ -- replaced with info icon + viewer disclaimer modal

### Shopify
- [x] Add Shopify products + variant IDs for VOLDT Hardware (configurator)
- [x] Wire configurator state -> cart item IDs -> variant GIDs


## Forms

Both forms use **Netlify Forms** (Formspree removed). AJAX mode: POST to `'/'` with `Content-Type: application/x-www-form-urlencoded`, body via `URLSearchParams(new FormData(form))`. Form replaced with inline success message on submit. Email notifications configured in Netlify dashboard.

| Page | Netlify form name |
|------|------------------|
| `contact.html` | `contact` |
| `trade.html` | `trade-inquiry` |

## Hosting

Site is hosted on **Netlify**, deploying from the `netlify` branch of the GitHub repo (repo is public). No build step — publish directory is `/`. Shopify is still active (not yet cut over).

See `MIGRATION.md` for the full migration plan. **Current status: Phase 1 and Phase 2 complete. Phase 3 (Stripe checkout) is next.**
