import Stripe from 'stripe';
import { requireAuth, corsHeaders } from './_lib/auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

export async function handler(event) {
  const headers = {
    ...corsHeaders(event.headers.origin),
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  let user;
  try {
    user = await requireAuth(event);
  } catch (error) {
    return {
      statusCode: error.statusCode || 401,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }

  try {
    // userId NUNCA se acepta del cliente — se usa user.id del JWT
    const { amount, userEmail } = JSON.parse(event.body || '{}');

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 5 || numericAmount > 500) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'El monto de recarga debe estar entre €5.00 y €500.00',
        }),
      };
    }

    const baseUrl = process.env.APP_PROD_URL || 'http://localhost:5173';

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
              description: `Añade saldo a tu cuenta para pagar suscripciones compartidas.`,
            },
            unit_amount: Math.round(numericAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/dashboard?tab=wallet&success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard?tab=wallet&success=false`,
      metadata: {
        userId: user.id,
        type: 'top_up',
        amount: String(numericAmount),
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    };
  } catch (error) {
    console.error('[create-topup-session]', error);
    const statusCode = error.statusCode && error.statusCode < 500 ? error.statusCode : 500;
    const message = statusCode < 500 ? error.message : 'Internal error';
    return {
      statusCode,
      headers,
      body: JSON.stringify({ error: message }),
    };
  }
}
