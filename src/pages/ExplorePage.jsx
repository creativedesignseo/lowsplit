import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { Search, LayoutGrid, Tv, Music, Bot, Monitor, GraduationCap, Sparkles, Loader2, Gamepad2, Shield, Users, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { MOCK_SERVICES } from '../lib/data'
import ServiceCard from '../components/ServiceCard'
import { getLogoUrl } from '../lib/utils'

// Categorías
const categories = [
  { id: 'todo', name: 'Todo', icon: LayoutGrid },
  { id: 'streaming', name: 'Streaming', icon: Tv },
  { id: 'music', name: 'Música', icon: Music },
  { id: 'gaming', name: 'Gaming', icon: Gamepad2 },
  { id: 'ai', name: 'IA', icon: Bot },
  { id: 'productivity', name: 'Productividad', icon: Monitor },
  { id: 'security', name: 'Seguridad', icon: Shield },
  { id: 'education', name: 'Educación', icon: GraduationCap },
  { id: 'bundle', name: 'Packs', icon: Sparkles },
]

const ExplorePage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('todo')
  const [viewMode, setViewMode] = useState('services') // 'services' | 'groups'

  // Fetch services from Supabase
  const { data: services = MOCK_SERVICES, isLoading: isLoadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
      
      if (error || !data || data.length === 0) return MOCK_SERVICES
      return data
    },
    initialData: MOCK_SERVICES
  })

  // Fetch available subscription groups from Supabase
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ['available-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_groups')
        .select(`
          id,
          title,
          slots_occupied,
          price_per_slot,
          status,
          admin_id,
          services (
            id,
            name,
            slug,
            category,
            max_slots,
            icon_url
          ),
          profiles:admin_id (
            username,
            reputation_score
          )
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Groups fetch error:', error)
        return []
      }
      return data || []
    }
  })

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          service.slug.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = activeCategory === 'todo' || service.category === activeCategory
    
    return matchesSearch && matchesCategory
  })

  // Filter groups
  const filteredGroups = groups.filter(group => {
    const serviceName = group.services?.name || ''
    const serviceSlug = group.services?.slug || ''
    const serviceCategory = group.services?.category || ''
    
    const matchesSearch = serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          serviceSlug.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = activeCategory === 'todo' || serviceCategory === activeCategory
    
    return matchesSearch && matchesCategory
  })

  const isLoading = isLoadingServices || isLoadingGroups

  return (
    <>
      <Helmet>
        <title>Explorar servicios - LowSplit</title>
        <meta name="description" content="Explora Netflix, Spotify, Disney+ y más. Encuentra suscripciones compartidas y ahorra hasta un 75%." />
      </Helmet>

      <div className="min-h-screen bg-[#FAFAFA] pt-[70px]">
        {/* Header */}
        <div className="bg-[#EF534F] py-16 relative overflow-hidden">
             {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-white rounded-full mix-blend-overlay blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-black rounded-full mix-blend-overlay blur-3xl"></div>
            </div>

          <div className="max-w-[1200px] mx-auto px-4 text-center relative z-10">
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-6 tracking-tight">
              Ahorra en tus suscripciones
            </h1>
            <p className="text-white/90 text-lg sm:text-xl max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
              Únete a +10,000 usuarios compartiendo gastos de forma segura.
              <br className="hidden sm:block"/> Encuentra tu grupo ideal en segundos.
            </p>
            
            {/* Search */}
            <div className="relative max-w-2xl mx-auto group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-[#EF534F] transition-colors" />
              <input
                type="text"
                placeholder="¿Qué servicio buscas? (ej. Netflix, Spotify...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white rounded-full pl-16 pr-6 py-5 text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-2xl transition-all"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="sticky top-[70px] z-30 bg-[#FAFAFA]/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="max-w-[1200px] mx-auto px-4 py-4">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide mask-fade-sides">
                {categories.map((category) => {
                const Icon = category.icon
                const isActive = activeCategory === category.id
                return (
                    <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all transform active:scale-95 ${
                        isActive
                        ? 'bg-[#EF534F] text-white shadow-lg shadow-red-200'
                        : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
                    }`}
                    >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    {category.name}
                    </button>
                )
                })}
            </div>
            </div>
        </div>

        {/* View Mode Toggle */}
        <div className="max-w-[1200px] mx-auto px-4 mt-8 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                   <h2 className="text-2xl font-bold text-gray-900">
                       {activeCategory === 'todo' ? 'Todos los servicios' : categories.find(c => c.id === activeCategory)?.name}
                   </h2>
                   <p className="text-gray-500 text-sm mt-1">
                       {viewMode === 'services' 
                         ? `${filteredServices.length} ${filteredServices.length === 1 ? 'servicio disponible' : 'servicios disponibles'}`
                         : `${filteredGroups.length} ${filteredGroups.length === 1 ? 'grupo disponible' : 'grupos disponibles'}`
                       }
                   </p>
                </div>
                
                {/* Toggle */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-full border border-gray-200 shadow-sm">
                    <button
                      onClick={() => setViewMode('services')}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        viewMode === 'services' ? 'bg-[#EF534F] text-white' : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Servicios
                    </button>
                    <button
                      onClick={() => setViewMode('groups')}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                        viewMode === 'groups' ? 'bg-[#EF534F] text-white' : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Grupos ({groups.length})
                    </button>
                </div>
            </div>
        </div>

        {/* Content */}
        {isLoading ? (
             <div className="min-h-[400px] flex items-center justify-center">
                  <p className="flex items-center gap-3 text-gray-400 bg-white px-6 py-3 rounded-full shadow-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-[#EF534F]" /> Cargando catálogo...
                  </p>
            </div>
        ) : (
          <div className="max-w-[1200px] mx-auto px-4 pb-24">
            
            {/* SERVICES VIEW */}
            {viewMode === 'services' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {filteredServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>

                {filteredServices.length === 0 && (
                  <div className="text-center py-32 bg-white rounded-[40px] border border-dashed border-gray-200 mt-8">
                    <div className="text-7xl mb-6 opacity-20">🕵️‍♂️</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No encontramos ese servicio</h3>
                    <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
                        Intenta con otro término o revisa las categorías para descubrir nuevas opciones.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        setActiveCategory('todo')
                      }}
                      className="px-8 py-3 bg-[#EF534F] text-white rounded-full font-bold hover:opacity-90 shadow-lg shadow-red-200 transition-all hover:scale-105"
                    >
                      Ver todo el catálogo
                    </button>
                  </div>
                )}
              </>
            )}

            {/* GROUPS VIEW */}
            {viewMode === 'groups' && (
              <>
                <div className="space-y-4">
                  {filteredGroups.map((group) => {
                    const service = group.services
                    const profile = group.profiles
                    const availableSlots = (service?.max_slots || 4) - (group.slots_occupied || 1)
                    
                    return (
                      <Link
                        key={group.id}
                        to={`/group/${group.id}`}
                        className="block bg-white p-4 sm:p-6 rounded-[20px] shadow-sm border border-gray-100 hover:border-[#EF534F]/30 transition-all group"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 overflow-hidden relative">
                              <img 
                                src={getLogoUrl(service?.slug)} 
                                alt={service?.name} 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#EF534F] transition-colors">
                                {group.title || service?.name}
                              </h3>
                              <div className="flex items-center gap-3 text-xs font-medium text-gray-500 mt-1">
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md">
                                  {availableSlots} {availableSlots === 1 ? 'plaza' : 'plazas'}
                                </span>
                                {profile?.username && (
                                  <span className="flex items-center gap-1">
                                    por @{profile.username}
                                    {profile.reputation_score >= 90 && (
                                      <span className="text-yellow-500">⭐</span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="text-right">
                              <p className="font-black text-[#EF534F] text-2xl">€{group.price_per_slot?.toFixed(2)}</p>
                              <p className="text-xs text-gray-400">/mes</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#EF534F] group-hover:bg-[#EF534F]/10 transition-all">
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {filteredGroups.length === 0 && (
                  <div className="text-center py-32 bg-white rounded-[40px] border border-dashed border-gray-200 mt-8">
                    <div className="text-7xl mb-6 opacity-20">👥</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No hay grupos disponibles</h3>
                    <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
                        Aún no hay grupos para este servicio. ¡Sé el primero en crear uno!
                    </p>
                    <Link
                      to="/share-subscription"
                      className="inline-block px-8 py-3 bg-[#EF534F] text-white rounded-full font-bold hover:opacity-90 shadow-lg shadow-red-200 transition-all hover:scale-105"
                    >
                      Crear un grupo
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default ExplorePage
