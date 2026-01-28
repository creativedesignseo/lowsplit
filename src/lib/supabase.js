import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    // Prevent automatic token refresh on visibility change
    // This stops the re-fetch when switching browser tabs
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  }
})
