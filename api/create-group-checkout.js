import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { groupId, userId, amount, serviceName, walletDeducted = 0 } = req.body;

    if (!groupId || !userId || !amount) {
      return res.status(400).json({ error: 'Missing required fields: groupId, userId, amount' });
    }

    const origin = req.headers.origin || 'https://lowsplit.vercel.app';

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
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/dashboard?tab=purchases&success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/group/${groupId}?success=false`,
      metadata: {
        type: 'group_join',
        groupId: groupId,
        userId: userId,
        walletDeducted: walletDeducted.toString()
      }
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating group checkout session:', error);
    return res.status(500).json({ error: error.message });
  }
}
