import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Auth Check
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid Token' });
  }

  // Check Admin Role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    // 2. GET: List All Groups (Holistic View)
    if (req.method === 'GET') {

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
          credentials: {
            login: group.credentials_login,
            password: group.credentials_password
          }
        };
      });

      return res.status(200).json({ groups: enrichedGroups });
    }

    // 3. PUT: Update Group Credentials
    if (req.method === 'PUT') {
      const { groupId, credentials_login, credentials_password } = req.body;

      if (!groupId) {
        return res.status(400).json({ error: 'Missing Group ID' });
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

      return res.status(200).json({ success: true, data });
    }

    return res.status(405).send('Method Not Allowed');

  } catch (error) {
    console.error('Admin Groups API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
