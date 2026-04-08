// create-checkout.js -- Netlify Function: creates a Stripe Checkout Session
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Maps local cart item IDs -> Stripe Price IDs
const PRICE_MAP = {
  // PolyFrames (Style A and B share the same price)
  'polyframes-coat-rack':          'price_1TJvlQ2NqRwWEdh7CPPl7wd2',
  'polyframes-table-lamp-a':       'price_1TJvjn2NqRwWEdh7oFyb4xRT',
  'polyframes-table-lamp-b':       'price_1TJvjn2NqRwWEdh7oFyb4xRT',
  'polyframes-floor-lamp-a':       'price_1TJvke2NqRwWEdh7Neg9voJf',
  'polyframes-floor-lamp-b':       'price_1TJvke2NqRwWEdh7Neg9voJf',

  // Detroit Lights (pendant + table lamp, both styles, share standard/large price)
  'detroit-pendant-a-standard':    'price_1TJvsX2NqRwWEdh75cKUXwUv',
  'detroit-pendant-a-large':       'price_1TJvtA2NqRwWEdh77qrxzcXK',
  'detroit-pendant-b-standard':    'price_1TJvsX2NqRwWEdh75cKUXwUv',
  'detroit-pendant-b-large':       'price_1TJvtA2NqRwWEdh77qrxzcXK',
  'detroit-table-lamp-a-standard': 'price_1TJvsX2NqRwWEdh75cKUXwUv',
  'detroit-table-lamp-a-large':    'price_1TJvtA2NqRwWEdh77qrxzcXK',
  'detroit-table-lamp-b-standard': 'price_1TJvsX2NqRwWEdh75cKUXwUv',
  'detroit-table-lamp-b-large':    'price_1TJvtA2NqRwWEdh77qrxzcXK',

  // VOLDT Hardware -- TODO: add Stripe Price IDs once pricing is finalized
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let cartItems, discountCode;
  try {
    ({ cartItems, discountCode } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const line_items = [];
  for (const item of cartItems) {
    const priceId = PRICE_MAP[item.id];
    if (priceId) {
      line_items.push({ price: priceId, quantity: item.quantity });
    }
  }

  if (line_items.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No items could be matched to products. Please contact info@voldtlab.com.' }),
    };
  }

  // Pass item options (lamp color, style, etc.) as order metadata
  const notes = cartItems
    .filter(i => i.options && Object.keys(i.options).length)
    .map(i => {
      const opts = Object.entries(i.options).map(([k, v]) => `${k}: ${v}`).join(', ');
      return `${i.name} — ${opts}`;
    });
  const metadata = notes.length ? { order_notes: notes.join(' | ') } : {};

  const siteUrl = process.env.URL || 'http://localhost:8888';

  const sessionParams = {
    mode: 'payment',
    line_items,
    success_url: `${siteUrl}/cart.html?success=true`,
    cancel_url:  `${siteUrl}/cart.html`,
    metadata,
    shipping_address_collection: { allowed_countries: ['US'] },
    allow_promotion_codes: true,
  };

  // If a discount code was pre-entered, try to apply it directly
  if (discountCode) {
    try {
      const codes = await stripe.promotionCodes.list({ code: discountCode, limit: 1, active: true });
      if (codes.data.length > 0) {
        sessionParams.discounts = [{ promotion_code: codes.data[0].id }];
        delete sessionParams.allow_promotion_codes;
      }
    } catch {
      // Fall back to allow_promotion_codes if lookup fails
    }
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Stripe session error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create checkout session. Please try again or contact info@voldtlab.com.' }),
    };
  }
};
