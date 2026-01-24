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
    const { userId, userEmail, groupId: providedGroupId, serviceName, amount, months } = JSON.parse(event.body);

    if (!userId || !amount) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    console.log('Processing Bizum for:', userEmail, 'Service:', serviceName);

    // 1. Determine Group ID
    let finalGroupId = providedGroupId;

    if (!finalGroupId && serviceName) {
      console.log('No group provided. Auto-assigning...');
      
      // A. Find the service ID
      const { data: service } = await supabase
        .from('services')
        .select('id, max_slots')
        .eq('name', serviceName)
        .single();
      
      if (service) {
         // B. Find an available group
         const { data: groups } = await supabase
          .from('subscription_groups')
          .select('id')
          .eq('service_id', service.id)
          .eq('status', 'available')
          .lt('execution_count_hack', 100) // dummy filter
          .limit(1);

         // We need a way to filter by occupied_slots < max_slots. 
         // But `occupied_slots` is a column. 
         // Let's filter in memory or better query.
         const { data: availableGroup } = await supabase
            .from('subscription_groups')
            .select('id, slots_occupied')
            .eq('service_id', service.id)
            .eq('status', 'available')
            .lt('slots_occupied', service.max_slots)
            .limit(1)
            .maybeSingle();

         if (availableGroup) {
            finalGroupId = availableGroup.id;
            console.log('Found available group:', finalGroupId);
         } else {
            console.log('No available group found. Creating a new one...');
            // C. Create a new Group (System owned? Or User owned? Let's make User admin for now or first user?)
            // Ideally, the "System" is admin. Let's use the current USER as admin for simplicity 
            // OR better: Create a "System Group" where admin_id is the user themselves (Self-hosted)
            // Wait, if I buy, I want to JOIN, not Manage.
            // But if no group exists, I have to be the first one?
            // Let's make the purchaser the ADMIN of a new group if none exists.
            const { data: newGroup, error: groupError } = await supabase
                .from('subscription_groups')
                .insert({
                    service_id: service.id,
                    admin_id: userId,
                    title: `${serviceName} Group (Auto)`,
                    price_per_slot: amount / (months || 1), // Rough estimate
                    max_slots: service.max_slots,
                    slots_occupied: 0,
                    status: 'available',
                    payment_cycle: 'monthly',
                    visibility: 'public'
                })
                .select()
                .single();
            
            if (newGroup) {
                finalGroupId = newGroup.id;
                console.log('Created new group:', finalGroupId);
            }
         }
      }
    }

    // 2. Record Transaction
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .insert({
        user_id: userId,
        amount: amount,
        currency: 'EUR',
        status: 'completed',
        stripe_payment_intent_id: 'bizum_' + Date.now()
      })
      .select()
      .single();

    if (txError) throw txError;

    let membershipId = null;

    // 3. Create Membership
    if (finalGroupId) {
       const { data: membership, error: memError } = await supabase
        .from('memberships')
        .insert({
          user_id: userId,
          group_id: finalGroupId,
          role: 'member', // Even if they are admin of group, they are a member of the split? 
          // If they created the group (admin), they might not be in `memberships` table in some models,
          // but in LowSplit usually Admin IS a member.
          payment_status: 'paid', 
          stripe_subscription_id: 'bizum_manual',
          last_payment_at: new Date().toISOString()
        })
        .select()
        .single();

      if (memError) {
          console.error('Membership Creation Failed:', memError);
          // Don't throw, we want to return success for transaction at least
      } else {
          membershipId = membership.id;
          
          // Link Membership to Transaction
          await supabase
            .from('payment_transactions')
            .update({ membership_id: membershipId })
            .eq('id', transaction.id);

          // Update Group Slots
          await supabase.rpc('increment_group_slots', { group_id: finalGroupId });
      }
    } else {
        console.warn('Could not assign group. Transaction recorded but no membership.');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        transactionId: transaction.id, 
        membershipId,
        groupId: finalGroupId
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
