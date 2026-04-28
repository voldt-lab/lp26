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
| `index.html` | Home -- hero slideshow (time-seeded start image, 5s interval, 600ms fade-in on load) + product grid (JS-rendered) |
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
| `cart.html` | Cart page -- wired to Stripe Checkout via `js/stripe.js` + Netlify Function |
| `about.html` | About |
| `faq.html` | FAQ |
| `shipping-returns.html` | Shipping & Returns |
| `contact.html` | Contact / Inquiries |
| `review.html` | Verified purchase review form -- gated by Stripe Payment Intent ID via `verify-session.js` |

### JS
| File | Purpose |
|------|---------|
| `js/cart.js` | Cart state in localStorage -- `addItem`, `removeItem`, `updateQty`, `clearCart`, `getCart`, `getTotal`, `getCount`, `updateCartBadge` |
| `js/stripe.js` | Stripe Checkout -- `createStripeCheckout(discountCode)` POSTs cart to `/.netlify/functions/create-checkout`, redirects to Stripe hosted checkout page |
| `js/shopify.js` | Shopify Storefront API integration (superseded -- kept until Shopify subscription is cancelled) |
| `js/header.js` | Injects shared header + footer HTML into `#site-header` / `#site-footer`; wires nav dropdown + scroll shadow |

### Netlify Functions
| File | Purpose |
|------|---------|
| `netlify/create-checkout.js` | Creates Stripe Checkout Session server-side. Maps cart IDs → `PRICE_CENTS` (enforced server-side), builds `price_data` line items with full variant name + options string. Passes options as session `metadata.order_notes`. Handles discount code pre-lookup via `stripe.promotionCodes.list`. Selects one of 3 flat shipping rates (Regular / Large / Combo) based on cart composition. **Shipping rate IDs at lines 27–29 — update all 3 when switching test ↔ live.** |
| `netlify/verify-session.js` | Validates a Stripe Payment Intent ID (`pi_...`) for the review form -- checks `status === 'succeeded'` and `metadata.review_submitted` flag. Returns `{ status: 'ok' \| 'already_submitted' \| 'invalid' }`. |
| `netlify/mark-reviewed.js` | Sets `metadata.review_submitted = 'true'` on a PaymentIntent after review submission. Re-verifies before writing; returns 409 if already submitted. Acts as the deduplication gate. |

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

Cart page also includes `<script src="js/stripe.js"></script>` between cart.js and header.js.

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

## Stripe Checkout

- **Approach**: `price_data` inline (not pre-created Stripe Price IDs). Each checkout session passes amount + product name dynamically. Price is enforced server-side in `PRICE_CENTS`; client only sends `item.id`.
- **Variant names**: Built from `item.name` + formatted `item.options` (e.g. "Detroit Pendant Style A — Color: Black, Size: Standard"). Options also stored in `session.metadata.order_notes` for fulfillment reference.
- **Discount codes**: Pre-entered code looked up via `stripe.promotionCodes.list`; falls back to Stripe's built-in promotion code field if lookup fails.
- **Shipping**: 3 flat rates selected server-side in `netlify/create-checkout.js` (lines 27–29). Logic based on item quantities, respecting `item.quantity`:
  - **Regular** — exactly 1 small item, no oversized
  - **Large** — 2 smalls (no oversized), or exactly 1 oversized item alone
  - **Combo** — 3+ smalls, 2+ oversized, or any oversized + any small (mixed order)
  - Oversized items: `polyframes-coat-rack`, `polyframes-floor-lamp-a`, `polyframes-floor-lamp-b`
  - **⚠️ Shipping rate IDs must be updated when switching test ↔ live mode** — recreate all 3 rates in Stripe live mode dashboard (Products → Shipping rates), then paste the new `shr_...` IDs into the three constants at the top of `create-checkout.js`.
- **Tax**: `automatic_tax: { enabled: true }` — activates once Stripe account is verified; no-op until then.
- **Analytics note**: When exporting transactions from Stripe, include the **"Checkout line item summary"** column to get per-product breakdown. Multiple items in one order are lumped into a single transaction row without it.
- **Custom work payments**: Use Stripe Payment Links (dashboard, no code) -- create a one-off link for any amount and send directly to client.
- **Review invitations**: After an order ships, copy the Payment Intent ID (`pi_...`) from Stripe dashboard and email `voldtlab.com/review.html?payment=pi_...` to the customer ~2–4 weeks post-delivery.

### Price Map (in `netlify/create-checkout.js`)
| Cart ID | Price |
|---------|-------|
| `polyframes-coat-rack` | $499 |
| `polyframes-table-lamp-a` / `-b` | $349 |
| `polyframes-floor-lamp-a` / `-b` | $899 |
| `detroit-pendant-a-standard` / `-b-standard` | $99 |
| `detroit-pendant-a-large` / `-b-large` | $229 |
| `detroit-table-lamp-a-standard` / `-b-standard` | $99 |
| `detroit-table-lamp-a-large` / `-b-large` | $229 |
| VOLDT Hardware | deferred -- pricing TBD |

## To-Dos
- [ ] link spec to the download spec sheet button
- [x] add Goose on Trade page
- [ ] swap stripe secret key to live from test, on netlify env variables
- [ ] replace test shipping IDs with live ones — all 3 constants in `netlify/create-checkout.js` lines 27–29 (`SHIPPING_REGULAR`, `SHIPPING_LARGE`, `SHIPPING_COMBO`)

### Analytics (Firebase / reCAPTCHA)
- [ ] **After domain cutover**: test that visit records appear in Firebase Realtime DB (`voldt-fb` → `visits`) from `voldtlab.com`
- [ ] **After cutover confirmed working**: clean up reCAPTCHA domain allowlist -- remove `localhost` and the Netlify preview URL, keep only `voldtlab.com`. Public Key: `6Lc6Pz4rAAAAADVQu-X0eNcV8ioy1o1olVuU-3hi` in Google reCAPTCHA Admin Console.
- [ ] at cutover take note of the last sessionId. this can help distinguish old site visits from new


### Configurator
- [ ] Add **screw size selector** to `configurator/main.js` + UI in `configurator/index.html`


### Stripe / Checkout
- [ ] *(Future)* Add Resend + Stripe webhook to automate invitation emails if volume grows

## Forms

Both forms use **Netlify Forms** (Formspree removed). AJAX mode: POST to `'/'` with `Content-Type: application/x-www-form-urlencoded`, body via `URLSearchParams(new FormData(form))`. Form replaced with inline success message on submit. Email notifications configured in Netlify dashboard.

| Page | Netlify form name |
|------|------------------|
| `contact.html` | `contact` |
| `trade.html` | `trade-inquiry` |

## Hosting

Site is hosted on **Netlify**, deploying from the `netlify` branch of the GitHub repo (repo is public). No build step — publish directory is `/`. Shopify is still active (not yet cut over).

See `MIGRATION.md` for the full migration plan. **Current status: Phases 1–4 complete. Phase 5 code complete (verify-session, mark-reviewed, review.html) — needs one production deploy to register Netlify Form, then end-to-end test on live site. Phase 6 is domain cutover.**

**Local dev:** `npx netlify-cli dev` at `localhost:8888`. Requires `.env` with `STRIPE_SECRET_KEY=sk_test_...`. Functions run fully locally; Netlify Forms simulate a 200 but data doesn't reach the cloud dashboard.
