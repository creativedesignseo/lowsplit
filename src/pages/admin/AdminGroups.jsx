import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Users, Search, Shield, Globe, Lock, Unlock, Eye, EyeOff, Save, Loader2, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const AdminGroups = () => {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingCreds, setEditingCreds] = useState(null) // Group ID being edited
  const [credsForm, setCredsForm] = useState({ login: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  
  // Fetch data from Netlify Function (Secure Admin API)
  // Fallback to Supabase direct query if function fails (e.g. localhost)
  const fetchGroups = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // 1. Try Netlify Function first
      try {
          const response = await fetch('/.netlify/functions/admin-groups', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          })
          
          const contentType = response.headers.get("content-type");
          if (response.ok && contentType && contentType.includes("application/json")) {
              const data = await response.json()
              setGroups(data.groups || [])
              return // Success via Function
          }
      } catch (err) {
          // Function failed, proceed to fallback
          console.warn('Admin Function unavailable, falling back to direct DB:', err)
      }

      // 2. Fallback: Direct Supabase Query (Localhost / Dev)
      console.log('Using Direct Supabase Fallback for Admin Groups')
      
      const { data: dbGroups, error: dbError } = await supabase
        .from('subscription_groups')
        .select(`
            *,
            services (
                name,
                icon_url,
                slug,
                max_slots
            ),
            profiles (
                email
            ),
            memberships (
                id,
                user_id
            )
        `)
        .order('created_at', { ascending: false })

      if (dbError) throw dbError

      // Map DB result to UI structure
      const mappedGroups = dbGroups.map(g => ({
          ...g,
          owner_name: g.profiles?.email?.split('@')[0] || 'Unknown',
          members: g.memberships || [], // Simplified members list
          max_slots: g.services?.max_slots || 4
      }))

      setGroups(mappedGroups)

    } catch (error) {
      console.error('Error fetching groups:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const handleEditCreds = (group) => {
    setEditingCreds(group.id)
    setCredsForm({
        login: group.credentials?.login || '',
        password: group.credentials?.password || ''
    })
    setShowPassword(false)
  }

  const saveCreds = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession()
        
        const response = await fetch('/.netlify/functions/admin-groups', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                groupId: editingCreds,
                credentials_login: credsForm.login,
                credentials_password: credsForm.password
            })
        })

        if (!response.ok) throw new Error('Failed to update')
        
        alert('Credentials updated!')
        setEditingCreds(null)
        fetchGroups() // Refresh

    } catch (error) {
        alert('Error saving: ' + error.message)
    }
  }

  // Filter groups
  const filteredGroups = groups.filter(g => 
    g.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.services?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.id.includes(searchTerm)
  )

  return (
    <>
      <Helmet>
        <title>Manage Groups - LowSplit Admin</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
                    <Users className="w-8 h-8 text-[#EF534F]" />
                    Global Groups
                </h1>
                <p className="text-gray-500">Holistic view of all subscription inventory</p>
            </div>
            
            <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search groups, owners, IDs..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-gray-200 focus:ring-[#EF534F] focus:border-[#EF534F]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {/* Error State */}
        {error && (
            <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-xl flex items-start gap-3">
                <div className="mt-1"><Shield className="w-5 h-5" /></div>
                <div>
                   <p className="font-bold">Cannot load admin data</p>
                   <p className="text-sm">{error}</p>
                   <p className="text-xs mt-2 opacity-80">
                       Note: Admin functions require the Netlify backend. This is expected if you are running on localhost:3000 only.
                   </p>
                </div>
            </div>
        )}

        {/* Table */}
        {!error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
                <div className="p-12 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 sticky top-0">
                            <tr>
                                <th className="px-6 py-4">Service / Group</th>
                                <th className="px-6 py-4">Owner (Creator)</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Slots</th>
                                <th className="px-6 py-4">Credentials</th>
                                <th className="px-6 py-4 text-right">Members</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredGroups.map(group => (
                                <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={group.services?.icon_url} alt="" className="w-8 h-8 rounded-lg object-contain bg-white shadow-sm" />
                                            <div>
                                                <div className="font-bold text-gray-900">{group.services?.name}</div>
                                                <div className="text-xs text-gray-400 font-mono">{group.id.slice(0,8)}...</div>
                                                {group.title && group.title !== group.services?.name && (
                                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{group.title}</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {group.is_official ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EF534F]/10 text-[#EF534F]">
                                                <Shield className="w-3 h-3" />
                                                LowSplit Official
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">
                                                    {group.owner_name?.[0]}
                                                </div>
                                                <span className="font-medium text-gray-700">{group.owner_name}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold ${
                                            group.status === 'active' || group.status === 'available' ? 'bg-green-100 text-green-700' :
                                            group.status === 'full' ? 'bg-blue-100 text-blue-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {group.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-[#EF534F]" 
                                                    style={{ width: `${(group.slots_occupied / group.max_slots) * 100}%` }} 
                                                />
                                            </div>
                                            <span className="text-xs font-bold">{group.slots_occupied}/{group.max_slots}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingCreds === group.id ? (
                                            <div className="flex flex-col gap-2 min-w-[200px]">
                                                <input 
                                                    type="text" 
                                                    placeholder="Login (Email)"
                                                    className="text-xs px-2 py-1 border rounded"
                                                    value={credsForm.login}
                                                    onChange={e => setCredsForm({...credsForm, login: e.target.value})}
                                                />
                                                <div className="relative">
                                                     <input 
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Password"
                                                        className="text-xs px-2 py-1 border rounded w-full"
                                                        value={credsForm.password}
                                                        onChange={e => setCredsForm({...credsForm, password: e.target.value})}
                                                    />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600">
                                                        {showPassword ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setEditingCreds(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                                                    <button onClick={saveCreds} className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 flex items-center gap-1">
                                                        <Save className="w-3 h-3" /> Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div onClick={() => handleEditCreds(group)} className="group cursor-pointer flex items-center gap-2 text-gray-500 hover:text-[#EF534F] transition-colors">
                                                <Lock className="w-4 h-4" />
                                                <span className="text-xs font-mono">••••••••</span>
                                                <span className="opacity-0 group-hover:opacity-100 text-[10px] uppercase font-bold tracking-wide">Edit</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end -space-x-2">
                                            {group.members && group.members.length > 0 ? group.members.map(member => (
                                                <div key={member.id} title={member.name} className="w-8 h-8 rounded-full bg-white border-2 border-white shadow-sm overflow-hidden relative cursor-help">
                                                    {member.avatar ? (
                                                        <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                                            {member.name?.[0] || 'U'}
                                                        </div>
                                                    )}
                                                </div>
                                            )) : (
                                                <span className="text-xs text-gray-400 italic">No members</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredGroups.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                        No groups found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
        )}
      </div>
    </>
  )
}

export default AdminGroups
