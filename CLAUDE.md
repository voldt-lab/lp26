# VOLDT lp26 -- Project Reference

## Stack
Vanilla HTML/CSS/JS, no build step. Tailwind via CDN. Font: Inter (extended in tailwind.config). Global styles: `css/styles.css`.

## File Map

**Pages** — filenames are self-describing; only the non-obvious noted:
- `index.html` — hero slideshow (time-seeded start image, 5s interval, 600ms fade-in) + JS-rendered product grid
- `detroit-pendant.html`, `detroit-table-lamp.html` — take `?style=A` or `?style=B`
- `review.html` — verified-purchase review form, gated by Stripe Payment Intent ID via `verify-session.js`
- `cart.html` — wired to Stripe Checkout via `js/stripe.js`
- Collection overviews: `collections.html`, `shop-all.html`, `voldt-hardware.html`, `polyframes.html`, `detroit-lights.html`, `trade.html`
- Product detail: `polyframes-{floor-lamp,table-lamp,coat-rack,coffee-table}.html`
- Static: `about.html`, `faq.html`, `shipping-returns.html`, `contact.html`, `404.html`

**JS**
- `js/cart.js` — localStorage cart: `addItem`, `removeItem`, `updateQty`, `clearCart`, `getCart`, `getTotal`, `getCount`, `updateCartBadge`
- `js/stripe.js` — `createStripeCheckout(discountCode)` POSTs cart to `/.netlify/functions/create-checkout`, redirects to hosted checkout
- `js/header.js` — injects header + footer into `#site-header` / `#site-footer`; wires nav dropdown + scroll shadow
- `js/shopify.js` — superseded, safe to delete

**Netlify Functions** (`netlify/`, per `netlify.toml`)
- `create-checkout.js` — builds Checkout Session. Prices enforced server-side in `PRICE_CENTS` (line 5); client sends only `item.id`. Inline `price_data`, not pre-created Price IDs. Options → `metadata.order_notes`. Discount pre-lookup via `stripe.promotionCodes.list`, falls back to Stripe's own promo field. **Shipping rate IDs at lines 26–28.**
- `verify-session.js` — validates `pi_...` for the review form; checks `status === 'succeeded'` + `metadata.review_submitted`. Returns `{ status: 'ok' | 'already_submitted' | 'invalid' }`.
- `mark-reviewed.js` — sets `metadata.review_submitted = 'true'`; re-verifies first, 409 if already submitted. The dedup gate.
- `edge-functions/protect-glb.js` — edge function guarding `/configurator/**`.

## Configurator (iframe embed at `configurator/`)

`index.html` (UI) · `main.js` (wiring) · `viewer.js` (Three.js GLB viewer) · `styles.css` (dark theme)

**Path resolution** — `resolveModelUrl()` in `main.js` is the *only* place filenames are constructed. 4 products, each with an optional `knob` variant:

| Product | Non-knob path | Knob path |
|---|---|---|
| arroyo | `arroyo/{bulb,ridges}/len{L}_dens{D}` | `arroyo/knob/rad{R}_dens{d}` |
| basin | `basin/simple/len{L}_tw{T}` | `basin/knob/rad{R}_dens{d}` |
| cella | `cella/len{L}_dens{D}` (no subdir) | `cella/knob/rad{R}_dens{d}` |
| dune | `dune/len{L}_dens{D}` (no subdir) | `dune/knob/rad{R}_dens{d}` |

Slider ranges: `len` 0–4, `rad` 0–3, `sp` 0–4, `dens` 0–2. Knob density is **remapped** — `KNOB_DENS_MAP = [1, 2, 4]` (`main.js:122`), so knob dirs legitimately contain only `dens1/2/4`; the gaps are not missing files.

Label/spacing arrays live at `main.js:119-125` (`LENGTH_LABELS`, `TWIST_LABELS`, `DIAM_LABELS`, `DENS_LABELS`, `SPACING_LABELS`, `SPACING_METERS`).

**Composite loading** (`loadComposite` in `viewer.js`) — loads handle GLB + `stem.glb` (root, screw-hole center at world origin) in parallel. Auto-detects the handle's longest bounding-box axis, clones the stem twice, offsets each by ±(spacingMeters/2) along it. Far clone is mirrored so both posts face outward. `loadModel()` handles the single-GLB case.

