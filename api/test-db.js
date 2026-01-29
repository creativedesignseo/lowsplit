import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const { data, error } = await supabase
      .from('services')
      .select('id, name')
      .limit(5);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      services: data
    });

  } catch (error) {
    console.error('Database Test Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
