// create-checkout.js -- Netlify Function: creates a Stripe Checkout Session
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Maps local cart item IDs -> price in cents (enforced server-side)
const PRICE_CENTS = {
  // PolyFrames (Style A and B share the same price)
  'polyframes-coat-rack':          49900,  // $499
  'polyframes-table-lamp-a':       34900,  // $349
  'polyframes-table-lamp-b':       34900,
  'polyframes-floor-lamp-a':       89900,  // $899
  'polyframes-floor-lamp-b':       89900,

  // Detroit Lights (pendant + table lamp, both styles, standard/large)
  'detroit-pendant-a-standard':     9900,  // $99
  'detroit-pendant-a-large':       22900,  // $229
  'detroit-pendant-b-standard':     9900,
  'detroit-pendant-b-large':       22900,
  'detroit-table-lamp-a-standard':  9900,
  'detroit-table-lamp-a-large':    22900,
  'detroit-table-lamp-b-standard':  9900,
  'detroit-table-lamp-b-large':    22900,

  // VOLDT Hardware -- TODO: add pricing once finalized
};

const SHIPPING_REGULAR = 'shr_1TOpVCRzSEMboF2806PQbamY'; // $15 -- single small item
const SHIPPING_LARGE   = 'shr_1TOpVuRzSEMboF28Msyms2np'; // $25 -- 2 smalls or single oversized
const SHIPPING_COMBO   = 'shr_1TUtPbRzSEMboF280PPMIcyV'; // $?? -- 3+ smalls, 2+ oversized, or mixed

const OVERSIZED_IDS = new Set([
  'polyframes-coat-rack',
  'polyframes-floor-lamp-a',
  'polyframes-floor-lamp-b',
]);

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
    const unitAmount = PRICE_CENTS[item.id];
    if (unitAmount !== undefined) {
      const optionStr = item.options && Object.keys(item.options).length
        ? ' — ' + Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(', ')
        : '';
      line_items.push({
        price_data: {
          currency: 'usd',
          unit_amount: unitAmount,
          product_data: { name: item.name + optionStr },
        },
        quantity: item.quantity,
      });
    }
  }

  const oversizedCount = cartItems.reduce((n, item) => n + (OVERSIZED_IDS.has(item.id) ? item.quantity : 0), 0);
  const smallCount     = cartItems.reduce((n, item) => n + (OVERSIZED_IDS.has(item.id) ? 0 : item.quantity), 0);

  let shippingRate;
  if (oversizedCount === 0 && smallCount === 1) {
    shippingRate = SHIPPING_REGULAR;
  } else if (oversizedCount >= 2 || (oversizedCount >= 1 && smallCount >= 1) || smallCount >= 3) {
    shippingRate = SHIPPING_COMBO;
  } else {
    // 2 smalls, or exactly 1 oversized alone
    shippingRate = SHIPPING_LARGE;
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
    shipping_options: [{ shipping_rate: shippingRate }],
    automatic_tax: { enabled: true },
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
