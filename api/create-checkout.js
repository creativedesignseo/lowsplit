import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { serviceName, priceAmount, months, userEmail, groupId } = req.body;

    if (!priceAmount || !serviceName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || 'https://lowsplit.vercel.app';

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
      success_url: `${origin}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/explore?payment=cancelled`,
      metadata: {
        groupId: groupId || '',
        months: String(months || 1),
        serviceName: serviceName || ''
      }
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({ error: error.message });
  }
}
