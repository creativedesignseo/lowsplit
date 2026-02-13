
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMemberships() {
  const userId = 'ddb7534b-2091-4d46-bd81-45660ed08d3c'; // premiumconjuntas@gmail.com
  console.log(`Checking memberships for user: ${userId}`);

  const { data: memberships, error } = await supabase
    .from('memberships')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching memberships:', error);
  } else {
    console.log(`Found ${memberships.length} memberships:`);
    console.log(JSON.stringify(memberships, null, 2));
  }
}

checkMemberships();
