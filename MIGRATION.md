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

### 3d — Shipping & Tax
- [x] Three flat-rate shipping options created in Stripe dashboard (Products → Shipping rates):
  - Regular: `shr_1TJyUu2NqRwWEdh7Qa9fUC3b` — $15 — exactly 1 small item
  - Large: `shr_1TJyW32NqRwWEdh7Yxv9az1M` — $25 — 2 smalls, or 1 oversized alone
  - Combo: `shr_1TQBRt2NqRwWEdh7ulcEsgkl` — 3+ smalls, 2+ oversized, or mixed orders
  - **⚠️ All 3 IDs must be recreated in Stripe live mode and updated in `create-checkout.js` lines 27–29**
- [x] `create-checkout.js` selects shipping tier based on oversized/small item counts (respects `item.quantity`)
- [x] `automatic_tax: { enabled: true }` added to session — activates once Stripe account is verified (no-op in sandbox)

---

## Phase 4 — Replace Shopify Draft Orders (Custom Work)

- [x] Use **Stripe Payment Links** or **Stripe Invoices** (dashboard, no code)
  - Payment Links: reusable or one-off link for a fixed amount — send directly to client
  - Invoices: itemized, client receives email with pay button — better for commissioned work with a scope breakdown
  - No API or server-side code needed for either
- [x] No Shopify Admin API dependency to remove — custom work was always handled manually

---

## Phase 5 — Verified Purchase Reviews

**Design decision:** Reviews are brand-level, not per-product. One invitation email per completed order — timing is critical (reviewer needs to have received and lived with the product, ~2-4 weeks out). Open text + star rating. Reviews manually curated and hardcoded into the relevant collection page (`polyframes.html`, `detroit-lights.html`).

**Token / gating:** The Stripe **Payment Intent ID** (`pi_...`) serves as the review token — visible directly in the Stripe dashboard (Transactions → click payment → Payment ID). Manually copied and included in the invitation email as `review.html?payment=pi_...`. `verify-session.js` calls `stripe.paymentIntents.retrieve()`, checks `status === 'succeeded'` and `metadata.review_submitted` flag.

**Deduplication:** `mark-reviewed.js` is called first on form submit. It re-verifies the PaymentIntent, checks the flag, then sets `metadata.review_submitted = 'true'` via `stripe.paymentIntents.update()`. Returns 409 if already submitted. Stripe is the record — no external data store needed.

**Resend: on hold.** Invitations sent manually by VOLDT — look up the Payment Intent ID in Stripe after an order, include in a personal follow-up email ~2–4 weeks post-delivery. Resend + webhook would automate this if volume grows.

**Local dev note:** `mark-reviewed` and `verify-session` functions test fully with `npx netlify-cli dev`. Netlify Forms POST (final step of submit) cannot be tested locally — CLI doesn't pre-register forms. Will work on first production deploy.

### Steps
- [x] `netlify/verify-session.js` — retrieves PaymentIntent, checks `status === 'succeeded'` and `review_submitted` flag
- [x] `netlify/mark-reviewed.js` — re-verifies, sets `review_submitted: true` on PaymentIntent metadata, returns 409 if duplicate
- [x] `review.html` — verifies token on load, reveals form if valid, calls mark-reviewed before Netlify Forms POST
- [ ] **Next: trigger a production deploy** → Netlify auto-registers the `review` form on first deploy
- [ ] Test full flow on live site with a real sandbox `pi_...` ID
- [ ] Manually curate approved submissions → hardcode into collection page testimonial sections


---

## Phase 6 — Cutover

- [ ] Point `voldtlab.com` domain to Netlify (replaces current setup)
- [x] Verify Stripe checkout end-to-end in test mode (sandbox tested successfully)
- [x] Verify Netlify Forms submissions arriving
- [ ] Verify review flow end-to-end on live Netlify URL (trigger one deploy first)
- [ ] Switch Stripe from test to live mode (requires Stripe account verification)
- [x] Cancel Shopify subscription
- [ ] Cancel Formspree (if on paid plan)

---

## Operational Notes

to launch netlify local server `npx netlify-cli dev` in VSC or `netlify dev` in native terminal

**Netlify credits (free tier):** 300 credits/month. Production deploys cost 15 credits each (~20 deploys/month max). Keep builds stopped in Netlify dashboard and trigger manually only when ready. Branch/preview deploys are free. Form submissions cost 1 credit each.

**Review invitation workflow:** After an order ships (~2–4 weeks), go to Stripe dashboard → Transactions, click the payment, copy the Payment Intent ID (`pi_...`), and email the customer: `voldtlab.com/review.html?payment=pi_...`. The page verifies the purchase and prevents duplicate submissions automatically.

**Stripe analytics:** When exporting transactions, include the "Checkout line item summary" column for per-product breakdown. Multi-item orders appear as one row without it.