**Unreachable GLBs** (slider can't address them — safe to delete):
- `basin/simple/len5_tw{0,1,2}.glb` and `dune/len5_dens{0,1,2}.glb` — `len` maxes at 4
- `arroyo/knob/rad{0-3}_dens{0,3}.glb` — 8 files; `KNOB_DENS_MAP` never emits 0 or 3

## Shared Layout Pattern
Every page: `<header id="site-header">` (fixed, `bg-white/70 backdrop-blur-md`), content wrapped in `<div class="pt-16">`, `<footer id="site-footer">`, then `js/cart.js` → `js/header.js`. Cart page inserts `js/stripe.js` between them.

`header.js` injects all nav/footer HTML — **never edit nav links directly in pages.**

## Design System
- Max width `max-w-[1600px]` (most) or `max-w-[1800px]` (custom-work); padding `px-8 lg:px-16` / `px-12 lg:px-20`
- **Grey on white:** stone-400–600. **Grey on stone-900:** stone-100–400
  - Headings `text-white` · subtitle `text-stone-200` · body `text-stone-400` · list items `text-stone-300` · bold product names `text-stone-100` · eyebrow labels `text-stone-400` · decorative dashes `text-stone-600`
- Buttons on dark cards: `border border-white text-white hover:bg-white hover:text-stone-900`

Cart item shape: `{ id, name, price, qty, image, options: { key: value } }`

## Stripe Checkout
- **Prices:** `PRICE_CENTS` in `netlify/create-checkout.js:5` is authoritative for what the customer is actually charged. VOLDT Hardware pricing still deferred.
- **⚠️ A price change means editing three places:**
  1. `PRICE_CENTS` in `netlify/create-checkout.js:5` — what Stripe charges (authoritative)
  2. The inline `price:` in the page's `addItem` call — what the cart displays
  3. The `Product` JSON-LD `offers` block in the page `<head>` — what Google/LLMs read
  Miss #2 and the cart shows a different number than the card. Miss #3 and search results advertise a stale price, which can also trigger Google Merchant mismatch warnings. Detroit pages use `AggregateOffer` (`lowPrice`/`highPrice`) rather than a single `price`; the coffee table has no `offers` node at all (commission only).
- **Variant names:** `item.name` + formatted `item.options` (e.g. "Detroit Pendant Style A — Color: Black, Size: Standard").
- **Shipping:** 3 flat rates chosen server-side, respecting `item.quantity`:
  - **Regular** — exactly 1 small, no oversized
  - **Large** — 2 smalls (no oversized), or exactly 1 oversized alone
  - **Combo** — 3+ smalls, 2+ oversized, or any mixed order
  - Oversized: `polyframes-coat-rack`, `polyframes-floor-lamp-a`, `polyframes-floor-lamp-b`
  - **⚠️ Rate IDs must be recreated when switching test ↔ live** — make all 3 in the live dashboard (Products → Shipping rates), paste the `shr_...` IDs into lines 26–28.
- **Tax:** `automatic_tax` enabled.
- **Analytics:** when exporting from Stripe, include the **"Checkout line item summary"** column — without it, multi-item orders collapse into one row with no per-product breakdown.
- **Custom work:** use Stripe Payment Links (dashboard, no code).
- **Review invitations:** after shipping, copy the `pi_...` from the dashboard and email `voldtlab.com/review.html?payment=pi_...` ~2–4 weeks post-delivery.

## Forms
Both use **Netlify Forms** (Formspree removed). AJAX: POST to `'/'` with `application/x-www-form-urlencoded`, body via `URLSearchParams(new FormData(form))`; form replaced with inline success message. Email notifications set in the Netlify dashboard.

`contact.html` → form name `contact` · `trade.html` → `trade-inquiry`

## Hosting
Netlify, deploying the `netlify` branch (repo is public). No build step, publish dir `/`. `voldtlab.com` points to Netlify. Shopify cancelled.

**Local dev:** `netlify dev` at `localhost:8888`. netlify-cli is installed globally, deliberately *not* a project dep (`npm i -g netlify-cli` if missing; avoid `npx netlify-cli dev`). Run `npm install` once for the `stripe` dep. Needs `.env` with `STRIPE_SECRET_KEY` — only for checkout; pages preview fine without it. Netlify Forms return 200 locally but don't reach the dashboard.

**Credits (free tier):** 300/month. Production deploys 15 each (~20/month max) — keep builds stopped and trigger manually. Branch/preview deploys free. Form submissions 1 credit each.

## SEO & Discoverability
Baseline complete: all 17 indexable pages carry a unique title, meta description, self-referencing canonical, and Open Graph + Twitter tags. Plus `robots.txt` (AI crawlers explicitly allowed, `/configurator/` excluded), `sitemap.xml`, `LocalBusiness` on `index.html` at `#organization`, `Product` schema on the 6 product pages, and `Service` + `FAQPage` on `trade.html`.

**When adding a page:**
- Title ≤ ~60 rendered chars; description 130–160; canonical and `og:image` as absolute URLs
- **Add it to `sitemap.xml` by hand** — no build step generates it
- Utility pages (cart, review, 404) get `noindex, follow` and stay out of the sitemap. Keep them **crawlable** — a `robots.txt` `Disallow` prevents crawlers from ever reading the `noindex`, so the URL can linger in the index instead of dropping out
- `?style=`-type variants canonicalize to the param-less URL

**Copy principles** — audience is contractors and owners needing small-batch repair/reproduction; the discontinued-latch case study is the proof point.
- Breadth via concrete examples in the body, specificity in the title. Nobody searches "custom object production."
- List ad hoc 3D printing, don't lead with it — attracts price-shoppers; the moat is reverse-engineering and finish matching.
- Write quotable facts, not adjectives — LLM retrieval is passage-level and extracts self-contained statements.
- Repair/reproduction lives at `trade.html#hardware-reproduction` by choice; promote to its own page only if inquiries gain volume.
- `FAQPage` gives no rich results for commercial sites (Google restricted to gov/health, 2023) — keep for machine parsing only.

## To-Dos
- [ ] Link the download spec sheet button to the actual spec
- [ ] Delete unreachable GLBs listed above
- [ ] Add **screw size selector** to `configurator/main.js` + `configurator/index.html`
- [ ] *(Future)* Resend + Stripe webhook to automate review invitation emails if volume grows

### SEO — off-site (the only remaining lever)
On-page work is done. Visibility now depends on third-party presence, which is where LLMs form vendor opinions — training data is not a lever, retrieval at inference is.
- [ ] Genuine participation in r/Contractors, r/electricians, r/HomeImprovement, r/machinists — answer the technical question, mention the capability. Astroturfing gets detected and burns the signal.
- [ ] List on Thomasnet and fabrication/sourcing directories
- [ ] Submit `sitemap.xml` to Google Search Console for indexing feedback (free, no admin rights needed)
