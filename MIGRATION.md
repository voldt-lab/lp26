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
- [x] ~~VOLDT Hardware~~ — **deferred** (pricing model TBD, likely custom quote; configurator add-to-cart severed for now)
- [x] Switched to **inline `price_data`** approach — no pre-created Stripe Price IDs needed. Amount enforced server-side via `PRICE_CENTS` map in `netlify/create-checkout.js`. Variant name + options built dynamically (e.g. "Detroit Pendant Style A — Color: Black, Size: Standard").
  - **Analytics note**: when exporting from Stripe, include "Checkout line item summary" column for per-product breakdown.

### 3b — Netlify Function: create checkout session
- [x] `netlify/create-checkout.js` — receives cart items, maps IDs to prices, builds `price_data` line items, passes options as `metadata.order_notes`, handles discount code lookup
- [x] `STRIPE_SECRET_KEY` stored in Netlify environment variables

### 3c — Frontend
- [x] `js/stripe.js` — calls `/.netlify/functions/create-checkout`, redirects to Stripe hosted checkout
- [x] `cart.html` — script reference updated, success state added (`?success=true`), "Secure checkout by Stripe"

---

## Phase 4 — Replace Shopify Draft Orders (Custom Work)

- [x] Use **Stripe Payment Links** or **Stripe Invoices** (dashboard, no code)
  - Payment Links: reusable or one-off link for a fixed amount — send directly to client
  - Invoices: itemized, client receives email with pay button — better for commissioned work with a scope breakdown
  - No API or server-side code needed for either
- [x] No Shopify Admin API dependency to remove — custom work was always handled manually

---

## Phase 5 — Verified Purchase Reviews

**Design decision:** Reviews are brand-level, not per-product. One email per completed order; open text + star rating. Reviewer naturally mentions the product in their text. Reviews manually curated and hardcoded into the relevant collection page (`polyframes.html`, `detroit-lights.html`). No automated product-linking needed — `price_data` checkout has no persistent catalog to link against, and manual curation at this volume is trivial.

### Steps
- [ ] Create `netlify/stripe-webhook.js`
  - Verify Stripe webhook signature (`STRIPE_WEBHOOK_SECRET`)
  - On `checkout.session.completed`: send review request email via Resend (`RESEND_API_KEY`)
  - Email links to the review submission page
- [ ] Register webhook in Stripe dashboard → Webhooks → `/.netlify/functions/stripe-webhook`
- [ ] Store `STRIPE_WEBHOOK_SECRET` + `RESEND_API_KEY` in Netlify env vars
- [ ] Create `review.html` — star rating + open text, `data-netlify="true"`, submits to Netlify Forms
- [ ] Manually curate approved submissions → hardcode into collection page testimonial sections

---

## Phase 6 — Cutover

- [ ] Point `voldtlab.com` domain to Netlify (replaces current setup)
- [ ] Verify Stripe checkout end-to-end in test mode
- [ ] Verify Netlify Forms submissions arriving
- [ ] Verify webhook → Resend email flow
- [ ] Switch Stripe from test to live mode
- [ ] Cancel Shopify subscription
- [ ] Cancel Formspree (if on paid plan)
