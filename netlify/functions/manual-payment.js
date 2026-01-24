import { createClient } from '@supabase/supabase-js';

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

  try {
    const { userId, userEmail, groupId, serviceName, amount, months } = JSON.parse(event.body);

    if (!userId || !amount) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    console.log('Processing Manual Payment (Bizum) for:', userEmail);

    // 1. Record Transaction
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        amount: amount,
        currency: 'EUR',
        status: 'completed', // Auto-approve for Bizum as per user request
        stripe_payment_intent_id: 'bizum_' + Date.now().toString() + '_' + Math.random().toString(36).substring(7)
      })
      .select()
      .single();

    if (txError) throw txError;

    let membershipId = null;

    // 2. Create Membership if Group ID provided
    if (groupId) {
       // Calculate end date
       const endDate = new Date();
       endDate.setMonth(endDate.getMonth() + (months || 1));

       const { data: membership, error: memError } = await supabase
        .from('memberships')
        .insert({
          user_id: userId,
          group_id: groupId,
          role: 'member',
          payment_status: 'paid', // Auto-approve
          stripe_subscription_id: 'bizum_manual',
          last_payment_at: new Date().toISOString()
        })
        .select()
        .single();

      if (memError) throw memError;
      membershipId = membership.id;

      // 3. Link Membership to Transaction
      await supabase
        .from('payment_transactions')
        .update({ membership_id: membershipId })
        .eq('id', transaction.id);

      // 4. Update Group Slots
      await supabase.rpc('increment_group_slots', { group_id: groupId });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        transactionId: transaction.id, 
        membershipId 
      })
    };

  } catch (error) {
    console.error('Manual Payment Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}
