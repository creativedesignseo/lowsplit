
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

// Validaciones previas
if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ FATAL: Missing env vars. Check .env file');
  process.exit(1);
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function restoreMembership() {
  console.log('--- 🚀 INITIATING MANUAL RESTORE ---');
  
  const userId = 'ddb7534b-2091-4d46-bd81-45660ed08d3c'; // premiumconjuntas@gmail.com
  const serviceSlug = 'apple'; // "Apple One" (6 slots)

  console.log(`User ID: ${userId}`);
  console.log(`Target Service: ${serviceSlug}`);

  // 1. Get Service ID
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('*')
    .eq('slug', serviceSlug)
    .single();

  if (serviceError || !service) {
      console.error('❌ Service Not Found:', serviceError);
      return;
  }
  console.log(`✅ Service Resolved: ${service.name} (${service.id})`);

  // 2. Insert Membership
  const payload = {
    user_id: userId,
    service_id: service.id,
    role: 'member',           
    status: 'active',         
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), 
    payment_status: 'paid',
    stripe_subscription_id: 'manual_restore_' + Date.now()
  };

  console.log('Attempting INSERT...');
  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .insert(payload)
    .select()
    .single();

  if (membershipError) {
      console.error('❌ INSERT FAILED:', JSON.stringify(membershipError, null, 2));
      return;
  }

  if (!membership) {
      console.error('❌ INSERT SILENTLY FAILED (No data returned)');
      return;
  }

  console.log('✅ INSERT SUCCESSFUL!');
  console.log('Membership ID:', membership.id);

  // 3. Final Verification
  const { data: check } = await supabase
    .from('memberships')
    .select('*')
    .eq('id', membership.id);
    
  if (check && check.length > 0) {
      console.log('🎉 VERIFICATION PASSED: Record exists in DB.');
  } else {
      console.error('⚠️ VERIFICATION FAILED: Record not found immediately after insert.');
  }
}

restoreMembership().catch(e => console.error('Script Crash:', e));
