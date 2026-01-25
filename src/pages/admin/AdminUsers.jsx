import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Users, Search, Ban, CheckCircle, Shield, MoreHorizontal, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [currentUserRole, setCurrentUserRole] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      
      // Get My Role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      setCurrentUserRole(profile?.role)

      const response = await fetch('/.netlify/functions/admin-users', {
        headers: {
            'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      
      setUsers(data.users || [])
    } catch (err) {
      console.error('Fetch users error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return

    try {
        const response = await fetch('/.netlify/functions/admin-users', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'setRole',
                targetUserId: userId,
                value: newRole
            })
        })
        
        const data = await response.json()
        if (data.error) throw new Error(data.error)
        
        fetchUsers() // Refresh
        alert('Role updated successfully!')
    } catch (err) {
        alert('Action failed: ' + err.message)
    }
  }

  const handleBan = async (userId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'unban' : 'ban'} this user?`)) return

    try {
        const response = await fetch('/.netlify/functions/admin-users', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'ban',
                targetUserId: userId,
                value: !currentStatus // Toggle
            })
        })
        
        const data = await response.json()
        if (data.error) throw new Error(data.error)
        
        fetchUsers() // Refresh
    } catch (err) {
        alert('Action failed: ' + err.message)
    }
  }

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      <Helmet>
        <title>Manage Users - LowSplit Admin</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black text-gray-900">Users Directory</h1>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex items-center">
                <Search className="w-5 h-5 text-gray-400 ml-3" />
                <input 
                    type="text" 
                    placeholder="Search users..." 
                    className="border-none focus:ring-0 text-sm w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
                Error: {error}
            </div>
        )}

        {loading ? (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold overflow-hidden">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                user.email?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{user.full_name || 'No Name'}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                            <div className="text-[10px] text-gray-400 font-mono">ID: {user.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {currentUserRole === 'super_admin' && user.id !== session?.user?.id ? (
                                        <select 
                                            value={user.role || 'user'} 
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className={`
                                                text-xs font-bold uppercase border-none rounded-md px-2 py-1 cursor-pointer focus:ring-1 focus:ring-purple-500
                                                ${user.role === 'admin' || user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}
                                            `}
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                            <option value="super_admin">Super Admin</option>
                                        </select>
                                    ) : (
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase
                                            ${user.role === 'admin' || user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}
                                        `}>
                                            {user.role || 'User'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {user.banned_until && new Date(user.banned_until) > new Date() ? (
                                        <span className="flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-md w-fit">
                                            <Ban className="w-3 h-3" /> Banned
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-md w-fit">
                                            <CheckCircle className="w-3 h-3" /> Active
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {currentUserRole === 'super_admin' && (
                                        <button 
                                            onClick={() => handleBan(user.id, user.banned_until && new Date(user.banned_until) > new Date())}
                                            className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                            title="Ban/Unban User"
                                        >
                                            <Ban className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </>
  )
}

export default AdminUsers
