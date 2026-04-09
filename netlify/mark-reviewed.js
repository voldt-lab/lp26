// mark-reviewed.js -- sets review_submitted flag on the Stripe PaymentIntent metadata
// Called after review submission to prevent duplicate reviews on the same order
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let paymentIntentId;
  try {
    ({ paymentIntentId } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid payment ID' }) };
  }

  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (pi.status !== 'succeeded') {
      return { statusCode: 403, body: JSON.stringify({ error: 'Payment not completed' }) };
    }

    if (pi.metadata && pi.metadata.review_submitted === 'true') {
      return { statusCode: 409, body: JSON.stringify({ error: 'Already submitted' }) };
    }

    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: { review_submitted: 'true' },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    console.error('mark-reviewed error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
