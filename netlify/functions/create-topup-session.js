import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    const { amount, userEmail, userId } = JSON.parse(event.body);

    if (!amount || amount < 5) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'El monto mínimo de recarga es €5.00' })
      };
    }

    if (!userId) {
       return {
         statusCode: 400,
         headers,
         body: JSON.stringify({ error: 'ID de usuario requerido' })
       };
    }

    // Crear sesión de Stripe Checkout para recarga
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: userEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Recarga de Billetera LowSplit`,
              description: `Añade saldo a tu cuenta para pagar suscripciones compartidas.`
            },
            unit_amount: Math.round(amount * 100)
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${event.headers.origin || event.headers.referer?.split('/').slice(0, 3).join('/')}/dashboard?tab=wallet&payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${event.headers.origin || event.headers.referer?.split('/').slice(0, 3).join('/')}/dashboard?tab=wallet&payment=cancelled`,
      metadata: {
        userId: userId,
        type: 'top_up',
        amount: String(amount)
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sessionId: session.id, url: session.url })
    };

  } catch (error) {
    console.error('Stripe Top-up error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}
