import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env.local manually since dotenv usually loads .env
const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env.local')))

const supabaseUrl = envConfig.VITE_SUPABASE_URL
const supabaseAnonKey = envConfig.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon Key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSuperAdmin() {
  console.log('Checking for Super Admin users...')
  
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'super_admin')

  if (error) {
    console.error('Error fetching users:', error)
    return
  }

  if (users.length === 0) {
    console.log('No users with role "super_admin" found.')
  } else {
    console.log(`Found ${users.length} super admin user(s):`)
    users.forEach(u => console.log(`- ID: ${u.id}, Name: ${u.full_name}, Email: ${u.email || 'N/A'}, Role: ${u.role}`))
    
    // Check for groups owned by these users
    for (const user of users) {
        const { data: groups, error: groupError } = await supabase
            .from('subscription_groups')
            .select('*')
            .eq('admin_id', user.id)
            
        if (groupError) {
             console.error(`Error fetching groups for user ${user.id}:`, groupError)
        } else {
             console.log(`  User ${user.id} owns ${groups.length} groups.`)
             if (groups.length > 0) {
                 console.log('    Groups:', groups.map(g => g.service_id).join(', '))
             } else {
                 console.log('    No groups found.')
             }
        }
    }
  }
}

checkSuperAdmin()
