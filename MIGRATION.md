# Stack Migration Plan
## From: Shopify + Formspree + GitHub Pages
## To: Netlify + Stripe + Airtable + Resend

---

## Target Stack

| Layer | Service | Cost |
|---|---|---|
| Hosting + Functions + Forms | Netlify | Free tier |
| Payments | Stripe | 2.9% + $0.30/transaction, no monthly fee |
| Data store | Airtable | Free tier |
| Transactional email | Resend | Free tier (3k/month) |

**Monthly fixed cost: $0** (vs ~$39/month on Shopify Basic)

---

## Phase 1 — Netlify Hosting

- [ ] Push repo to GitHub (if not already)
- [ ] Connect GitHub repo to Netlify
  - Build command: *(blank)*
  - Publish directory: `/`
- [ ] Verify all pages, assets, and links serve correctly
- [ ] Add a `404.html` page
- [ ] Point `voldt.design` domain to Netlify (replaces current setup)

---

## Phase 2 — Replace Formspree with Netlify Forms

Two forms need updating:

- [ ] `contact.html` — remove Formspree endpoint, add `data-netlify="true"` to `<form>` tag
- [ ] `trade.html` — same

Netlify Forms handles submission storage and email notifications natively.
AJAX success handling may need minor adjustment (Netlify returns differently than Formspree).

---

## Phase 3 — Replace Shopify Checkout with Stripe

### 3a — Stripe product/variant setup
- [ ] Create products in Stripe dashboard to mirror current Shopify variant map:
  - PolyFrames (coat rack, table lamp A/B, floor lamp A/B, coffee table)
  - Detroit Lights (pendant A/B standard/large, table lamp A/B standard/large)
  - VOLDT Hardware (5 length tiers, knob variant)
- [ ] Map Stripe Price IDs to cart item IDs (mirrors current `js/shopify.js` variant GID map)

### 3b — Netlify Function: create checkout session
- [ ] Create `netlify/functions/create-checkout.js`
  - Receives cart items from frontend
  - Maps cart IDs to Stripe Price IDs
  - Passes hardware config + lamp color as Stripe session `metadata` (replaces Shopify cart notes)
  - Returns `session.url` → frontend redirects
- [ ] Store `STRIPE_SECRET_KEY` in Netlify environment variables (never in client JS)

### 3c — Frontend
- [ ] Rewrite `js/shopify.js` → `js/stripe.js`
  - Call `/.netlify/functions/create-checkout` instead of Shopify Storefront API
  - Same cart shape, same redirect pattern
- [ ] Update `cart.html` script reference

---

## Phase 4 — Replace Shopify Draft Orders (Custom Work)

- [ ] Use **Stripe Payment Links** (dashboard, no code)
  - Create a one-off link with any amount for custom commissions
  - Send link directly to client — no API or server-side code needed
- [ ] Remove any dependency on Shopify Admin API

---

## Phase 5 — Verified Purchase Reviews

- [ ] Set up Airtable base: `Purchases` table (email, product, order date, review requested)
- [ ] Create `netlify/functions/stripe-webhook.js`
  - Listens for `checkout.session.completed` events
  - Writes purchase record to Airtable
  - Sends review request email via Resend with a Formspree-style form link (or custom form)
- [ ] Register webhook endpoint in Stripe dashboard
- [ ] Store `STRIPE_WEBHOOK_SECRET` + `AIRTABLE_API_KEY` + `RESEND_API_KEY` in Netlify env vars

---

## Phase 6 — Cutover

- [ ] Verify Stripe checkout end-to-end in test mode
- [ ] Verify Netlify Forms submissions arriving
- [ ] Verify webhook → Airtable → email flow
- [ ] Switch Stripe from test to live mode
- [ ] Cancel Shopify subscription
- [ ] Cancel Formspree (if on paid plan)
