
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

async function findUserAndService() {
  console.log('--- FINDING USER ---');
  // 1. Find User by Email
  const email = 'premiumconjuntas@gmail.com';
  let userId = null;

  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
      console.error('Error listing users:', authError);
  } else {
      const user = authData.users.find(u => u.email === email);
      if (user) {
          console.log(`User Found: ${user.email} (ID: ${user.id})`);
          userId = user.id;
      } else {
          console.log(`User NOT found with email: ${email}`);
          // List all users to see if there's a typo or similar
          console.log('Listing all users for manual check:');
          authData.users.forEach(u => console.log(`- ${u.email} (${u.id})`));
      }
  }

  console.log('\n--- FINDING SERVICE ---');
  // 2. Find Service containing "6.56" in price or similar
  // The user said 6.56 EUR.
  // We can search for services and calculated prices.
  const { data: services, error: serviceError } = await supabase
    .from('services')
    .select('*');

  if (serviceError) {
      console.error('Error listing services:', serviceError);
  } else {
      console.log('Listing all services to match price ~6.56 EUR:');
      services.forEach(s => {
          // Calculate monthly price if needed, or just show raw
          // logic from utils: price_per_slot = total_price / max_slots * 1.2 (approx)
          // We can just dump them and I'll calculate mentally
          console.log(`- ${s.name} (Slug: ${s.slug}) | Total Price: ${s.total_price} | Max Slots: ${s.max_slots}`);
      });
  }
}

findUserAndService();
