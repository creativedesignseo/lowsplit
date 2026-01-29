import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { userId, userEmail, groupId: providedGroupId, serviceName, amount, months } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
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
          const { data: newGroup, error: groupError } = await supabase
            .from('subscription_groups')
            .insert({
              service_id: service.id,
              admin_id: userId,
              title: `${serviceName} Group (Auto)`,
              price_per_slot: amount / (months || 1),
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
          role: 'member',
          payment_status: 'paid',
          stripe_subscription_id: 'bizum_manual',
          last_payment_at: new Date().toISOString()
        })
        .select()
        .single();

      if (memError) {
        console.error('Membership Creation Failed:', memError);
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

    return res.status(200).json({
      success: true,
      transactionId: transaction.id,
      membershipId,
      groupId: finalGroupId
    });

  } catch (error) {
    console.error('Manual Payment Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
