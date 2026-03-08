# VOLDT lp26 — Project Reference

## Stack
- Vanilla HTML/CSS/JS — no build step, no framework
- Tailwind CSS via CDN (`<script src="https://cdn.tailwindcss.com">`)
- Font: Inter (extended in tailwind.config)
- Global styles: `css/styles.css`

## File Map

### Pages
| File | Purpose |
|------|---------|
| `index.html` | Home — hero slideshow + product grid (JS-rendered) |
| `products.html` | Products overview — 3 series with images |
| `voldt-hardware.html` | VOLDT Hardware collection page |
| `hardware-configurator.html` | Wrapper that embeds `configurator/index.html` via iframe |
| `polyframes.html` | PolyFrames collection overview |
| `polyframes-floor-lamp.html` | Product detail |
| `polyframes-table-lamp.html` | Product detail |
| `polyframes-coat-rack.html` | Product detail |
| `polyframes-coffee-table.html` | Product detail |
| `detroit-lights.html` | Detroit Lights collection overview |
| `detroit-pendant.html` | Detroit Pendant — ?style=A or ?style=B |
| `detroit-table-lamp.html` | Detroit Table Lamp — ?style=A or ?style=B |
| `custom-work.html` | Custom Projects page — Reconfigure + Bespoke inquiry |
| `cart.html` | Cart page |
| `about.html` | About |
| `faq.html` | FAQ |
| `shipping-returns.html` | Shipping & Returns |
| `contact.html` | Contact / Inquiries |

### JS
| File | Purpose |
|------|---------|
| `js/cart.js` | Cart state in localStorage — `addItem`, `removeItem`, `updateQty`, `clearCart`, `getCart`, `getTotal`, `getCount`, `updateCartBadge` |
| `js/header.js` | Injects shared header + footer HTML into `#site-header` / `#site-footer`; wires nav dropdown + scroll shadow |
| `js/nav.js` | Older standalone nav script — superseded by header.js; may still be referenced in some pages |

### Configurator (iframe embed at `configurator/`)
| File | Purpose |
|------|---------|
| `configurator/index.html` | 3D hardware configurator UI |
| `configurator/main.js` | UI wiring — product/variant selects, sliders with smooth drag, density toggle |
| `configurator/viewer.js` | Three.js GLB viewer |
| `configurator/styles.css` | Configurator-specific styles (dark theme) |

**Configurator GLB structure:**
- `configurator/mechanic/{voronoi,gyroid}/len{0-5}_dens{0-2}.glb`
- `configurator/lake_shore/simple/len{0-5}_tw{0-2}.glb`
- `configurator/lake_shore/free_form/ff{0-4}.glb`
- `configurator/venturi/knob/rad{0-2}_tw{0-2}.glb`

## Shared Layout Pattern
Every page:
```html
<header id="site-header" class="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md"></header>
<div class="pt-16"> ... content ... </div>
<footer id="site-footer" class="border-t border-stone-200 bg-white"></footer>
<script src="js/cart.js"></script>
<script src="js/header.js"></script>
```
header.js injects all nav/footer HTML — never edit nav links directly in pages.

## Design System

### Typography / Color Rules
- Max content width: `max-w-[1600px]` (most pages) or `max-w-[1800px]` (custom-work)
- Horizontal padding: `px-8 lg:px-16` (most) or `px-12 lg:px-20` (custom-work)
- **Grey on white**: use stone-400–600 range (darker = more legible)
- **Grey on dark (stone-900) backgrounds**: use stone-100–400 range (brighter needed)
  - Headings: `text-white`
  - Subtitle/tagline: `text-stone-200`
  - Body paragraphs: `text-stone-400`
  - List items: `text-stone-300`
  - Bold product names in lists: `text-stone-100`
  - Section eyebrow labels: `text-stone-400`
  - Decorative dashes (—): `text-stone-600` (intentionally dim)
- Buttons (dark bg cards): `border border-white text-white hover:bg-white hover:text-stone-900`

### Cart Item Shape
```js
{ id, name, price, qty, image, options: { key: value } }
```

## Pending Work (Shopify Integration)
- **Status**: Cart is localStorage-only; `handleCheckout()` shows an alert stub
- **To do**:
  1. Write `js/shopify.js` — `shopifyFetch`, `createCart`, `addToCart`, `getCheckoutUrl`
  2. Wire into `cart.js` to replace the checkout stub
  3. Build variant ID lookup table mapping configurator state → Shopify variant IDs
  4. Add Shopify products for: Detroit Lights, PolyFrame Floor/Table Lamp, Coffee Table, VOLDT Hardware
  5. PolyFrame Coat Stand: add variant options in Shopify (currently "Default Title" only)
