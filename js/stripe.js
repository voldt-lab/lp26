// stripe.js -- Stripe checkout via Netlify Function (replaces shopify.js)
async function createStripeCheckout(discountCode = '') {
  const cartItems = getCart();

  if (cartItems.length === 0) {
    alert('Your cart is empty.');
    return;
  }

  try {
    const res = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartItems, discountCode }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Unable to reach checkout. Please try again or contact info@voldtlab.com.');
      return;
    }

    window.location.href = data.url;
  } catch (err) {
    console.error('Checkout error:', err);
    alert('Unable to reach checkout. Please try again or contact info@voldtlab.com.');
  }
}
