// shopify.js -- Storefront API checkout integration
const SHOPIFY_DOMAIN = 'voldt-2.myshopify.com';
const SHOPIFY_TOKEN = '6f7494dd98f3629db5b1132b90087320';

// Maps local cart item IDs -> Shopify variant GIDs
const VARIANT_MAP = {
  // PolyFrames
  'polyframes-coat-rack':       'gid://shopify/ProductVariant/56245005484198',
  'polyframes-table-lamp-a':    'gid://shopify/ProductVariant/56245010071718',
  'polyframes-table-lamp-b':    'gid://shopify/ProductVariant/56245010104486',
  'polyframes-floor-lamp-a':    'gid://shopify/ProductVariant/56245951037606',
  'polyframes-floor-lamp-b':    'gid://shopify/ProductVariant/56245951070374',
  'polyframes-coffee-table':    'gid://shopify/ProductVariant/56245948022950',

  // Detroit Pendant (Hanging)
  'detroit-pendant-a-standard': 'gid://shopify/ProductVariant/56245930786982',
  'detroit-pendant-a-large':    'gid://shopify/ProductVariant/56245930918054',
  'detroit-pendant-b-standard': 'gid://shopify/ProductVariant/56245930852518',
  'detroit-pendant-b-large':    'gid://shopify/ProductVariant/56245930983590',

  // Detroit Table Lamp (Tabletop)
  'detroit-table-lamp-a-standard': 'gid://shopify/ProductVariant/56245930819750',
  'detroit-table-lamp-a-large':    'gid://shopify/ProductVariant/56245930950822',
  'detroit-table-lamp-b-standard': 'gid://shopify/ProductVariant/56245930885286',
  'detroit-table-lamp-b-large':    'gid://shopify/ProductVariant/56245931016358',

  // VOLDT Hardware (priced by length index; full config passed as cart note)
  'voldt-hardware-0':    'gid://shopify/ProductVariant/56329026306214',
  'voldt-hardware-1':    'gid://shopify/ProductVariant/56329026338982',
  'voldt-hardware-2':    'gid://shopify/ProductVariant/56329026371750',
  'voldt-hardware-3':    'gid://shopify/ProductVariant/56329026404518',
  'voldt-hardware-4':    'gid://shopify/ProductVariant/56329026437286',
  'voldt-hardware-knob': 'gid://shopify/ProductVariant/56329026470054',
};

async function shopifyFetch(query, variables) {
  const res = await fetch(`https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

// Build a cart note summarising any options (e.g. color) that aren't Shopify variants
function buildNote(cartItems) {
  const lines = cartItems
    .filter(i => i.options && Object.keys(i.options).length)
    .map(i => {
      const opts = Object.entries(i.options).map(([k, v]) => `${k}: ${v}`).join(', ');
      return `${i.name} -- ${opts}`;
    });
  return lines.length ? lines.join('\n') : null;
}

async function createShopifyCheckout(discountCode = '') {
  const cartItems = getCart();
  const lines = [];
  const unmapped = [];

  for (const item of cartItems) {
    const variantId = VARIANT_MAP[item.id];
    if (variantId) {
      lines.push({ merchandiseId: variantId, quantity: item.quantity });
    } else {
      unmapped.push(item.name);
    }
  }

  if (lines.length === 0) {
    alert('None of your cart items could be matched to a Shopify product. Please contact us at info@voldtlab.com.');
    return;
  }

  const note = buildNote(cartItems);

  const mutation = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart { checkoutUrl }
        userErrors { field message }
      }
    }
  `;

  const input = { lines };
  if (note) input.note = note;

  try {
    const data = await shopifyFetch(mutation, { input });
    const result = data?.data?.cartCreate;

    if (result?.userErrors?.length) {
      console.error('Shopify cart errors:', result.userErrors);
      alert('There was a problem creating your checkout. Please try again or contact info@voldtlab.com.');
      return;
    }

    const checkoutUrl = result?.cart?.checkoutUrl;
    if (checkoutUrl) {
      const url = discountCode
        ? `${checkoutUrl}${checkoutUrl.includes('?') ? '&' : '?'}discount=${encodeURIComponent(discountCode)}`
        : checkoutUrl;
      window.location.href = url;
    } else {
      throw new Error('No checkoutUrl returned');
    }
  } catch (err) {
    console.error('Shopify checkout error:', err);
    alert('Unable to reach checkout. Please try again or contact info@voldtlab.com.');
  }
}
