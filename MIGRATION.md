# Stack Migration Plan
## From: Shopify + Formspree + GitHub Pages
## To: Netlify + Stripe + Resend

---

## Target Stack

| Layer | Service | Cost |
|---|---|---|
| Hosting + Functions + Forms | Netlify | Free tier |
| Payments | Stripe | 2.9% + $0.30/transaction, no monthly fee |
| Transactional email | Resend | Free tier (3k/month) |

**Monthly fixed cost: $0** (vs ~$39/month on Shopify Basic)

---

## Phase 1 — Netlify Hosting

- [x] Push repo to GitHub (if not already)
- [x] Connect GitHub repo to Netlify
  - Build command: *(blank)*
  - Publish directory: `/`
- [x] Verify all pages, assets, and links serve correctly
- [x] Add a `404.html` page

---

## Phase 2 — Replace Formspree with Netlify Forms

Two forms need updating:

- [x] `contact.html` — form name `contact`, posts to `'/'` with `application/x-www-form-urlencoded`
- [x] `trade.html` — form name `trade-inquiry`, same pattern

Netlify Forms enabled, email notifications configured. Submissions visible in Netlify dashboard → Forms.

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

- [ ] Create `netlify/functions/stripe-webhook.js`
  - Listens for `checkout.session.completed` events
  - Sends review request email via Resend directly (no data store needed)
- [ ] Register webhook endpoint in Stripe dashboard
- [ ] Store `STRIPE_WEBHOOK_SECRET` + `RESEND_API_KEY` in Netlify env vars
- [ ] Add review form page — use `data-netlify="true"` so submissions land in Netlify Forms dashboard
- [ ] Manually curate approved reviews into the site (hardcoded or a JSON file)

> **Deferred:** If review volume grows, introduce Airtable as a moderation layer (write submissions → Airtable, approve/reject in UI, Function reads approved rows). Not needed at launch.

---

## Phase 6 — Cutover

- [ ] Point `voldtlab.com` domain to Netlify (replaces current setup)
- [ ] Verify Stripe checkout end-to-end in test mode
- [ ] Verify Netlify Forms submissions arriving
- [ ] Verify webhook → Resend email flow
- [ ] Switch Stripe from test to live mode
- [ ] Cancel Shopify subscription
- [ ] Cancel Formspree (if on paid plan)
