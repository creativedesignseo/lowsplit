import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 1. Auth Check
  const authHeader = event.headers.authorization;
  if (!authHeader) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing Authorization header' }) };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid Token' }) };
  }

  // Check Admin Role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    // 2. GET: List All Groups (Holistic View)
    if (event.httpMethod === 'GET') {
      
      // Fetch groups with services and owner info
      const { data: groups, error: groupsError } = await supabase
        .from('subscription_groups')
        .select(`
          *,
          services (name, slug, icon_url),
          profiles:admin_id (id, full_name, email, role)
        `)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // For each group, fetch active members count and details
      // Note: Doing this in a loop or separate query because nested count/filter in Supabase JS SDK can be tricky
      // We will optimize by fetching all memberships for these groups in one go.

      const groupIds = groups.map(g => g.id);
      const { data: memberships, error: membersError } = await supabase
        .from('memberships')
        .select(`
          group_id,
          user_id,
          payment_status,
          profiles (id, full_name, email, avatar_url)
        `)
        .in('group_id', groupIds);
        
      if (membersError) throw membersError;

      // Combine data
      const enrichedGroups = groups.map(group => {
        const groupMembers = memberships.filter(m => m.group_id === group.id);
        
        // Determine if "Official Stock"
        const isOfficial = ['admin', 'super_admin'].includes(group.profiles?.role);

        return {
          ...group,
          is_official: isOfficial,
          owner_name: isOfficial ? 'LowSplit Official' : (group.profiles?.full_name || 'Unknown User'),
          owner_email: group.profiles?.email,
          members: groupMembers.map(m => ({
            id: m.profiles?.id,
            name: m.profiles?.full_name,
            email: m.profiles?.email,
            avatar: m.profiles?.avatar_url,
            status: m.payment_status
          })),
          // We return credentials here because this is an ADMIN endpoint
          credentials: {
             login: group.credentials_login,
             password: group.credentials_password
          } 
        };
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ groups: enrichedGroups })
      };
    }

    // 3. PUT: Update Group Credentials
    if (event.httpMethod === 'PUT') {
        const { groupId, credentials_login, credentials_password } = JSON.parse(event.body);

        if (!groupId) {
             return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing Group ID' }) };
        }

        const { data, error } = await supabase
            .from('subscription_groups')
            .update({
                credentials_login,
                credentials_password
            })
            .eq('id', groupId)
            .select();

        if (error) throw error;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, data })
        };
    }

    return { statusCode: 405, headers, body: 'Method Not Allowed' };

  } catch (error) {
    console.error('Admin Groups API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}
