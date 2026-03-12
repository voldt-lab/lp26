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
| `hardware-config.html` | Wrapper that embeds `configurator/index.html` via iframe |
| `polyframes.html` | PolyFrames collection overview |
| `polyframes-floor-lamp.html` | Product detail |
| `polyframes-table-lamp.html` | Product detail |
| `polyframes-coat-rack.html` | Product detail |
| `polyframes-coffee-table.html` | Product detail |
| `detroit-lights.html` | Detroit Lights collection overview |
| `detroit-pendant.html` | Detroit Pendant — ?style=A or ?style=B |
| `detroit-table-lamp.html` | Detroit Table Lamp — ?style=A or ?style=B |
| `custom-work.html` | Custom Projects page — Reconfigure + Bespoke inquiry |
| `cart.html` | Cart page — wired to Shopify checkout via `js/shopify.js` |
| `about.html` | About |
| `faq.html` | FAQ |
| `shipping-returns.html` | Shipping & Returns |
| `contact.html` | Contact / Inquiries |

### JS
| File | Purpose |
|------|---------|
| `js/cart.js` | Cart state in localStorage — `addItem`, `removeItem`, `updateQty`, `clearCart`, `getCart`, `getTotal`, `getCount`, `updateCartBadge` |
| `js/shopify.js` | Shopify Storefront API integration — `createShopifyCheckout()` maps cart items to variant GIDs, calls `cartCreate` mutation, redirects to `checkoutUrl` |
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

Cart page also includes `<script src="js/shopify.js"></script>` between cart.js and header.js.

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

## Shopify Integration

- **Store**: `voldt-2.myshopify.com`
- **Storefront API token** (public, safe client-side): `6f7494dd98f3629db5b1132b90087320`
- **Setup**: Headless — custom frontend + Shopify checkout only. The Shopify Online Store theme redirects all storefront pages to `voldt.design` via `theme.liquid` meta refresh; checkout URLs (`/checkouts/...`) are unaffected.
- **Checkout flow**: `createShopifyCheckout()` in `js/shopify.js` reads localStorage cart, maps item IDs to Shopify variant GIDs, calls the `cartCreate` GraphQL mutation, and redirects to the returned `checkoutUrl`.
- **Cart notes**: Detroit lamp color (Black/Blue/Berry/Mint) is not a Shopify variant — it's passed as a cart note via `buildNote()` so it's visible in the order.
- **Custom work / bespoke orders**: Handled via Shopify Draft Orders in the Admin GUI — no API needed. Create order manually after agreeing on scope + price, send invoice to customer.

### Variant ID Map (in `js/shopify.js`)
| Cart ID | Product |
|---------|---------|
| `polyframes-coat-rack` | PolyFrame Coat Rack (single variant) |
| `polyframes-table-lamp-a` / `-b` | PolyFrame Table Lamp Style A/B |
| `polyframes-floor-lamp-a` / `-b` | PolyFrame Floor Lamp Style A/B |
| `polyframes-coffee-table` | PolyFrame Coffee Table |
| `detroit-pendant-a-standard` / `-large` | Detroit Pendant Style A, Standard/Large |
| `detroit-pendant-b-standard` / `-large` | Detroit Pendant Style B, Standard/Large |
| `detroit-table-lamp-a-standard` / `-large` | Detroit Table Lamp Style A, Standard/Large |
| `detroit-table-lamp-b-standard` / `-large` | Detroit Table Lamp Style B, Standard/Large |

### Remaining Shopify Work
- Add Shopify products + variant IDs for: VOLDT Hardware (configurator)
- Wire configurator state → cart item IDs → variant GIDs for hardware products

## Configurator To-Dos
- [ ] Add **screw size selector** to `configurator/main.js` + UI in `configurator/index.html`
- [ ] Add **mounting style selector** to `configurator/main.js` + UI in `configurator/index.html`
- [ ] **Cap max length at 11 1/8"** — remove GLB files longer than this from `configurator/mechanic/` and `configurator/lake_shore/`; remove corresponding steps from the length sliders in `configurator/main.js`
- [ ] **Add 3" length option** — add GLB files and insert the 3" step into the length sliders
- [ ] eliminate about us button once embedded

## Site To-Dos
- [ ] Add the retail versions of hardware - flesh out their product cards

## Forms

| Page | Formspree endpoint |
|------|-------------------|
| `contact.html` | `https://formspree.io/f/mnjgjnlb` |
| `custom-work.html` | `https://formspree.io/f/xzdjdndr` |

Both use AJAX mode (`Accept: application/json`) — no page redirect on submit; form is replaced with an inline success message on success.
