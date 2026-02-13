const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async function(event) {
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
    console.log('Session metadata:', JSON.stringify(session.metadata));
    console.log('Amount total:', session.amount_total);
    console.log('Customer email:', session.customer_email);

    try {
      // 1. Identify User
      const customerEmail = session.customer_email;
      let userId = session.metadata?.userId || null;

      // Fallback: If no metadata userId, look up by email
      if (!userId && customerEmail) {
         console.log('No metadata userId, looking up by email:', customerEmail);
         const { data: authData } = await supabase.auth.admin.listUsers();
         const user = authData?.users?.find(u => u.email === customerEmail);
         if (user) userId = user.id;
      }
      
      if (userId) {
        console.log('User identified:', userId);
      } else {
        console.error('User IDENTIFICATION FAILED. Email:', customerEmail);
      }

      // 2. Extract Metadata & Auto-Assign Logic
      let groupId = session.metadata?.groupId;
      const type = session.metadata?.type || 'subscription';
      const months = parseInt(session.metadata?.months || '1');
      const serviceName = session.metadata?.serviceName || 'Unknown';
      const amountPaid = session.amount_total / 100;
      const stripeId = session.payment_intent || session.id;

      // --- FLOW A: Wallet Top-Up ---
      console.log('Extracted type:', type);
      console.log('Extracted amountPaid:', amountPaid);
      console.log('Extracted stripeId:', stripeId);

      if (type === 'top_up') {
        const userIdFromMetadata = session.metadata?.userId;
        console.log('=== TOP-UP FLOW ===' );
        console.log('Processing Top-up for user:', userIdFromMetadata);
        console.log('Amount:', amountPaid, 'EUR');
        
        if (userIdFromMetadata) {
          console.log('Calling handle_wallet_topup RPC...');
          const { data: rpcData, error: rpcError } = await supabase.rpc('handle_wallet_topup', {
            p_user_id: userIdFromMetadata,
            p_amount: amountPaid,
            p_stripe_id: stripeId,
            p_description: `Recarga de saldo vía Stripe`
          });
          
          console.log('RPC response data:', rpcData);
          if (rpcError) {
            console.error('RPC ERROR:', rpcError);
            throw rpcError;
          }
          console.log('Top-up successful for user:', userIdFromMetadata);
          
          // Create in-app notification for the user
          await supabase.from('notifications').insert({
            user_id: userIdFromMetadata,
            title: '¡Recarga exitosa!',
            message: `Tu billetera ha sido recargada con €${amountPaid.toFixed(2)}.`,
            type: 'success'
          });
          console.log('Notification created for top-up');
          
          return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
        } else {
          console.log('ERROR: No userId in metadata!');
        }
      }

      // --- FLOW A2: Group Join via Card Payment ---
      if (type === 'group_join') {
        console.log('=== PROCESSING GROUP JOIN VIA CARD ===');
        const userIdFromMeta = session.metadata?.userId;
        const groupIdFromMeta = session.metadata?.groupId;
        const walletDeducted = parseFloat(session.metadata?.walletDeducted || '0');

        if (userIdFromMeta && groupIdFromMeta) {
          console.log('User:', userIdFromMeta, 'joining group:', groupIdFromMeta);
          console.log('Card amount:', amountPaid, ', Wallet deducted:', walletDeducted);

          // Join the user to the group
          const { error: rpcError } = await supabase.rpc('handle_join_group_card', {
            p_user_id: userIdFromMeta,
            p_group_id: groupIdFromMeta,
            p_card_amount: amountPaid,
            p_wallet_amount: walletDeducted,
            p_stripe_id: stripeId
          });

          if (rpcError) {
            console.error('Error in handle_join_group_card RPC:', rpcError);
            throw rpcError;
          }

          console.log('Group join successful for user:', userIdFromMeta);

          // Get service name for notification
          const { data: groupData } = await supabase
            .from('subscription_groups')
            .select('services(name)')
            .eq('id', groupIdFromMeta)
            .single();

          const svcName = groupData?.services?.name || 'el servicio';

          // Create notification
          await supabase.from('notifications').insert({
            user_id: userIdFromMeta,
            title: '¡Bienvenido al grupo!',
            message: `Te has unido exitosamente a ${svcName}. Ya puedes ver tus credenciales en el dashboard.`,
            type: 'success'
          });

          return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
        } else {
          console.log('ERROR: Missing userId or groupId in group_join metadata!');
        }
      }

      // --- FLOW B: Standard Subscription (Existing Logic) ---
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
};
