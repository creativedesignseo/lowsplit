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

      const { data: authData } = await supabase.auth.admin.listUsers();
      const user = authData?.users?.find(u => u.email === customerEmail);
      
      if (user) {
        userId = user.id;
        console.log('User found:', userId);
      } else {
        console.error('User not found via email:', customerEmail);
      }

      // 2. Extract Metadata & Auto-Assign Logic
      let groupId = session.metadata?.groupId;
      const months = parseInt(session.metadata?.months || '1');
      const serviceName = session.metadata?.serviceName || 'Unknown';
      const amountPaid = session.amount_total / 100;

      if (!groupId && serviceName && userId) {
        console.log('No group provided in metadata. Auto-assigning...');
        
        // Find Service ID
        const { data: service } = await supabase
          .from('services')
          .select('id, max_slots')
          .eq('name', serviceName)
          .single();
        
        if (service) {
           // Find Available Group
           const { data: availableGroup } = await supabase
              .from('subscription_groups')
              .select('id, slots_occupied')
              .eq('service_id', service.id)
              .eq('status', 'available')
              .lt('slots_occupied', service.max_slots)
              .limit(1)
              .maybeSingle();

           if (availableGroup) {
              groupId = availableGroup.id;
              console.log('Found available group:', groupId);
           } else {
              console.log('No available group found. Creating a new one...');
              const { data: newGroup } = await supabase
                  .from('subscription_groups')
                  .insert({
                      service_id: service.id,
                      admin_id: userId,
                      title: `${serviceName} Group (Auto)`,
                      price_per_slot: amountPaid / months,
                      max_slots: service.max_slots,
                      slots_occupied: 0,
                      status: 'available',
                      payment_cycle: 'monthly',
                      visibility: 'public'
                  })
                  .select()
                  .single();
              
              if (newGroup) groupId = newGroup.id;
           }
        }
      }

      // 3. Record Transaction
      const { data: transaction, error: txError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: userId,
          amount: amountPaid,
          currency: 'EUR',
          status: 'completed',
          stripe_payment_intent_id: session.payment_intent || session.id
        })
        .select()
        .single();

      if (txError) console.error('Transaction Error:', txError);

      // 4. Create Membership
      if (userId && groupId) {
        const { data: membership, error: memError } = await supabase
          .from('memberships')
          .insert({
            user_id: userId,
            group_id: groupId,
            role: 'member',
            payment_status: 'paid',
            stripe_subscription_id: session.payment_intent,
            last_payment_at: new Date().toISOString()
          })
          .select()
          .single();

        if (memError) {
          console.error('Membership Error:', memError);
        } else {
          console.log('Membership created:', membership.id);

          // Link Membership to Transaction
          if (transaction) {
            await supabase
              .from('payment_transactions')
              .update({ membership_id: membership.id })
              .eq('id', transaction.id);
          }

          // Update Group Slots
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
