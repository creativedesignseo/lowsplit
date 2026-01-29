
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugFrontend() {
  console.log('--- FRONTEND QUERY SIMULATION ---');
  const serviceId = 'cd93330f-f27d-4b47-b6dc-005f1fc269eb'; // Apple One
  console.log(`Querying groups for service: ${serviceId}`);

  // Note: Using service role key, so RLS is BYPASSED here. 
  // This will check if the DATA INTEGRITY is correct (i.e., link works).
  // If this works, but frontend fails, then it IS RLS.
  
  const { data: frontendGroups, error: feError } = await supabase
    .from('subscription_groups')
    .select(`
        *,
        admin:profiles!admin_id (id, full_name, avatar_url, reputation_score)
    `)
    .eq('service_id', serviceId)
    .eq('status', 'available');

  if (feError) {
    console.error('Frontend Query Error:', feError);
  } else {
    console.log(`Frontend Query (Service Role) returned ${frontendGroups.length} groups.`);
    if (frontendGroups.length > 0) {
        console.log('Sample:', JSON.stringify(frontendGroups[0], null, 2));
    }
  }
}

debugFrontend();
