// verify-session.js -- checks if a Stripe PaymentIntent is valid, paid, and not yet reviewed
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const id = event.queryStringParameters && event.queryStringParameters.id;

  if (!id || !id.startsWith('pi_')) {
    return respond({ status: 'invalid' });
  }

  try {
    const pi = await stripe.paymentIntents.retrieve(id);

    if (pi.status !== 'succeeded') {
      return respond({ status: 'invalid' });
    }

    if (pi.metadata && pi.metadata.review_submitted === 'true') {
      return respond({ status: 'already_submitted' });
    }

    return respond({ status: 'ok' });
  } catch {
    return respond({ status: 'invalid' });
  }
};

function respond(body) {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
