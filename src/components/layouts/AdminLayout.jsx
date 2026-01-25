import { useState, useEffect } from 'react'
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { LayoutDashboard, Users, ShieldAlert, Package, LogOut, Loader2 } from 'lucide-react'

const AdminLayout = () => {
  const [isAdmin, setIsAdmin] = useState(null) // null = loading
  const [loading, setLoading] = useState(true)
  const location = useLocation()
  const [debugInfo, setDebugInfo] = useState({ email: '', role: '' })

  useEffect(() => {
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setIsAdmin(null)
        setLoading(false)
        return
      }

      // 1. Check DB Role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (error) {
          console.error('Supabase Error:', error)
          setDebugInfo({ 
            email: session.user.email,
            userId: session.user.id,
            role: 'Error',
            error: error.message || JSON.stringify(error)
          })
          setIsAdmin(false)
          return
      }

      // Update Debug Info
      setDebugInfo({ 
          email: session.user.email, 
          userId: session.user.id,
          role: profile?.role || 'No role found',
          error: null
      })

      // Strict Database Role Check
      const hasRole = profile?.role === 'admin' || profile?.role === 'super_admin'
      
      console.log('Admin Check:', session.user.email, profile?.role, hasRole)
      setIsAdmin(hasRole)

    } catch (error) {
      console.error('Admin check error:', error)
      setDebugInfo(prev => ({ ...prev, error: error.message }))
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a0a0a] text-white hidden md:flex flex-col">
        <div className="p-6">
          <Link to="/" className="text-2xl font-black tracking-tighter text-white">
            LowSplit<span className="text-[#EF534F] text-xs align-top ml-1">ADMIN</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
           <Link to="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-900 border border-transparent transition-colors ${location.pathname === '/admin' ? 'bg-gray-900 border-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>
              <LayoutDashboard className="w-5 h-5 text-[#EF534F]" />
              Dashboard
           </Link>
           <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-900 text-gray-400 hover:text-white transition-colors">
              <Users className="w-5 h-5" />
              Users
           </Link>
           <Link to="/admin/groups" className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-900 border border-transparent transition-colors ${location.pathname === '/admin/groups' ? 'bg-gray-900 border-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>
              <Users className="w-5 h-5" />
              Groups (Global)
           </Link>
           <Link to="/admin/stock" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-900 text-gray-400 hover:text-white transition-colors">
              <Package className="w-5 h-5" />
              Stock Market
           </Link>
           <Link to="/admin/audit" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-900 text-gray-400 hover:text-white transition-colors">
              <ShieldAlert className="w-5 h-5" />
              Audit (Bizum)
           </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
           <button className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors w-full px-4 py-2">
              <LogOut className="w-5 h-5" />
              <span>Back to App</span>
           </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
