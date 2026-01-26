import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Globe, Home, HeadphonesIcon, CreditCard, Search, User, Plus, LogOut, Settings, LayoutDashboard, HelpCircle, ChevronDown, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const Navbar = () => {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const location = useLocation()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', session.user.id)
          .single()
        
        if (data) setProfile(data)
      }
    }
    
    fetchProfile()

    // Subscribe to realtime changes for instant updates
    const subscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        setProfile(payload.new)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [])

  const navLinks = [
    { to: '/', label: 'Inicio', icon: Home },
    { to: '/explore', label: 'Explorar', icon: Search }, // Changed to Explorer
    { to: '/soporte', label: 'Soporte', icon: HeadphonesIcon },
  ]

  const handleSearchClick = () => {
    navigate('/explore')
  }

  const handleCreateGroup = () => {
    navigate('/share-subscription')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 shadow-md" style={{ background: '#EF534F' }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[64px]">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <span className="text-white font-black text-xl">L</span>
            </div>
            <span className="text-white uppercase font-black text-base tracking-wider hidden sm:block">
              LowSplit
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2 bg-black/10 p-1 rounded-full backdrop-blur-sm">
            {navLinks.map((link) => {
              const IconComponent = link.icon
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm transition-all
                    ${isActive ? 'bg-white text-[#EF534F] shadow-sm' : 'text-white hover:bg-white/10'}`}
                >
                  <IconComponent className={`w-4 h-4 ${isActive ? 'text-[#EF534F]' : 'text-white'}`} strokeWidth={2.5} />
                  <span className="">{link.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Right side - Search, Language, User */}
          <div className="hidden md:flex items-center gap-3">
             {/* Share Button (CTA) */}
            <button 
              onClick={handleCreateGroup}
              className="px-5 py-2 rounded-full bg-black/20 text-white font-bold text-sm hover:bg-black/30 transition-all flex items-center gap-2 border border-white/10"
            >
                <Plus className="w-4 h-4" /> Compartir
            </button>

            {/* Search Button (Functional) */}
            <button 
              onClick={handleSearchClick}
              className="p-2.5 rounded-full hover:bg-white/20 transition-colors text-white/90 hover:text-white"
              aria-label="Buscar"
            >
              <Search className="w-5 h-5" strokeWidth={2.5} />
            </button>
            
            {/* Language */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors border border-white/20">
              <Globe className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-bold">ES</span>
            </button>
            
            {/* User Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-all border-2 border-transparent hover:border-white/20"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10">
                   {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                       <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <ChevronDown className={`w-3 h-3 text-white transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                  <div className="absolute top-full right-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-50">
                        <p className="text-sm font-bold text-gray-900 truncate">
                            {profile?.email || 'Usuario'}
                        </p>
                        <p className="text-xs text-gray-400">Información personal</p>
                    </div>

                    {/* Savings Banner */}
                    <div className="px-4 py-2">
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-3 flex items-center justify-between text-white shadow-lg shadow-gray-200">
                            <div>
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Ahorro Total</p>
                                <p className="text-lg font-black text-[#EF534F]">€0.00</p>
                            </div>
                            <Zap className="w-5 h-5 text-yellow-400" fill="currentColor" />
                        </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-2">
                         <Link 
                            to="/dashboard" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span className="text-sm font-medium">Mi Suscripción</span>
                         </Link>

                         <Link 
                            to="/soporte" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900"
                        >
                            <HelpCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Soporte</span>
                         </Link>

                         <Link 
                            to="/profile" 
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-gray-700 hover:text-gray-900"
                        >
                            <Settings className="w-4 h-4" />
                            <span className="text-sm font-medium">Configuración</span>
                         </Link>
                    </div>

                    <div className="border-t border-gray-50 mt-1 py-1">
                        <button 
                            onClick={async () => {
                                await supabase.auth.signOut()
                                setIsDropdownOpen(false)
                                navigate('/login')
                            }}
                            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition-colors text-gray-500 hover:text-red-500"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Cerrar sesión</span>
                        </button>
                    </div>

                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10" style={{ background: '#EF534F' }}>
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const IconComponent = link.icon
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-white font-medium transition-all
                    ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`}
                  onClick={() => setIsOpen(false)}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
            
            <hr className="border-white/10 my-2" />
            
            {/* Mobile Language & Search */}
            <div className="flex items-center gap-2 py-2">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
                <Globe className="w-5 h-5 text-white" />
                <span className="text-white text-sm">Español</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
                <Search className="w-5 h-5 text-white" />
                <span className="text-white text-sm">Buscar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
