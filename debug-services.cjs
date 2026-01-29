
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugServices() {
  console.log('--- SERVICES ---');
  const { data: services, error } = await supabase.from('services').select('id, name, slug');
  if (error) console.error(error);
  else console.log(JSON.stringify(services, null, 2));
}

debugServices();
