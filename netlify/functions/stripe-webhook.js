import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase with service role key for admin operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    // Verify webhook signature
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      endpointSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
    };
  }

  // Handle the checkout.session.completed event
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    
    console.log('Payment successful:', session.id);
    console.log('Metadata:', session.metadata);
    console.log('Customer email:', session.customer_email);

    try {
      // Get user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', session.customer_email)
        .single();

      if (userError || !userData) {
        console.log('User not found by email, trying auth.users');
        // Try to find user in auth.users
        const { data: authUser } = await supabase.auth.admin.listUsers();
        const user = authUser?.users?.find(u => u.email === session.customer_email);
        
        if (!user) {
          console.error('User not found:', session.customer_email);
          return {
            statusCode: 200, // Return 200 to prevent Stripe retries
            headers,
            body: JSON.stringify({ received: true, message: 'User not found' })
          };
        }
      }

      const userId = userData?.id;
      const groupId = session.metadata?.groupId;
      const months = parseInt(session.metadata?.months || '1');
      const amountPaid = session.amount_total / 100; // Convert from cents

      // Calculate end date
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + months);

      // Insert membership
      const { data: membership, error: membershipError } = await supabase
        .from('memberships')
        .insert({
          user_id: userId,
          group_id: groupId || null,
          status: 'active',
          payment_status: 'paid',
          amount_paid: amountPaid,
          joined_at: new Date().toISOString(),
          expires_at: endDate.toISOString()
        })
        .select()
        .single();

      if (membershipError) {
        console.error('Error creating membership:', membershipError);
      } else {
        console.log('Membership created:', membership.id);
      }

      // If there's a group, update the occupied_slots
      if (groupId) {
        await supabase.rpc('increment_group_slots', { group_id: groupId });
      }

    } catch (error) {
      console.error('Error processing webhook:', error);
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ received: true })
  };
}
