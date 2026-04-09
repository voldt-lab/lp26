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

**Design decision:** Reviews are brand-level, not per-product. One invitation email per completed order — timing is critical (reviewer needs to have received and lived with the product, ~2-4 weeks out). Open text + star rating. Reviews manually curated and hardcoded into the relevant collection page (`polyframes.html`, `detroit-lights.html`).

**Token / gating:** The Stripe Checkout Session ID (`cs_live_...`) serves as the review invitation token. Included in the manual email as a URL parameter (`review.html?session=cs_live_...`). A Netlify Function (`verify-session.js`) calls `stripe.checkout.sessions.retrieve()` to confirm the session is real and `payment_status === 'paid'` before revealing the form. Session IDs are long cryptographic strings — not guessable.

**Deduplication:** On submission, a second Netlify Function (`mark-reviewed.js`) sets `metadata.review_submitted = 'true'` on the session's PaymentIntent via `stripe.paymentIntents.update()`. The verify function checks this flag on every visit — subsequent attempts to use the same link return "already submitted." Stripe is the record; no external data store needed.

**Resend: on hold.** At current volume, review invitations are sent manually by VOLDT after checking the Stripe dashboard. Resend (or similar) would automate the send via a `checkout.session.completed` webhook — worth adding if order volume grows. Not a blocker for launch.

### Steps
- [ ] Create `netlify/verify-session.js` — retrieves Stripe session + PaymentIntent, checks `review_submitted` flag, returns valid/invalid/already-reviewed
- [ ] Create `netlify/mark-reviewed.js` — sets `metadata.review_submitted = 'true'` on the PaymentIntent after form submission
- [ ] Create `review.html` — form hidden by default; JS calls verify-session on load, reveals form if valid; on submit calls mark-reviewed then posts to Netlify Forms
- [ ] Manually curate approved Netlify Forms submissions → hardcode into collection page testimonial sections
- [ ] *(Future)* Add Resend + Stripe webhook to automate invitation emails if volume grows

---

## Phase 6 — Cutover

- [ ] Point `voldtlab.com` domain to Netlify (replaces current setup)
- [ ] Verify Stripe checkout end-to-end in test mode
- [x] Verify Netlify Forms submissions arriving
- [ ] Switch Stripe from test to live mode
- [ ] Cancel Shopify subscription
- [ ] Cancel Formspree (if on paid plan)
