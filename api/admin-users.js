import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Auth Check: Verify JWT and Admin Role
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid Token' });
  }

  // Check Role in Profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return res.status(403).json({ error: 'Unauthorized: Admins only' });
  }

  try {
    // 2. GET: List Users
    if (req.method === 'GET') {
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

      return res.status(200).json({ users: mergedUsers });
    }

    // 3. POST: Admin Action (Ban/Unban/Promote)
    if (req.method === 'POST') {
      const { action, targetUserId, value } = req.body;

      if (!targetUserId || !action) {
        return res.status(400).json({ error: 'Missing parameters' });
      }

      if (action === 'ban') {
        const banDuration = value ? '876600h' : '0s'; // 100 years or 0
        const { error: banError } = await supabase.auth.admin.updateUserById(targetUserId, {
          ban_duration: banDuration
        });
        if (banError) throw banError;
      }
      else if (action === 'setRole') {
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: value })
          .eq('id', targetUserId);
        if (roleError) throw roleError;
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).send('Method Not Allowed');

  } catch (error) {
    console.error('Admin API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
