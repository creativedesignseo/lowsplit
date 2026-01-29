
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars:', { supabaseUrl, hasKey: !!supabaseServiceKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debug() {
  console.log('--- DEBUGGING GROUPS ---');
  
  // 1. Get User ID for email
  const email = 'madspublioficial@gmail.com';
  console.log(`Fetching user for email: ${email}`);
  
  // Need to use admin auth api or list users if possible, but service key allows querying 'auth.users' via rpc or just checking profiles if synced.
  // Actually, we can just query the 'profiles' table if it has email? Usually profiles has 'id' and maybe 'username', but let's see.
  // Better: List users via auth admin if we can (requires secret key which we have).
  
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  
  if (userError) {
    console.error('Error listing users:', userError);
    return;
  }
  
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.error(`User ${email} not found in Auth!`);
    console.log('Available users:', users.map(u => u.email));
    return;
  }
  
  console.log(`User ID: ${user.id}`);
  
  // 2. Query subscription_groups for this admin_id
  const { data: groups, error: groupsError } = await supabase
    .from('subscription_groups')
    .select('*')
    .eq('admin_id', user.id);
    
  if (groupsError) {
    console.error('Error fetching groups:', groupsError);
  } else {
    console.log(`Found ${groups.length} groups for this user.`);
    console.log(JSON.stringify(groups, null, 2));
  }

  // 3. Query ALL groups to see if admin_id is mismatched
  const { data: allGroups } = await supabase
    .from('subscription_groups')
    .select('id, title, admin_id')
    .limit(5);
    
  console.log('Sample of all groups:', allGroups);
}

debug();
