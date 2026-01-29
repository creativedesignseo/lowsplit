
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// KEY DIFFERENCE: Use ANON key
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
    console.error("Missing ANON KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugAnon() {
  console.log('--- ANON QUERY SIMULATION ---');
  const serviceId = 'cd93330f-f27d-4b47-b6dc-005f1fc269eb'; // Apple One
  
  const { data: frontendGroups, error: feError } = await supabase
    .from('subscription_groups')
    .select('*')
    .eq('service_id', serviceId)
    .eq('status', 'available');

  if (feError) {
    console.error('Anon Query Error:', feError);
  } else {
    console.log(`Anon Query returned ${frontendGroups.length} groups.`);
    if (frontendGroups.length > 0) {
        console.log('Sample:', JSON.stringify(frontendGroups[0], null, 2));
    }
  }
}

debugAnon();
