import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    const { serviceName, months, userEmail, userId, groupId } = JSON.parse(event.body);

    if (!serviceName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // 1. Fetch Service details from DB to get REAL price (Security)
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('name', serviceName)
      .single()

    if (serviceError || !service) {
      console.error('Service lookup error:', serviceError);
      throw new Error('Servicio no encontrado o no disponible')
    }

    // 2. Calculate Price on Server (Base/Slots * 1.25 Margin)
    // Matches utils.js calculateSlotPrice logic
    const margin = 1.25
    const basePrice = (service.total_price / service.max_slots) * margin
    const finalPrice = Math.round(basePrice * 100) // Stripe requires integer cents

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
              description: `Acceso compartido a ${service.name} gestionado por LowSplit`
            },
            unit_amount: finalPrice
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${event.headers.origin || event.headers.referer?.split('/').slice(0, 3).join('/')}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${event.headers.origin || event.headers.referer?.split('/').slice(0, 3).join('/')}/explore`,
      metadata: {
        userId: userId || '',
        groupId: groupId || '',
        months: String(months || 1),
        serviceName: serviceName || ''
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
