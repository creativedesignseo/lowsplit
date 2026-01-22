import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Globe, Home, HeadphonesIcon, CreditCard, Search, User } from 'lucide-react'
import { useState } from 'react'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const navLinks = [
    { to: '/', label: 'Página de inicio', icon: Home },
    { to: '/soporte', label: 'Soporte post-venta', icon: HeadphonesIcon },
    { to: '/suscripcion', label: 'Suscripción', icon: CreditCard },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: '#EF534F' }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[50px]">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="text-white uppercase font-black text-sm tracking-wide">
              LowSplit
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const IconComponent = link.icon
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-white uppercase font-medium text-sm transition-all
                    ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden lg:inline">{link.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Right side - Search, Language, User */}
          <div className="hidden md:flex items-center gap-3">
            {/* Search */}
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <Search className="w-5 h-5 text-white" />
            </button>
            
            {/* Language */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10 transition-colors">
              <Globe className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">ES</span>
            </button>
            
            {/* User */}
            <Link to="/profile" className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
              <User className="w-5 h-5 text-white" />
            </Link>
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
