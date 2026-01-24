import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const { serviceName, priceAmount, months, userEmail, groupId } = JSON.parse(event.body);

    if (!priceAmount || !serviceName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: userEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${serviceName} - ${months} ${months === 1 ? 'mes' : 'meses'}`,
              description: `Acceso compartido a ${serviceName}`
            },
            unit_amount: Math.round(priceAmount * 100)
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${event.headers.origin || event.headers.referer?.split('/').slice(0, 3).join('/')}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${event.headers.origin || event.headers.referer?.split('/').slice(0, 3).join('/')}/explore?payment=cancelled`,
      metadata: {
        groupId: groupId || '',
        months: String(months || 1)
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sessionId: session.id, url: session.url })
    };

  } catch (error) {
    console.error('Stripe error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}
