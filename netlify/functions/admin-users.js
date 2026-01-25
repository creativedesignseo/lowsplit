import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 1. Auth Check: Verify JWT and Admin Role
  const authHeader = event.headers.authorization;
  if (!authHeader) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Missing Authorization header' }) };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid Token' }) };
  }

  // Check Role in Profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Unauthorized: Admins only' }) };
  }

  try {
    // 2. GET: List Users
    if (event.httpMethod === 'GET') {
      // Get Auth Users
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;

      // Get Profile Data for all these users
      const userIds = users.map(u => u.id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role, reputation_score')
        .in('id', userIds);

      // Merge Data
      const mergedUsers = users.map(u => {
        const p = profiles.find(prof => prof.id === u.id) || {};
        return {
          id: u.id,
          email: u.email,
          last_sign_in: u.last_sign_in_at,
          created_at: u.created_at,
          banned_until: u.banned_until,
          full_name: p.full_name || u.user_metadata?.full_name,
          role: p.role,
          avatar_url: p.avatar_url,
          reputation: p.reputation_score
        };
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ users: mergedUsers })
      };
    }

    // 3. POST: Admin Action (Ban/Unban/Promote)
    if (event.httpMethod === 'POST') {
        const { action, targetUserId, value } = JSON.parse(event.body);

        if (!targetUserId || !action) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing parameters' }) };
        }

        if (action === 'ban') {
            const banDuration = value ? '876600h' : '0s'; // 100 years or 0
            const { error: banError } = await supabase.auth.admin.updateUserById(targetUserId, {
                ban_duration: banDuration
            });
            if (banError) throw banError;
        } 
        else if (action === 'setRole') {
            // Only Super Admin can set roles? For now let's allow Admin.
            const { error: roleError } = await supabase
                .from('profiles')
                .update({ role: value })
                .eq('id', targetUserId);
            if (roleError) throw roleError;
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
        };
    }

    return { statusCode: 405, headers, body: 'Method Not Allowed' };

  } catch (error) {
    console.error('Admin API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}
