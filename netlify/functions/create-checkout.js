import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, corsHeaders } from './_lib/auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    const { serviceName, months, userEmail, groupId } = JSON.parse(event.body);

    if (!serviceName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Base URL fija — no usar event.headers.origin (vulnerable a phishing)
    const baseUrl = process.env.APP_PROD_URL || 'http://localhost:5173';

    // 1. Fetch Service details from DB to get REAL price (Security)
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('name', serviceName)
      .single();

    if (serviceError || !service) {
      console.error('[create-checkout] Service lookup error:', serviceError);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Servicio no encontrado o no disponible' }),
      };
    }

    // 2. Calculate Price on Server (Base/Slots * 1.25 Margin)
    const margin = 1.25;
    const basePrice = (service.total_price / service.max_slots) * margin;
    const finalPrice = Math.round(basePrice * 100); // Stripe requires integer cents

    // 3. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: userEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${service.name} - ${months} ${months === 1 ? 'mes' : 'meses'}`,
              description: `Acceso compartido a ${service.name} gestionado por LowSplit`,
            },
            unit_amount: finalPrice,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/explore`,
      metadata: {
        userId: user.id,
        groupId: groupId || '',
        months: String(months || 1),
        serviceName: serviceName || '',
      },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    };
  } catch (error) {
    console.error('[create-checkout]', error);
    const statusCode = error.statusCode && error.statusCode < 500 ? error.statusCode : 500;
    const message = statusCode < 500 ? error.message : 'Internal error';
    return {
      statusCode,
      headers,
      body: JSON.stringify({ error: message }),
    };
  }
}
