import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { amount, userEmail, userId } = req.body;

    if (!amount || amount < 5) {
      return res.status(400).json({ error: 'El monto mínimo de recarga es €5.00' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'ID de usuario requerido' });
    }

    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || 'https://lowsplit.vercel.app';

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
      success_url: `${origin}/dashboard?tab=wallet&success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?tab=wallet&success=false`,
      metadata: {
        userId: userId,
        type: 'top_up',
        amount: String(amount)
      }
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error('Stripe Top-up error:', error);
    return res.status(500).json({ error: error.message });
  }
}
