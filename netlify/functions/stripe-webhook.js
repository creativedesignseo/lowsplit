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
    'Content-Type': 'application/json'
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    
    console.log('Payment success:', session.id);

    try {
      // 1. Identify User
      const customerEmail = session.customer_email;
      let userId = null;

      // Try finding user by email in auth
      const { data: authData } = await supabase.auth.admin.listUsers();
      const user = authData?.users?.find(u => u.email === customerEmail);
      
      if (user) {
        userId = user.id;
        console.log('User found:', userId);
      } else {
        console.error('User not found via email:', customerEmail);
        // We persist data anyway for manual reconciliation
      }

      // 2. Extract Metadata
      const groupId = session.metadata?.groupId;
      const months = parseInt(session.metadata?.months || '1');
      const serviceName = session.metadata?.serviceName || 'Unknown';
      const amountPaid = session.amount_total / 100;

      // 3. Record Transaction
      const { data: transaction, error: txError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: userId, // Can be null if not found
          amount: amountPaid,
          currency: 'EUR',
          status: 'completed',
          stripe_payment_intent_id: session.payment_intent || session.id
        })
        .select()
        .single();

      if (txError) console.error('Transaction Error:', txError);

      // 4. Create Membership (ONLY if we have a user and a group)
      if (userId && groupId) {
        // Calculate expiry
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + months);

        const { data: membership, error: memError } = await supabase
          .from('memberships')
          .insert({
            user_id: userId,
            group_id: groupId,
            role: 'member',
            payment_status: 'paid',
            stripe_subscription_id: session.payment_intent,
            last_payment_at: new Date().toISOString()
            // expires_at column might not exist in schema yet/or logic handled elsewhere? 
            // verifying schema... schema has joined_at/last_payment but expires at?
            // Schema check in step 996 showed no 'expires_at' column in memberships table!
            // Wait, logic in Step 1001 didn't use expires_at either? 
            // Step 1001 code: "last_payment_at: new Date().toISOString()" - Correct.
          })
          .select()
          .single();

        if (memError) {
          console.error('Membership Error:', memError);
        } else {
          console.log('Membership created:', membership.id);

          // 5. Update Transaction link
          if (transaction) {
            await supabase
              .from('payment_transactions')
              .update({ membership_id: membership.id })
              .eq('id', transaction.id);
          }

          // 6. Update Group Slots
          await supabase.rpc('increment_group_slots', { group_id: groupId });
        }
      }

    } catch (error) {
      console.error('Processing Error:', error);
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ received: true })
  };
}
