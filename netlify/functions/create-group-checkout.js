import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers, 
      body: JSON.stringify({ error: 'Method not allowed' }) 
    };
  }

  try {
    const { groupId, userId, amount, serviceName, walletDeducted = 0 } = JSON.parse(event.body);

    if (!groupId || !userId || !amount) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: groupId, userId, amount' })
      };
    }

    // Create Stripe checkout session for group payment
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Unirse a grupo: ${serviceName}`,
            description: walletDeducted > 0 
              ? `Pago restante (€${walletDeducted.toFixed(2)} pagado con billetera)`
              : 'Pago completo con tarjeta'
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${event.headers.origin || 'https://lowsplit.netlify.app'}/dashboard?tab=purchases&success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${event.headers.origin || 'https://lowsplit.netlify.app'}/group/${groupId}?success=false`,
      metadata: {
        type: 'group_join',
        groupId: groupId,
        userId: userId,
        walletDeducted: walletDeducted.toString()
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sessionId: session.id, url: session.url })
    };
  } catch (error) {
    console.error('Error creating group checkout session:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}
