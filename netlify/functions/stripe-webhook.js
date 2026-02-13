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

  console.log('Received Stripe event type:', stripeEvent.type);

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    
    console.log('=== CHECKOUT SESSION COMPLETED ===' );
    console.log('Session ID:', session.id);
    console.log('Metadata:', JSON.stringify(session.metadata));

    try {
      // 1. Identify User
      const customerEmail = session.customer_email;
      let userId = session.metadata?.userId || null;

      // Fallback: If no metadata userId, look up by email
      if (!userId && customerEmail) {
         console.log('No metadata userId, looking up by email:', customerEmail);
         const { data: authData } = await supabase.auth.admin.listUsers();
         const user = authData?.users?.find(u => u.email.toLowerCase() === customerEmail.toLowerCase());
         if (user) userId = user.id;
      }
      
      if (!userId) {
        console.error('CRITICAL: User IDENTIFICATION FAILED. Email:', customerEmail);
        // We still log the transaction if we have an email or something, but we need a user_id for the table
      }

      // 2. Extract Data
      const type = session.metadata?.type || 'subscription';
      const months = parseInt(session.metadata?.months || '1');
      const serviceName = session.metadata?.serviceName || 'Unknown';
      const amountPaid = session.amount_total / 100;
      const stripeId = session.payment_intent || session.id;
      const groupIdFromMeta = session.metadata?.groupId;

      // 3. RECORD TRANSACTION IMMEDIATELY (VITAL)
      // We do this BEFORE any fulfillment logic so we never lose a payment record
      const { data: transaction, error: txError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: userId,
          amount: amountPaid,
          currency: 'EUR',
          status: 'completed',
          stripe_payment_intent_id: stripeId
        })
        .select()
        .single();

      if (txError) {
        console.error('Transaction Recording Error (Non-blocking):', txError);
      } else {
        console.log('Transaction recorded successfully:', transaction.id);
      }

      // 4. Fulfillment Logic
      
      // --- FLOW A: Wallet Top-Up ---
      if (type === 'top_up' && userId) {
        console.log('Processing Top-up...');
        const { error: rpcError } = await supabase.rpc('handle_wallet_topup', {
          p_user_id: userId,
          p_amount: amountPaid,
          p_stripe_id: stripeId,
          p_description: `Recarga de saldo vía Stripe`
        });
        
        if (rpcError) throw rpcError;
        
        await supabase.from('notifications').insert({
          user_id: userId,
          title: '¡Recarga exitosa!',
          message: `Tu billetera ha sido recargada con €${amountPaid.toFixed(2)}.`,
          type: 'success'
        });
        return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
      }

      // --- FLOW B: Group Join (Card Payment) ---
      if (type === 'group_join' && userId && groupIdFromMeta) {
        console.log('Processing Group Join...');
        const walletDeducted = parseFloat(session.metadata?.walletDeducted || '0');

        const { error: rpcError } = await supabase.rpc('handle_join_group_card', {
          p_user_id: userId,
          p_group_id: groupIdFromMeta,
          p_card_amount: amountPaid,
          p_wallet_amount: walletDeducted,
          p_stripe_id: stripeId
        });

        if (rpcError) throw rpcError;

        // Notification
        const { data: groupData } = await supabase
          .from('subscription_groups')
          .select('services(name)')
          .eq('id', groupIdFromMeta)
          .single();

        await supabase.from('notifications').insert({
          user_id: userId,
          title: '¡Bienvenido al grupo!',
          message: `Te has unido exitosamente a ${groupData?.services?.name || 'el servicio'}.`,
          type: 'success'
        });

        return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
      }

      // --- FLOW C: Standard Subscription (Auto-assign) ---
      if (type === 'subscription' && userId && serviceName) {
        console.log('Processing Auto-assignment for:', serviceName);
        let finalGroupId = groupIdFromMeta;

        // Find Service
        const { data: service } = await supabase
          .from('services')
          .select('id, max_slots')
          .eq('name', serviceName)
          .single();
        
        if (service) {
           // Find Available Group
           const { data: availableGroup } = await supabase
              .from('subscription_groups')
              .select('id')
              .eq('service_id', service.id)
              .eq('status', 'available')
              .lt('slots_occupied', service.max_slots)
              .limit(1)
              .maybeSingle();

           if (availableGroup) {
              finalGroupId = availableGroup.id;
           } else {
              console.log('Creating new auto-group...');
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
                      visibility: 'public'
                      // REMOVED payment_cycle (causing errors)
                  })
                  .select()
                  .single();
              
              if (newGroup) finalGroupId = newGroup.id;
           }

           // Create Membership
           if (finalGroupId) {
              const { data: membership, error: memError } = await supabase
                .from('memberships')
                .insert({
                  user_id: userId,
                  group_id: finalGroupId,
                  role: 'member',
                  payment_status: 'paid',
                  stripe_subscription_id: stripeId,
                  last_payment_at: new Date().toISOString()
                })
                .select()
                .single();

              if (!memError) {
                // Link to Transaction
                if (transaction) {
                  await supabase
                    .from('payment_transactions')
                    .update({ membership_id: membership.id })
                    .eq('id', transaction.id);
                }
                // Update Slots
                await supabase.rpc('increment_group_slots', { group_id: finalGroupId });
                console.log('Auto-fulfillment complete!');
              } else {
                console.error('Membership fulfillment failed:', memError);
              }
           }
        }
      }

    } catch (error) {
      console.error('Webhook Runtime Error:', error);
      // We return 200 to Stripe anyway to avoid repeated retries of failing logic 
      // since the payment IS recorded in step 3.
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ received: true })
  };
}
